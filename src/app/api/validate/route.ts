import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buildDefense } from "@/core/defenseBuilder";
import { scoreValidation } from "@/core/scoring";
import { ContextInput, TicketInput } from "@/core/types";
import { validateTicket } from "@/core/validator";

type TicketRow = {
  id: string;
  source: string;
  agency: string | null;
  issue_date: string | null;
  plate: string | null;
  violation_code: string | null;
  fine_amount: number | null;
  raw_json: string;
};

function normalizeLegacyPayload(body: Record<string, unknown>): { ticket: TicketInput; context?: ContextInput; pastedText?: string } {
  if (body.ticket && typeof body.ticket === "object") {
    return {
      ticket: body.ticket as TicketInput,
      context: (body.context as ContextInput | undefined) || undefined,
      pastedText: (body.pastedText as string | undefined) || undefined
    };
  }

  return {
    ticket: {
      ticketNumber: (body.ticketNumber as string | undefined) || undefined,
      plate: (body.plate as string | undefined) || undefined,
      issueDate: (body.issueDate as string | undefined) || undefined
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json()) as Record<string, unknown>;
    const { ticket, context, pastedText } = normalizeLegacyPayload(rawBody);
    const db = getDb();

    const matches: Array<Record<string, unknown>> = [];
    if (ticket.ticketNumber) {
      const row = db.prepare("SELECT * FROM tickets_normalized WHERE id = ?").get(ticket.ticketNumber) as TicketRow | undefined;
      if (row) {
        matches.push({
          source: row.source,
          ticketNumber: row.id,
          agency: row.agency ?? undefined,
          issueDate: row.issue_date ?? undefined,
          violationCode: row.violation_code ?? undefined,
          fineAmount: row.fine_amount ?? undefined,
          status: "unknown",
          details: JSON.parse(row.raw_json)
        });
      }
    }

    const validator = validateTicket(ticket, context, pastedText);
    const scoring = scoreValidation(validator);
    const defense = buildDefense(ticket, context, validator);

    const signals = [
      ...validator.errors.map((e) => ({ type: "error", pass: false, message: e.message })),
      ...validator.warnings.map((w) => ({ type: "warning", pass: false, message: w.message })),
      ...validator.notes.map((n) => ({ type: "note", pass: true, message: n.message }))
    ];

    return NextResponse.json({
      verdict: scoring.verdict,
      payLikelihoodScore: scoring.payLikelihoodScore,
      fightLikelihoodScore: scoring.fightLikelihoodScore,
      summary: scoring.summary,
      explanation: scoring.explanation,
      validator,
      bestArguments: defense.bestArguments,
      evidenceChecklist: defense.evidenceChecklist,
      appealDraft: defense.appealDraft,
      nextSteps: [
        { label: "NYC Finance Dispute Portal", url: "https://www.nyc.gov/site/finance/vehicles/dispute-a-ticket.page" },
        { label: "NYC Pay or Dispute Hub", url: "https://www.nyc.gov/site/finance/vehicles/services-violation.page" },
        { label: "NYS DMV Tickets", url: "https://dmv.ny.gov/tickets" }
      ],
      matches,
      signals
    });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}
