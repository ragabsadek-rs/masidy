import { NextResponse } from "next/server";

const VERCEL_API = "https://api.vercel.com";
const TOKEN = process.env.VERCEL_ACCESS_TOKEN;
const TEAM = process.env.VERCEL_TEAM_ID;

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

interface TimeSeriesPoint {
  date: string;
  edgeRequests: number;
  functionInvocations: number;
}

// Mock data returned when env vars are missing
function mockData() {
  const now = Date.now();
  const timeSeries: TimeSeriesPoint[] = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10),
    edgeRequests: Math.floor(Math.random() * 8000 + 2000),
    functionInvocations: Math.floor(Math.random() * 3000 + 500),
  }));

  return {
    mock: true,
    edgeRequests: 48291,
    functionInvocations: 12847,
    errorRate: 0.42,
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
    const from = new Date(now.getTime() - 24 * 3600000).toISOString();
    const to = now.toISOString();

    const edgeQs = new URLSearchParams({ teamId: TEAM, from, to });
    const fnQs = new URLSearchParams({ teamId: TEAM, from, to });

    // Fetch edge requests and function invocations in parallel
    const [edgeRes, fnRes] = await Promise.all([
      fetch(`${VERCEL_API}/v1/edge-network/requests?${edgeQs.toString()}`, {
        headers: headers(),
        next: { revalidate: 300 },
      }),
      fetch(`${VERCEL_API}/v1/functions/invocations?${fnQs.toString()}`, {
        headers: headers(),
        next: { revalidate: 300 },
      }),
    ]);

    // Fall back to mock if either call fails
    if (!edgeRes.ok || !fnRes.ok) {
      return NextResponse.json(mockData());
    }

    const [edgeData, fnData] = await Promise.all([
      edgeRes.json(),
      fnRes.json(),
    ]);

    // Normalise totals — Vercel API shape varies by version
    const edgeRequests: number =
      edgeData?.total ?? edgeData?.count ?? edgeData?.requests ?? 0;
    const functionInvocations: number =
      fnData?.total ?? fnData?.count ?? fnData?.invocations ?? 0;

    // Error rate: errors / total edge requests (as a percentage)
    const edgeErrors: number =
      edgeData?.errors ?? edgeData?.errorCount ?? 0;
    const errorRate: number =
      edgeRequests > 0
        ? parseFloat(((edgeErrors / edgeRequests) * 100).toFixed(2))
        : 0;

    // Build time-series from raw data if available
    const rawEdgeSeries: Array<Record<string, unknown>> =
      edgeData?.timeSeries ?? edgeData?.series ?? [];
    const rawFnSeries: Array<Record<string, unknown>> =
      fnData?.timeSeries ?? fnData?.series ?? [];

    // Merge both series by date
    const byDate: Record<string, { edgeRequests: number; functionInvocations: number }> = {};

    for (const point of rawEdgeSeries) {
      const date = String(point.date ?? point.timestamp ?? "").slice(0, 10);
      if (!date) continue;
      if (!byDate[date]) byDate[date] = { edgeRequests: 0, functionInvocations: 0 };
      byDate[date].edgeRequests += Number(point.count ?? point.requests ?? point.value ?? 0);
    }

    for (const point of rawFnSeries) {
      const date = String(point.date ?? point.timestamp ?? "").slice(0, 10);
      if (!date) continue;
      if (!byDate[date]) byDate[date] = { edgeRequests: 0, functionInvocations: 0 };
      byDate[date].functionInvocations += Number(point.count ?? point.invocations ?? point.value ?? 0);
    }

    const timeSeries: TimeSeriesPoint[] = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    return NextResponse.json({
      mock: false,
      edgeRequests,
      functionInvocations,
      errorRate,
      timeSeries,
    });
  } catch {
    // On any unexpected error, return mock so the UI always has something to show
    return NextResponse.json(mockData());
  }
}
