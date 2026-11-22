"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import type { TriageResult } from "@/lib/triage";
import { toTicketNote } from "@/lib/report";

const VERDICT_STYLE: Record<string, { label: string; cls: string }> = {
  phishing: { label: "Phishing", cls: "bg-red-600 text-white" },
  suspicious: { label: "Suspicious", cls: "bg-amber-500 text-white" },
  spam: { label: "Spam", cls: "bg-slate-500 text-white" },
  legitimate: { label: "Legitimate", cls: "bg-emerald-600 text-white" },
};

const SEVERITY_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

function CopyButton({ text, label, event }: { text: string; label: string; event: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        track(event);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-100"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export default function ResultCard({ result: r }: { result: TriageResult }) {
  const v = VERDICT_STYLE[r.verdict];
  const iocRows = [
    ...r.iocs.urls.map((x) => ["URL", x]),
    ...r.iocs.domains.map((x) => ["Domain", x]),
    ...r.iocs.ips.map((x) => ["IP", x]),
    ...r.iocs.emails.map((x) => ["Email", x]),
    ...r.iocs.hashes.map((x) => ["Hash", x]),
  ];

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide ${v.cls}`}>{v.label}</span>
        <span className="text-sm text-slate-600">Confidence {r.confidence}%</span>
        <span className="ml-auto text-xs text-slate-500">{r.aiUsed ? "AI + rule checks" : "Rule checks only"}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-indigo-500" style={{ width: `${r.confidence}%` }} />
      </div>

      {!r.aiUsed && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          The AI analysis was not available for this request. The verdict below comes from rule checks only.
        </p>
      )}
      {r.guardrailApplied && (
        <p className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800">
          The verdict was raised by the rule guardrail because strong red flags were found.
        </p>
      )}

      <p className="text-slate-800">{r.summary}</p>

      <div>
        <h3 className="mb-1 text-sm font-semibold">Why</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {r.reasons.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      {r.signals.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Rule findings</h3>
          <ul className="space-y-1 text-sm">
            {r.signals.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_STYLE[s.severity]}`}>
                  {s.severity}
                </span>
                <span className="text-slate-700">{s.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.header.hasHeaders && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {(["spf", "dkim", "dmarc"] as const).map((k) => (
            <div key={k} className="rounded-lg bg-slate-50 p-2">
              <div className="font-semibold uppercase text-slate-500">{k}</div>
              <div className={r.header[k] === "pass" ? "text-emerald-700" : r.header[k] === "unknown" || r.header[k] === "none" ? "text-slate-600" : "text-red-700"}>
                {r.header[k]}
              </div>
            </div>
          ))}
        </div>
      )}

      {iocRows.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Indicators (defanged)</h3>
            <CopyButton text={iocRows.map(([t, x]) => `${t}: ${x}`).join("\n")} label="Copy indicators" event="iocs_copied" />
          </div>
          <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <tbody>
                {iocRows.map(([t, x], i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="w-16 px-2 py-1 font-medium text-slate-500">{t}</td>
                    <td className="break-all px-2 py-1 font-mono">{x}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-1 text-sm font-semibold">Recommended actions</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {r.recommendedActions.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      </div>

      {r.reporterReply && (
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Reply to the reporter</h3>
            <CopyButton text={r.reporterReply} label="Copy reply" event="reply_copied" />
          </div>
          <p className="text-sm text-slate-700">{r.reporterReply}</p>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-100 pt-3">
        <CopyButton text={toTicketNote(r)} label="Copy ticket note" event="ticket_note_copied" />
      </div>
    </div>
  );
}
