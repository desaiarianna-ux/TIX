"use client";

import { AlertTriangle, CheckCircle2, Copy, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ScoreBar } from "@/components/ScoreBar";
import { Stepper } from "@/components/Stepper";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ContextInput, TicketInput } from "@/core/types";

type ApiResult = {
  verdict: "likely_valid" | "possibly_invalid" | "likely_invalid";
  payLikelihoodScore: number;
  fightLikelihoodScore: number;
  summary: string;
  validator: {
    errors: Array<{ code: string; message: string; field?: string }>;
    warnings: Array<{ code: string; message: string; field?: string }>;
    notes: Array<{ code: string; message: string }>;
  };
  bestArguments: Array<{ title: string; whyItWorks: string; evidence: string[] }>;
  evidenceChecklist: Array<{ item: string; why: string }>;
  appealDraft: { subject: string; body: string };
  nextSteps: Array<{ label: string; url: string }>;
};

const DEMO_TICKET: TicketInput = {
  ticketNumber: "1234567890",
  plate: "ABC1234",
  state: "NY",
  issueDate: "2024-02-10",
  issueTime: "09:15",
  location: { street: "Broadway", borough: "Manhattan", city: "New York" },
  violationCode: "21",
  meterZone: "",
  officerId: "9832",
  precinct: "014"
};

const DEMO_CONTEXT: ContextInput = {
  inCar: true,
  hasPhotos: true,
  hasPermit: false,
  permitType: "",
  signageVisible: "no",
  notes: "Sign was blocked."
};

export default function CheckPage() {
  const [step, setStep] = useState<number>(1);
  const [healthMsg, setHealthMsg] = useState<string>("");
  const [showAppeal, setShowAppeal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const [ticket, setTicket] = useState<TicketInput>({ ...DEMO_TICKET, location: { ...DEMO_TICKET.location } });
  const [context, setContext] = useState<ContextInput>({ ...DEMO_CONTEXT });
  const [pastedText, setPastedText] = useState<string>("");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((h: { tables?: { tickets_normalized?: number } }) => {
        if (!h.tables || (h.tables.tickets_normalized ?? 0) === 0) {
          setHealthMsg("Dataset not loaded. Run npm run ingest");
        }
      })
      .catch(() => setHealthMsg("Could not check dataset health. You can still run with sample data after ingest."));
  }, []);

  const canProceed = useMemo(() => {
    if (step === 1) return !!ticket.ticketNumber?.trim();
    return true;
  }, [step, ticket.ticketNumber]);

  function updateLocation(field: keyof NonNullable<TicketInput["location"]>, value: string) {
    setTicket((prev) => ({
      ...prev,
      location: {
        ...(prev.location || {}),
        [field]: value
      }
    }));
  }

  async function runCheck() {
    setLoading(true);
    setShowAppeal(false);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, context, pastedText })
      });
      const data = (await res.json()) as ApiResult;
      setResult(data);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  function copyAppeal() {
    if (!result) return;
    navigator.clipboard.writeText(`${result.appealDraft.subject}\n\n${result.appealDraft.body}`);
  }

  function loadDemo() {
    setTicket({ ...DEMO_TICKET, location: { ...DEMO_TICKET.location } });
    setContext({ ...DEMO_CONTEXT });
    setPastedText("");
    setResult(null);
    setShowAppeal(false);
    setStep(1);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      {healthMsg && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{healthMsg}</div>}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
        <h1 className="text-3xl font-bold">Check my ticket</h1>
        <p className="mt-2 text-slate-600">Answer a few questions to estimate whether to pay or fight.</p>

        <Stepper step={step} labels={["Ticket", "Context", "Results"]} />

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-xl border p-3" placeholder="Ticket number" value={ticket.ticketNumber ?? ""} onChange={(e) => setTicket((prev) => ({ ...prev, ticketNumber: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Plate" value={ticket.plate ?? ""} onChange={(e) => setTicket((prev) => ({ ...prev, plate: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="State (NY)" value={ticket.state ?? ""} onChange={(e) => setTicket((prev) => ({ ...prev, state: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Violation code" value={ticket.violationCode ?? ""} onChange={(e) => setTicket((prev) => ({ ...prev, violationCode: e.target.value }))} />
            <input type="date" className="rounded-xl border p-3" value={ticket.issueDate ?? ""} onChange={(e) => setTicket((prev) => ({ ...prev, issueDate: e.target.value }))} />
            <input type="time" className="rounded-xl border p-3" value={ticket.issueTime ?? ""} onChange={(e) => setTicket((prev) => ({ ...prev, issueTime: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Street" value={ticket.location?.street ?? ""} onChange={(e) => updateLocation("street", e.target.value)} />
            <input className="rounded-xl border p-3" placeholder="Borough" value={ticket.location?.borough ?? ""} onChange={(e) => updateLocation("borough", e.target.value)} />
            <input className="rounded-xl border p-3" placeholder="Meter/Zone (if shown)" value={ticket.meterZone ?? ""} onChange={(e) => setTicket((prev) => ({ ...prev, meterZone: e.target.value }))} />
            <input className="rounded-xl border p-3" placeholder="Officer ID" value={ticket.officerId ?? ""} onChange={(e) => setTicket((prev) => ({ ...prev, officerId: e.target.value }))} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="text-sm">
                Were you in the car?
                <select className="mt-1 w-full rounded-xl border p-3" value={String(context.inCar ?? false)} onChange={(e) => setContext((prev) => ({ ...prev, inCar: e.target.value === "true" }))}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label className="text-sm">
                Do you have photos?
                <select className="mt-1 w-full rounded-xl border p-3" value={String(context.hasPhotos ?? false)} onChange={(e) => setContext((prev) => ({ ...prev, hasPhotos: e.target.value === "true" }))}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label className="text-sm">
                Do you have a permit?
                <select className="mt-1 w-full rounded-xl border p-3" value={String(context.hasPermit ?? false)} onChange={(e) => setContext((prev) => ({ ...prev, hasPermit: e.target.value === "true" }))}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <label className="text-sm">
                Signage visible?
                <select className="mt-1 w-full rounded-xl border p-3" value={context.signageVisible ?? "unsure"} onChange={(e) => setContext((prev) => ({ ...prev, signageVisible: e.target.value as "yes" | "no" | "unsure" }))}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Unsure</option>
                </select>
              </label>
            </div>
            {(context.hasPermit ?? false) && <input className="rounded-xl border p-3" placeholder="Permit type" value={context.permitType ?? ""} onChange={(e) => setContext((prev) => ({ ...prev, permitType: e.target.value }))} />}
            <textarea className="rounded-xl border p-3" rows={3} placeholder="Extenuating circumstances (optional)" value={context.notes ?? ""} onChange={(e) => setContext((prev) => ({ ...prev, notes: e.target.value }))} />
            <textarea className="rounded-xl border p-3" rows={3} placeholder="Paste suspicious message text for scam checks (optional)" value={pastedText} onChange={(e) => setPastedText(e.target.value)} />
          </div>
        )}

        {step === 3 && result && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <VerdictBadge verdict={result.verdict} />
              <p className="mt-2 text-slate-700">{result.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ScoreBar label="Pay Likelihood" score={result.payLikelihoodScore} color="rose" />
              <ScoreBar label="Fight Likelihood" score={result.fightLikelihoodScore} color="blue" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-white p-4">
                <h3 className="mb-2 text-lg font-semibold">Red flags found</h3>
                <p className="mb-1 text-sm font-medium text-rose-700">Errors</p>
                <ul className="space-y-2 text-sm">
                  {result.validator.errors.map((x, i) => (
                    <li className="flex gap-2" key={`${x.code}-${i}`}>
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-600" />
                      {x.message}
                    </li>
                  ))}
                </ul>
                <p className="mb-1 mt-3 text-sm font-medium text-amber-700">Warnings</p>
                <ul className="space-y-2 text-sm">
                  {result.validator.warnings.map((x, i) => (
                    <li className="flex gap-2" key={`${x.code}-${i}`}>
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                      {x.message}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <h3 className="mb-2 text-lg font-semibold">Best defense</h3>
                <ul className="space-y-3">
                  {result.bestArguments.map((arg, i) => (
                    <li key={`${arg.title}-${i}`} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-semibold">{arg.title}</p>
                      <p className="text-sm text-slate-600">{arg.whyItWorks}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={() => setShowAppeal(true)}>
              Generate appeal
            </button>

            {showAppeal && (
              <div className="rounded-2xl border bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Appeal draft</h3>
                  <button className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm" onClick={copyAppeal}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                </div>
                <textarea className="h-60 w-full rounded-xl border p-3" readOnly value={`${result.appealDraft.subject}\n\n${result.appealDraft.body}`} />
                <h4 className="mt-4 font-semibold">Evidence checklist</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {result.evidenceChecklist.map((e, i) => (
                    <li key={`${e.item}-${i}`} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {e.item} — {e.why}
                    </li>
                  ))}
                </ul>
                <h4 className="mt-4 font-semibold">Official links</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {result.nextSteps.map((n) => (
                    <li key={n.url}>
                      <a href={n.url} target="_blank" className="text-blue-700 underline" rel="noreferrer">
                        {n.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {step > 1 && step < 3 && (
            <button className="rounded-xl border px-4 py-2" onClick={() => setStep((prev) => prev - 1)}>
              Back
            </button>
          )}
          {step < 2 && (
            <button disabled={!canProceed} className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50" onClick={() => setStep((prev) => prev + 1)}>
              Next
            </button>
          )}
          {step === 2 && (
            <button onClick={runCheck} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" disabled={loading}>
              <FileText className="h-4 w-4" /> {loading ? "Checking..." : "Analyze ticket"}
            </button>
          )}
          <button className="rounded-xl border px-4 py-2" onClick={loadDemo}>
            Load demo
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">Not legal advice. Verify with official agency.</p>
    </main>
  );
}
