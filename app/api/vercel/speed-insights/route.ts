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

interface TimeSeriesPoint {
  date: string;
  lcp: number;
  fcp: number;
  cls: number;
  ttfb: number;
}

// Mock data returned when env vars are missing
function mockData() {
  const now = Date.now();
  const timeSeries: TimeSeriesPoint[] = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10),
    lcp: parseFloat((1.8 + Math.random() * 1.5).toFixed(2)),
    fcp: parseFloat((0.9 + Math.random() * 0.8).toFixed(2)),
    cls: parseFloat((0.05 + Math.random() * 0.15).toFixed(3)),
    ttfb: parseFloat((0.3 + Math.random() * 0.6).toFixed(2)),
  }));

  return {
    mock: true,
    score: 82,
    lcp: 2.1,
    fid: 45,
    cls: 0.08,
    fcp: 1.4,
    ttfb: 0.52,
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
    });

    const res = await fetch(
      `${VERCEL_API}/v1/speed-insights/data?${qs.toString()}`,
      {
        headers: headers(),
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(mockData());
    }

    const raw = await res.json();

    // Vercel Speed Insights API returns aggregated metric data.
    // Shape varies by API version — normalise defensively.
    const metrics = raw?.metrics ?? raw?.data ?? raw ?? {};

    const lcp = metrics.lcp?.p75 ?? metrics.lcp ?? null;
    const fid = metrics.fid?.p75 ?? metrics.fid ?? null;
    const cls = metrics.cls?.p75 ?? metrics.cls ?? null;
    const fcp = metrics.fcp?.p75 ?? metrics.fcp ?? null;
    const ttfb = metrics.ttfb?.p75 ?? metrics.ttfb ?? null;

    // Build time-series from the raw data if available
    const rawSeries: Array<Record<string, unknown>> =
      raw?.timeSeries ?? raw?.series ?? [];

    const timeSeries: TimeSeriesPoint[] = rawSeries.map((point) => ({
      date: String(point.date ?? point.timestamp ?? "").slice(0, 10),
      lcp: Number(point.lcp ?? 0),
      fcp: Number(point.fcp ?? 0),
      cls: Number(point.cls ?? 0),
      ttfb: Number(point.ttfb ?? 0),
    }));

    // Compute a simple performance score (0–100) from the vitals
    const lcpScore = lcp !== null ? Math.max(0, 100 - ((lcp - 2.5) / 2.5) * 50) : null;
    const clsScore = cls !== null ? Math.max(0, 100 - (cls / 0.25) * 50) : null;
    const fidScore = fid !== null ? Math.max(0, 100 - ((fid - 100) / 200) * 50) : null;
    const scores = [lcpScore, clsScore, fidScore].filter((s): s is number => s !== null);
    const score =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    return NextResponse.json({
      mock: false,
      score,
      lcp,
      fid,
      cls,
      fcp,
      ttfb,
      timeSeries,
    });
  } catch {
    // On any unexpected error, return mock so the UI always has something to show
    return NextResponse.json(mockData());
  }
}
