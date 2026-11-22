import type { TriageResult } from "./triage";

/** Builds a plain-text note an analyst can paste straight into a ticket. */
export function toTicketNote(r: TriageResult): string {
  const lines: string[] = [];
  lines.push(`PHISHING TRIAGE - Verdict: ${r.verdict.toUpperCase()} (confidence ${r.confidence}%)`);
  lines.push(`Source: ${r.aiUsed ? "AI analysis + rule checks" : "rule checks only"}${r.guardrailApplied ? " (verdict raised by rule guardrail)" : ""}`);
  lines.push("");
  lines.push(`Summary: ${r.summary}`);
  if (r.header.hasHeaders) {
    lines.push("");
    lines.push(`From: ${r.header.from ?? "n/a"} | Reply-To: ${r.header.replyTo ?? "n/a"}`);
    lines.push(`Subject: ${r.header.subject || "n/a"}`);
    lines.push(`SPF: ${r.header.spf} | DKIM: ${r.header.dkim} | DMARC: ${r.header.dmarc}`);
  }
  lines.push("");
  lines.push("Why:");
  r.reasons.forEach((x) => lines.push(`- ${x}`));
  if (r.signals.length) {
    lines.push("");
    lines.push("Rule findings:");
    r.signals.forEach((s) => lines.push(`- [${s.severity.toUpperCase()}] ${s.description}`));
  }
  const iocLines = [
    ...r.iocs.urls.map((x) => `URL: ${x}`),
    ...r.iocs.domains.map((x) => `Domain: ${x}`),
    ...r.iocs.ips.map((x) => `IP: ${x}`),
    ...r.iocs.emails.map((x) => `Email: ${x}`),
    ...r.iocs.hashes.map((x) => `Hash: ${x}`),
  ];
  if (iocLines.length) {
    lines.push("");
    lines.push("Indicators (defanged):");
    iocLines.forEach((x) => lines.push(`- ${x}`));
  }
  lines.push("");
  lines.push("Recommended actions:");
  r.recommendedActions.forEach((x) => lines.push(`- ${x}`));
  return lines.join("\n");
}
