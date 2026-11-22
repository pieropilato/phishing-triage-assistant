import TriageApp from "@/components/TriageApp";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">PT</div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Phishing Triage Assistant</h1>
            <p className="text-sm text-slate-600">For IT and security teams without a full SOC toolset</p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-slate-700">
          Paste a reported email (ideally with its headers). In a few seconds you get a verdict, the red flags behind it,
          defanged indicators and a ticket-ready note you can copy.
        </p>
      </header>
      <TriageApp />
      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-500">
        Email text is sent to the configured AI provider only to produce the analysis. Nothing is stored by this app.
        Results are decision support for an analyst, not an automatic block.
      </footer>
    </main>
  );
}
