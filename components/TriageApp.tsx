"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import { SAMPLES } from "@/lib/samples";
import { MAX_EMAIL_CHARS, MIN_EMAIL_CHARS } from "@/lib/schema";
import type { TriageResult } from "@/lib/triage";
import ResultCard from "./ResultCard";

export default function TriageApp() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tooShort = email.trim().length < MIN_EMAIL_CHARS;
  const tooLong = email.length > MAX_EMAIL_CHARS;

  async function analyse() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      setResult(data as TriageResult);
      track("triage_completed", { verdict: data.verdict, aiUsed: String(data.aiUsed) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      track("triage_failed");
    } finally {
      setLoading(false);
    }
  }

  function loadSample(id: string) {
    const s = SAMPLES.find((x) => x.id === id);
    if (s) {
      setEmail(s.text);
      setResult(null);
      setError(null);
      track("sample_loaded", { sample: id });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="email" className="font-semibold">
            Reported email
          </label>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSample(s.id)}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={"Paste the full email here, including headers if you have them.\n\nFrom: ...\nSubject: ...\n\nBody..."}
          className="h-96 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          spellCheck={false}
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={tooLong ? "text-red-600" : "text-slate-500"}>
            {email.length.toLocaleString("en-US")} / {MAX_EMAIL_CHARS.toLocaleString("en-US")} characters
          </span>
          {email && (
            <button
              type="button"
              onClick={() => {
                setEmail("");
                setResult(null);
                setError(null);
              }}
              className="text-slate-500 underline hover:text-slate-800"
            >
              Clear
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={analyse}
          disabled={loading || tooShort || tooLong}
          className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? "Analysing..." : "Analyse email"}
        </button>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section aria-live="polite">
        {result ? (
          <ResultCard result={result} />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            {loading ? "Checking headers, links and wording..." : "The verdict and evidence will appear here. Try one of the sample emails."}
          </div>
        )}
      </section>
    </div>
  );
}
