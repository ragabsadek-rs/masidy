import { NextResponse } from "next/server";

const VERCEL_API = "https://api.vercel.com";
const TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const TEAM = process.env.VERCEL_TEAM_ID;
const PROJECT_ID = "prj_tw61YQKrLvVCogF6jdaCIsOBKDPA";

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

// Mock data returned when env vars are missing
function mockData() {
  const now = Date.now();
  const timeSeries = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10),
    pageviews: Math.floor(Math.random() * 400 + 100),
    visitors: Math.floor(Math.random() * 200 + 50),
  }));

  return {
    mock: true,
    pageviews: 3842,
    visitors: 1291,
    topPages: [
      { path: "/", pageviews: 1420, visitors: 890 },
      { path: "/dashboard", pageviews: 820, visitors: 410 },
      { path: "/builder", pageviews: 640, visitors: 320 },
      { path: "/pricing", pageviews: 510, visitors: 280 },
      { path: "/blog", pageviews: 452, visitors: 210 },
    ],
    timeSeries,
  };
}

export async function GET() {
  // Return mock data if env vars are not configured
  if (!TOKEN || !TEAM) {
    return NextResponse.json(mockData());
  }

  try {
    const now = new Date();
    const from = new Date(now.getTime() - 14 * 86400000).toISOString();
    const to = now.toISOString();

    const qs = new URLSearchParams({
      teamId: TEAM,
      projectId: PROJECT_ID,
      from,
      to,
      limit: "100",
    });

    const pageviewsQs = new URLSearchParams({
      teamId: TEAM,
      projectId: PROJECT_ID,
    });

    // Fetch time-series events and pageviews summary in parallel
    const [eventsRes, pageviewsRes] = await Promise.all([
      fetch(`${VERCEL_API}/v1/web/analytics?${qs.toString()}`, {
        headers: headers(),
        next: { revalidate: 300 },
      }),
      fetch(`${VERCEL_API}/v1/web/analytics/pageviews?${pageviewsQs.toString()}`, {
        headers: headers(),
        next: { revalidate: 300 },
      }),
    ]);

    // If either call fails, fall back to mock
    if (!eventsRes.ok || !pageviewsRes.ok) {
      return NextResponse.json(mockData());
    }

    const [eventsData, pageviewsData] = await Promise.all([
      eventsRes.json(),
      pageviewsRes.json(),
    ]);

    // Aggregate time-series from events
    const byDate: Record<string, { pageviews: number; visitors: Set<string> }> = {};
    const events: Array<{ timestamp: string; path: string; sessionId?: string }> =
      eventsData.events ?? eventsData.data ?? [];

    for (const event of events) {
      const date = event.timestamp?.slice(0, 10) ?? "";
      if (!date) continue;
      if (!byDate[date]) byDate[date] = { pageviews: 0, visitors: new Set() };
      byDate[date].pageviews++;
      if (event.sessionId) byDate[date].visitors.add(event.sessionId);
    }

    const timeSeries = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        pageviews: v.pageviews,
        visitors: v.visitors.size,
      }));

    // Aggregate top pages
    const pageCount: Record<string, { pageviews: number; visitors: Set<string> }> = {};
    for (const event of events) {
      const path = event.path ?? "/";
      if (!pageCount[path]) pageCount[path] = { pageviews: 0, visitors: new Set() };
      pageCount[path].pageviews++;
      if (event.sessionId) pageCount[path].visitors.add(event.sessionId);
    }

    const topPages = Object.entries(pageCount)
      .sort(([, a], [, b]) => b.pageviews - a.pageviews)
      .slice(0, 10)
      .map(([path, v]) => ({
        path,
        pageviews: v.pageviews,
        visitors: v.visitors.size,
      }));

    // Totals — prefer the dedicated pageviews endpoint if available
    const totalPageviews =
      pageviewsData?.total ?? pageviewsData?.pageviews ?? events.length;
    const uniqueVisitors =
      pageviewsData?.uniqueVisitors ??
      new Set(events.map((e) => e.sessionId).filter(Boolean)).size;

    return NextResponse.json({
      mock: false,
      pageviews: totalPageviews,
      visitors: uniqueVisitors,
      topPages,
      timeSeries,
    });
  } catch {
    // On any unexpected error, return mock so the UI always has something to show
    return NextResponse.json(mockData());
  }
}
