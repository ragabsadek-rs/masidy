// Vercel API client — all calls go through your team token server-side only
const VERCEL_API = "https://api.vercel.com";
const TOKEN = process.env.VERCEL_ACCESS_TOKEN!;
const TEAM = process.env.VERCEL_TEAM_ID!;
const PROJECT_ID = "prj_tw61YQKrLvVCogF6jdaCIsOBKDPA";

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

function qs(extra: Record<string, string> = {}) {
  const p = new URLSearchParams({ teamId: TEAM, ...extra });
  return `?${p.toString()}`;
}

// ── Deployments ────────────────────────────────────────────────────────────
export async function getDeployments(limit = 20) {
  const res = await fetch(
    `${VERCEL_API}/v6/deployments${qs({ projectId: PROJECT_ID, limit: String(limit) })}`,
    { headers: headers(), next: { revalidate: 30 } }
  );
  const data = await res.json();
  return data.deployments ?? [];
}

export async function getDeployment(id: string) {
  const res = await fetch(
    `${VERCEL_API}/v13/deployments/${id}${qs()}`,
    { headers: headers(), next: { revalidate: 10 } }
  );
  return res.json();
}

export async function getDeploymentLogs(id: string) {
  const res = await fetch(
    `${VERCEL_API}/v2/deployments/${id}/events${qs()}`,
    { headers: headers() }
  );
  return res.json();
}

// ── Domains ────────────────────────────────────────────────────────────────
export async function getDomains() {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains${qs()}`,
    { headers: headers(), next: { revalidate: 60 } }
  );
  const data = await res.json();
  return data.domains ?? [];
}

export async function addDomain(domain: string) {
  const res = await fetch(
    `${VERCEL_API}/v10/projects/${PROJECT_ID}/domains${qs()}`,
    { method: "POST", headers: headers(), body: JSON.stringify({ name: domain }) }
  );
  return res.json();
}

export async function removeDomain(domain: string) {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${PROJECT_ID}/domains/${domain}${qs()}`,
    { method: "DELETE", headers: headers() }
  );
  return res.json();
}

// ── Environment Variables ──────────────────────────────────────────────────
export async function getEnvVars() {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${PROJECT_ID}/env${qs()}`,
    { headers: headers(), next: { revalidate: 30 } }
  );
  const data = await res.json();
  return data.envs ?? [];
}

export async function createEnvVar(key: string, value: string, target: string[]) {
  const res = await fetch(
    `${VERCEL_API}/v10/projects/${PROJECT_ID}/env${qs()}`,
    {
      method: "POST", headers: headers(),
      body: JSON.stringify({ key, value, type: "encrypted", target }),
    }
  );
  return res.json();
}

export async function deleteEnvVar(id: string) {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${PROJECT_ID}/env/${id}${qs()}`,
    { method: "DELETE", headers: headers() }
  );
  return res.json();
}

// ── Analytics ──────────────────────────────────────────────────────────────
export async function getAnalytics(period = "day") {
  const res = await fetch(
    `${VERCEL_API}/v1/web/analytics${qs({ projectId: PROJECT_ID, period })}`,
    { headers: headers(), next: { revalidate: 300 } }
  );
  if (!res.ok) return null;
  return res.json();
}

// ── Project info ───────────────────────────────────────────────────────────
export async function getProject() {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${PROJECT_ID}${qs()}`,
    { headers: headers(), next: { revalidate: 60 } }
  );
  return res.json();
}

// ── Firewall ───────────────────────────────────────────────────────────────
export async function getFirewallRules() {
  const res = await fetch(
    `${VERCEL_API}/v1/security/firewall/config${qs({ projectId: PROJECT_ID })}`,
    { headers: headers(), next: { revalidate: 60 } }
  );
  if (!res.ok) return { rules: [] };
  return res.json();
}

// ── Edge Config ────────────────────────────────────────────────────────────
export async function getEdgeConfigs() {
  const res = await fetch(
    `${VERCEL_API}/v1/edge-config${qs()}`,
    { headers: headers(), next: { revalidate: 60 } }
  );
  const data = await res.json();
  return data.edgeConfigs ?? [];
}

// ── Integrations ───────────────────────────────────────────────────────────
export async function getIntegrations() {
  const res = await fetch(
    `${VERCEL_API}/v1/integrations/installations${qs()}`,
    { headers: headers(), next: { revalidate: 120 } }
  );
  const data = await res.json();
  return data.installations ?? [];
}

// ── Storage (KV / Blob / Postgres) ────────────────────────────────────────
export async function getStorages() {
  const res = await fetch(
    `${VERCEL_API}/v1/storage/stores${qs()}`,
    { headers: headers(), next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.stores ?? [];
}

// ── Rollback ───────────────────────────────────────────────────────────────
export async function rollbackDeployment(deploymentId: string) {
  const res = await fetch(
    `${VERCEL_API}/v9/projects/${PROJECT_ID}/rollback/${deploymentId}${qs()}`,
    { method: "POST", headers: headers() }
  );
  return res.json();
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function deploymentStatusColor(state: string) {
  switch (state) {
    case "READY": return "bg-green-500";
    case "ERROR": return "bg-red-500";
    case "BUILDING": return "bg-yellow-500";
    case "CANCELED": return "bg-foreground/30";
    default: return "bg-foreground/20";
  }
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
