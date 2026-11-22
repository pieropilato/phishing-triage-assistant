// Deterministic red-flag checks. These run before the AI call, are shown to the user
// as evidence, and act as a guardrail on the AI verdict.

import type { ParsedEmail } from "./headers";
import { sameOrgDomain } from "./headers";
import { hostOf, isValidIpv4, type Iocs } from "./ioc";

export type Severity = "high" | "medium" | "low";

export interface Signal {
  id: string;
  severity: Severity;
  description: string;
}

export type Verdict = "phishing" | "suspicious" | "spam" | "legitimate";

const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "rebrand.ly", "shorturl.at", "rb.gy"];
const RISKY_TLDS = ["zip", "mov", "top", "xyz", "click", "country", "gq", "tk", "ml", "cf", "work", "rest", "cam"];
const FREEMAIL = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "proton.me", "protonmail.com", "aol.com", "gmx.com", "mail.com", "icloud.com"];

// Brand token -> official domains. Used for look-alike and display-name checks.
const BRANDS: Record<string, string[]> = {
  microsoft: ["microsoft.com", "office.com", "live.com", "microsoftonline.com", "outlook.com"],
  office365: ["microsoft.com", "office.com"],
  paypal: ["paypal.com"],
  docusign: ["docusign.com", "docusign.net"],
  dhl: ["dhl.com"],
  fedex: ["fedex.com"],
  amazon: ["amazon.com"],
  apple: ["apple.com", "icloud.com"],
  google: ["google.com", "gmail.com"],
  netflix: ["netflix.com"],
  linkedin: ["linkedin.com"],
};

const URGENCY = /\b(urgent|immediately|asap|within 24 hours|within 48 hours|final (notice|warning)|account (will be )?(suspended|locked|disabled|closed)|act now|expires? today|unusual (sign[- ]in|activity))\b/i;
const CREDENTIALS = /\b(verify your (account|identity|password)|confirm your (password|credentials|account)|re-?enter your password|update your (password|payment|billing)|sign in to (keep|avoid|restore)|password (expires|will expire)|mfa code|one[- ]time code|login credentials)\b/i;
const PAYMENT = /\b(wire transfer|bank (details|account) (have |has )?(changed|updated)|new bank (details|account)|gift cards?|outstanding invoice|overdue invoice|payment (is )?overdue|change of (bank|payment) details|remittance)\b/i;
const INJECTION = /(ignore (all |any )?(previous|prior|above) (instructions|prompts)|disregard (the )?(system|previous) (prompt|instructions)|you are (an? )?(ai|assistant|language model)|classify this (email|message) as (safe|legitimate|benign)|respond with ["']?legitimate)/i;
const RISKY_ATTACHMENT = /\b[\w-]+\.(exe|scr|js|vbs|iso|img|hta|lnk|html?|xlsm|docm)\b/i;

/** Normalises common character swaps used in look-alike domains (0->o, 3->e, rn->m, vv->w). */
export function normaliseLookalike(domain: string, one: "l" | "i" = "l"): string {
  return domain.toLowerCase().replace(/0/g, "o").replace(/1/g, one).replace(/3/g, "e").replace(/rn/g, "m").replace(/vv/g, "w");
}

/** Returns the imitated brand when a domain mentions a brand but is not one of its official domains. */
export function isLookalike(domain: string): string | null {
  const d = domain.toLowerCase();
  // The digit 1 can stand for "l" (paypa1) or "i" (m1crosoft), so check both readings.
  const variants = [normaliseLookalike(d, "l"), normaliseLookalike(d, "i")];
  for (const [brand, official] of Object.entries(BRANDS)) {
    if (official.some((o) => d === o || d.endsWith("." + o))) continue;
    if (variants.some((v) => v.includes(brand))) return brand;
  }
  return null;
}

function tldOf(domain: string): string {
  return domain.split(".").pop() ?? "";
}

export function detectSignals(email: ParsedEmail, iocs: Iocs, rawText: string): Signal[] {
  const signals: Signal[] = [];
  const add = (id: string, severity: Severity, description: string) => {
    if (!signals.some((s) => s.id === id)) signals.push({ id, severity, description });
  };
  const text = `${email.subject}\n${email.body}`;

  // --- Header checks ---
  if (email.from && email.replyTo && !sameOrgDomain(email.from.domain, email.replyTo.domain)) {
    add("reply_to_mismatch", "high", `Reply-To (${email.replyTo.domain}) differs from From (${email.from.domain}); replies go somewhere else.`);
  }
  if (email.from && email.returnPath && !sameOrgDomain(email.from.domain, email.returnPath.domain)) {
    add("return_path_mismatch", "low", `Return-Path domain (${email.returnPath.domain}) differs from From domain (${email.from.domain}).`);
  }
  if (email.auth.dmarc === "fail") add("dmarc_fail", "high", "DMARC failed: the sender domain did not authorise this message.");
  if (email.auth.spf === "fail" || email.auth.spf === "softfail") add("spf_fail", "medium", `SPF ${email.auth.spf}: sending server is not authorised for the domain.`);
  if (email.auth.dkim === "fail") add("dkim_fail", "medium", "DKIM signature failed: content or sender may have been altered.");

  if (email.from) {
    const nameLower = email.from.name.toLowerCase();
    const brandInName = Object.keys(BRANDS).find((b) => nameLower.includes(b));
    if (brandInName && !BRANDS[brandInName].some((o) => email.from!.domain === o || email.from!.domain.endsWith("." + o))) {
      add("display_name_spoof", "high", `Display name mentions "${brandInName}" but the address is ${email.from.address}.`);
    }
    const embedded = email.from.name.match(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/);
    if (embedded && !sameOrgDomain(embedded[1], email.from.domain)) {
      add("display_name_address", "high", `Display name shows a different address (${embedded[0]}) than the real sender.`);
    }
    if (FREEMAIL.includes(email.from.domain) && /\b(it support|helpdesk|help desk|hr department|payroll|ceo|cfo|finance team|security team)\b/i.test(email.from.name + " " + text)) {
      add("freemail_corporate_claim", "medium", `Claims to be an internal/corporate team but uses a free mailbox (${email.from.domain}).`);
    }
    const lookFrom = isLookalike(email.from.domain);
    if (lookFrom) add("lookalike_sender", "high", `Sender domain ${email.from.domain} imitates ${lookFrom}.`);
  }

  // --- URL and domain checks ---
  for (const url of iocs.urls) {
    const host = hostOf(url);
    if (!host) continue;
    if (isValidIpv4(host)) add("ip_url", "high", `Link points to a raw IP address (${host}) instead of a domain.`);
    if (host.includes("xn--")) add("punycode_domain", "high", `Link uses an internationalised (punycode) domain: ${host}.`);
    if (SHORTENERS.includes(host)) add("url_shortener", "medium", `Link uses a URL shortener (${host}) that hides the destination.`);
    if (RISKY_TLDS.includes(tldOf(host))) add("risky_tld", "low", `Link uses a top-level domain often abused for phishing (.${tldOf(host)}).`);
    const look = isLookalike(host);
    if (look) add("lookalike_link", "high", `Link domain ${host} imitates ${look}.`);
  }

  // HTML anchors whose visible text shows a different domain than the real target.
  const anchorRe = /<a[^>]+href=["']?(https?:\/\/[^"'\s>]+)["']?[^>]*>([^<]+)<\/a>/gi;
  for (const m of rawText.matchAll(anchorRe)) {
    const target = hostOf(m[1]);
    const shown = m[2].match(/([a-z0-9-]+\.)+[a-z]{2,}/i)?.[0];
    if (target && shown && !sameOrgDomain(target, shown.toLowerCase())) {
      add("link_text_mismatch", "high", `Link text shows ${shown} but actually opens ${target}.`);
    }
  }

  // --- Content checks ---
  if (URGENCY.test(text)) add("urgency_language", "medium", "Uses urgency or threat language to rush the reader.");
  if (CREDENTIALS.test(text)) add("credential_request", "high", "Asks the reader to sign in, verify or update credentials.");
  if (PAYMENT.test(text)) add("payment_request", "high", "Mentions payment changes, invoices or gift cards (common in BEC fraud).");
  if (RISKY_ATTACHMENT.test(text)) add("risky_attachment", "medium", "Mentions a file type often used to deliver malware.");
  if (INJECTION.test(rawText)) add("prompt_injection", "high", "Contains text that tries to instruct an AI tool (prompt injection).");

  return signals;
}

export function countBySeverity(signals: Signal[]): Record<Severity, number> {
  return {
    high: signals.filter((s) => s.severity === "high").length,
    medium: signals.filter((s) => s.severity === "medium").length,
    low: signals.filter((s) => s.severity === "low").length,
  };
}

const RANK: Record<Verdict, number> = { legitimate: 0, spam: 1, suspicious: 2, phishing: 3 };

/**
 * Guardrail: the AI cannot downgrade an email below what the hard evidence supports.
 * - 1+ high-severity signal and AI says "legitimate"  -> raise to "suspicious"
 * - 2+ high-severity signals and AI below "suspicious" -> raise to "suspicious"
 * - prompt injection detected                          -> at least "suspicious"
 */
export function applyGuardrail(aiVerdict: Verdict, signals: Signal[]): { verdict: Verdict; applied: boolean } {
  const { high } = countBySeverity(signals);
  const injection = signals.some((s) => s.id === "prompt_injection");
  let floor: Verdict = "legitimate";
  if (high >= 1) floor = "spam";
  if (high >= 1 && aiVerdict === "legitimate") floor = "suspicious";
  if (high >= 2 || injection) floor = "suspicious";
  if (RANK[aiVerdict] >= RANK[floor]) return { verdict: aiVerdict, applied: false };
  return { verdict: floor, applied: true };
}

/** Rules-only verdict, used when the AI provider is unavailable. */
export function rulesOnlyVerdict(signals: Signal[]): { verdict: Verdict; confidence: number } {
  const c = countBySeverity(signals);
  const score = c.high * 3 + c.medium * 2 + c.low;
  if (score >= 7) return { verdict: "phishing", confidence: 70 };
  if (score >= 3) return { verdict: "suspicious", confidence: 55 };
  if (score >= 1) return { verdict: "spam", confidence: 40 };
  return { verdict: "legitimate", confidence: 35 };
}
