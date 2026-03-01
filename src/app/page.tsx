import Link from "next/link";
import { ShieldCheck, Scale, Gavel } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-16">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-soft backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">Tix MVP</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Understand your NYC ticket in minutes</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          We answer three questions fast: <strong>Is this ticket even valid?</strong> <strong>Do I have to pay it?</strong>{" "}
          <strong>How can I fight it?</strong>
        </p>
        <div className="mt-8">
          <Link href="/check" className="rounded-xl bg-blue-600 px-6 py-3 text-white shadow hover:bg-blue-700">
            Check my ticket
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-soft"><ShieldCheck className="mb-3 text-blue-600" />Is this ticket valid?</div>
        <div className="rounded-2xl border bg-white p-5 shadow-soft"><Scale className="mb-3 text-blue-600" />Do I likely need to pay?</div>
        <div className="rounded-2xl border bg-white p-5 shadow-soft"><Gavel className="mb-3 text-blue-600" />Get help building a defense.</div>
      </section>

      <p className="mt-8 text-sm text-slate-500">Not legal advice. Verify with official agency.</p>
"use client";

import { FormEvent, useState } from "react";

type Signal = { type: string; pass: boolean; message: string };
type Match = {
  source: string;
  ticketNumber: string;
  agency?: string;
  issueDate?: string;
  violationCode?: string;
  fineAmount?: number;
  status: "open" | "paid" | "dismissed" | "unknown";
  details: Record<string, unknown>;
};

type ApiResponse = {
  verdict: "valid" | "not_found" | "uncertain";
  confidence: number;
  matches: Match[];
  signals: Signal[];
  nextSteps: { label: string; url: string }[];
};

const DEMO_SAMPLE = {
  ticketNumber: "1234567890",
  plate: "ABC1234",
  issueDate: "2024-02-10"
};

export default function HomePage() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [plate, setPlate] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketNumber,
          plate: plate || undefined,
          issueDate: issueDate || undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || `Validation failed: ${response.status}`);
      }

      setResult((await response.json()) as ApiResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function loadDemoRecord() {
    setTicketNumber(DEMO_SAMPLE.ticketNumber);
    setPlate(DEMO_SAMPLE.plate);
    setIssueDate(DEMO_SAMPLE.issueDate);
  }

  return (
    <main className="container">
      <h1>TIX — NY Ticket/Summons Quick Check</h1>
      <p>Enter a number to see if it looks valid using format checks and NYC open data lookup.</p>

      <div className="card quickstart">
        <h2>Quick Start</h2>
        <ol>
          <li>Run <code>npm run ingest</code> in your terminal (one-time per refresh).</li>
          <li>Click <strong>Use demo sample</strong> below, then click <strong>Check</strong>.</li>
        </ol>
        <button type="button" onClick={loadDemoRecord}>Use demo sample</button>
      </div>

      <form onSubmit={onSubmit} className="card form">
        <label>
          Ticket / Summons Number
          <input
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            required
            placeholder="e.g. 1234567890"
          />
        </label>
        <label>
          Plate (optional)
          <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC1234" />
        </label>
        <label>
          Issue Date (optional)
          <input value={issueDate} onChange={(e) => setIssueDate(e.target.value)} placeholder="YYYY-MM-DD" />
        </label>
        <button disabled={loading}>{loading ? "Checking..." : "Check"}</button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="card result">
          <h2>
            Verdict: <span className={`verdict ${result.verdict}`}>{result.verdict.toUpperCase()}</span>
          </h2>
          <p className="confidence">Confidence: {result.confidence}/100</p>
          <progress max={100} value={result.confidence} />

          <h3>Signals</h3>
          <ul>
            {result.signals.map((signal, idx) => (
              <li key={`${signal.type}-${idx}`}>
                {signal.pass ? "✅" : "⚠️"} [{signal.type}] {signal.message}
              </li>
            ))}
          </ul>

          <h3>Matches ({result.matches.length})</h3>
          {result.matches.length === 0 && <p>No matching row found.</p>}
          {result.matches.map((match, idx) => (
            <details key={`${match.ticketNumber}-${idx}`}>
              <summary>
                {match.ticketNumber} — {match.source} ({match.status})
              </summary>
              <pre>{JSON.stringify(match, null, 2)}</pre>
            </details>
          ))}

          <h3>Next Steps</h3>
          <ul>
            {result.nextSteps.map((step) => (
              <li key={step.url}>
                <a href={step.url} target="_blank" rel="noreferrer">
                  {step.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="disclaimer">
        Disclaimer: This tool is an MVP and not legal advice. Always verify ticket details with official NYC or NYS
        agencies.
      </p>
    </main>
  );
}
