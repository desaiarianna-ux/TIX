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
    </main>
  );
}
