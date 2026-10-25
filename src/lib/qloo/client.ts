import { createHash } from "node:crypto";
import { loadLocalEnv } from "@/lib/load-env";
import { QlooConfigError, QlooHttpError, errorForStatus } from "@/lib/qloo/errors";
import { normalizeEntities } from "@/lib/qloo/normalize";
import { playbackBody } from "@/lib/qloo/playback";

const HACKATHON_ORIGIN = "https://hackathon.api.qloo.com";
const ALLOWED_PATHS = new Set(["/search", "/v2/tags", "/v2/insights"]);
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry = { expires: number; body: unknown };

const cache = new Map<string, CacheEntry>();
const LIVE_PER_SECOND = 8;
const recentLiveCalls: number[] = [];
let liveGate: Promise<void> = Promise.resolve();

export function retryWaitMs(resetHeader: string | null) {
  const seconds = resetHeader ? Number(resetHeader) : Number.NaN;
  const ms = Number.isFinite(seconds) ? seconds * 1000 : 1000;
  return Math.min(Math.max(ms, 250), 2000);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reserveLiveSlot() {
  const run = liveGate.then(async () => {
    let now = Date.now();
    while (recentLiveCalls.length > 0 && now - recentLiveCalls[0] >= 1000) recentLiveCalls.shift();
    if (recentLiveCalls.length >= LIVE_PER_SECOND) {
      await sleep(1000 - (now - recentLiveCalls[0]) + 50);
      now = Date.now();
      while (recentLiveCalls.length > 0 && now - recentLiveCalls[0] >= 1000) recentLiveCalls.shift();
    }
    recentLiveCalls.push(now);
  });
  liveGate = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function qlooMode(): "live" | "fixture" {
  loadLocalEnv();
  return process.env.QLOO_API_KEY ? "live" : "fixture";
}

export function qlooBaseUrl(): string {
  loadLocalEnv();
  const raw = process.env.QLOO_BASE_URL?.trim() || HACKATHON_ORIGIN;
  let origin: string;
  try {
    origin = new URL(raw).origin;
  } catch {
    throw new QlooConfigError("QLOO_BASE_URL is not a URL.");
  }
  if (origin !== HACKATHON_ORIGIN) {
    throw new QlooConfigError(`Qloo calls stay on ${HACKATHON_ORIGIN}.`);
  }
  return origin;
}

function assertPath(path: string) {
  if (path.includes("/recs") || path.includes("/recommendations")) {
    throw new QlooConfigError("Qloo /recs and /recommendations are not used.");
  }
  if (!ALLOWED_PATHS.has(path)) {
    throw new QlooConfigError(`Qloo path ${path} is not used.`);
  }
}

function cacheKey(path: string, params: Record<string, string>) {
  const query = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha256").update(`${path}?${query}`).digest("hex");
}

function logHop(entry: {
  path: string;
  params: Record<string, string>;
  status: number;
  entityCount: number;
  durationMs: number;
  source: "live" | "fixture" | "cache";
  quota?: Record<string, string>;
}) {
  console.info(
    JSON.stringify({
      path: entry.path,
      filterType: entry.params["filter.type"] ?? null,
      paramKeys: Object.keys(entry.params).sort(),
      status: entry.status,
      entityCount: entry.entityCount,
      durationMs: entry.durationMs,
      source: entry.source,
      ...(entry.quota && Object.keys(entry.quota).length > 0 ? { quota: entry.quota } : {}),
    }),
  );
}

function quotaHeaders(response: Response) {
  const key = process.env.QLOO_API_KEY ?? "";
  const quota: Record<string, string> = {};
  for (const [name, value] of response.headers) {
    if (!/rate|quota|limit|remaining/i.test(name)) continue;
    if (key && value.includes(key)) continue;
    quota[name] = value;
  }
  return quota;
}

async function fetchLive(url: string, path: string): Promise<{ status: number; body: unknown; quota: Record<string, string> }> {
  const key = process.env.QLOO_API_KEY;
  if (!key) throw new QlooConfigError("QLOO_API_KEY is missing.");

  const request = () =>
    fetch(url, {
      method: "GET",
      headers: { "X-Api-Key": key, Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });

  await reserveLiveSlot();
  let response = await request();
  if (response.status === 429 || response.status >= 500) {
    await sleep(retryWaitMs(response.headers.get("x-second-ratelimit-reset")));
    await reserveLiveSlot();
    response = await request();
  }
  if (response.status === 429 || response.status >= 500) {
    throw new QlooHttpError(response.status, `Qloo request failed (${response.status}).`, path);
  }

  const typed = errorForStatus(response.status, path);
  if (typed) throw typed;

  const body: unknown = await response.json();
  return { status: response.status, body, quota: quotaHeaders(response) };
}

export async function qlooGet(path: string, params: Record<string, string>): Promise<unknown> {
  assertPath(path);
  const started = Date.now();
  const key = cacheKey(path, params);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    logHop({
      path,
      params,
      status: 200,
      entityCount: normalizeEntities(cached.body).length,
      durationMs: Date.now() - started,
      source: "cache",
    });
    return cached.body;
  }

  const mode = qlooMode();
  const result =
    mode === "fixture"
      ? { status: 200, body: playbackBody(path, params), quota: {} }
      : await fetchLive(`${qlooBaseUrl()}${path}?${new URLSearchParams(params)}`, path);

  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, body: result.body });
  logHop({
    path,
    params,
    status: result.status,
    entityCount: normalizeEntities(result.body).length,
    durationMs: Date.now() - started,
    source: mode,
    quota: result.quota,
  });
  return result.body;
}
