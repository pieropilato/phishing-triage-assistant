import { NextResponse } from "next/server";
import { TriageRequestSchema, MAX_EMAIL_CHARS } from "@/lib/schema";
import { getAiConfig, createModelCaller } from "@/lib/ai";
import { triageEmail } from "@/lib/triage";
import { createRateLimiter } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const limiter = createRateLimiter(10, 60_000); // 10 requests per minute per IP
const MAX_BODY_BYTES = MAX_EMAIL_CHARS * 4 + 1024;

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function error(status: number, message: string, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json({ error: message }, { status, headers: extraHeaders });
}

export async function POST(req: Request) {
  const started = Date.now();

  const rl = limiter(clientIp(req));
  if (!rl.allowed) {
    return error(429, `Too many requests. Try again in ${rl.retryAfterSec}s.`, { "Retry-After": String(rl.retryAfterSec) });
  }

  const length = Number(req.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return error(413, "Request is too large.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(400, "Request body must be JSON.");
  }

  const parsed = TriageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return error(400, parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const cfg = getAiConfig();
  try {
    const result = await triageEmail(parsed.data.email, cfg ? createModelCaller(cfg) : null, cfg?.model ?? null);
    // Structured log for monitoring. Never log the email content itself.
    console.log(
      JSON.stringify({
        event: "triage",
        verdict: result.verdict,
        aiUsed: result.aiUsed,
        aiError: result.aiError,
        guardrail: result.guardrailApplied,
        signals: result.signals.length,
        chars: parsed.data.email.length,
        ms: Date.now() - started,
      }),
    );
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(JSON.stringify({ event: "triage_error", name: err instanceof Error ? err.name : "unknown", ms: Date.now() - started }));
    return error(500, "Something went wrong while analysing the email. Please try again.");
  }
}

export function GET() {
  return NextResponse.json({ status: "ok", ai: getAiConfig() ? "configured" : "not configured" });
}
