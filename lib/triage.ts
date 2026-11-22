// Orchestrates one triage: parse -> extract -> rule checks -> AI -> guardrail.

import { parseEmail } from "./headers";
import { extractIocs, defangIocs, type Iocs } from "./ioc";
import { detectSignals, applyGuardrail, rulesOnlyVerdict, type Signal, type Verdict } from "./signals";
import { buildUserPrompt, classifyWithAi, type ModelCaller } from "./ai";

export interface TriageResult {
  verdict: Verdict;
  confidence: number;
  summary: string;
  reasons: string[];
  recommendedActions: string[];
  reporterReply: string;
  signals: Signal[];
  iocs: Iocs; // defanged
  header: {
    from: string | null;
    replyTo: string | null;
    subject: string;
    spf: string;
    dkim: string;
    dmarc: string;
    hasHeaders: boolean;
  };
  aiUsed: boolean;
  aiError: string | null;
  guardrailApplied: boolean;
  model: string | null;
}

const DEFAULT_ACTIONS: Record<Verdict, string[]> = {
  phishing: [
    "Do not click links or open attachments; block the sender domain and listed URLs.",
    "Search mailboxes for the same sender/subject and purge copies.",
    "If anyone clicked or entered credentials, reset their password and revoke sessions.",
  ],
  suspicious: [
    "Hold the email and have an analyst review the listed red flags.",
    "Verify the request with the sender through a known, separate channel.",
  ],
  spam: ["Mark as junk / add sender to the spam block list.", "No further action unless more users report it."],
  legitimate: ["No action needed; release the email to the user.", "Thank the reporter and close the ticket."],
};

export async function triageEmail(rawText: string, call: ModelCaller | null, modelName: string | null = null): Promise<TriageResult> {
  const parsed = parseEmail(rawText);
  const iocs = extractIocs(rawText);
  const signals = detectSignals(parsed, iocs, rawText);

  const header = {
    from: parsed.from ? `${parsed.from.name ? parsed.from.name + " " : ""}<${parsed.from.address}>` : null,
    replyTo: parsed.replyTo?.address ?? null,
    subject: parsed.subject,
    spf: parsed.auth.spf,
    dkim: parsed.auth.dkim,
    dmarc: parsed.auth.dmarc,
    hasHeaders: parsed.hasHeaders,
  };

  let aiError: string | null = null;
  if (call) {
    try {
      const ai = await classifyWithAi(call, buildUserPrompt(parsed, iocs, signals, rawText));
      const guard = applyGuardrail(ai.verdict, signals);
      const reasons = guard.applied
        ? [...ai.reasons, `Verdict raised from "${ai.verdict}" to "${guard.verdict}" because of high-severity rule findings.`]
        : ai.reasons;
      return {
        verdict: guard.verdict,
        confidence: Math.round(ai.confidence),
        summary: ai.summary,
        reasons,
        recommendedActions: ai.recommended_actions,
        reporterReply: ai.reporter_reply,
        signals,
        iocs: defangIocs(iocs),
        header,
        aiUsed: true,
        aiError: null,
        guardrailApplied: guard.applied,
        model: modelName,
      };
    } catch (err) {
      aiError = err instanceof Error ? err.name : "AI_ERROR";
    }
  }

  // Fallback: rules only (no key configured, or the AI call failed).
  const rules = rulesOnlyVerdict(signals);
  return {
    verdict: rules.verdict,
    confidence: rules.confidence,
    summary: call
      ? "The AI service did not respond, so this result is based on automated rule checks only."
      : "AI is not configured, so this result is based on automated rule checks only.",
    reasons: signals.length ? signals.map((s) => s.description) : ["No rule-based red flags were found."],
    recommendedActions: DEFAULT_ACTIONS[rules.verdict],
    reporterReply: "",
    signals,
    iocs: defangIocs(iocs),
    header,
    aiUsed: false,
    aiError,
    guardrailApplied: false,
    model: null,
  };
}
