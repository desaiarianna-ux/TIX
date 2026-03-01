import { ContextInput, DefenseArgument, TicketInput, ValidatorOutput } from "./types";

export function buildDefense(ticket: TicketInput, context: ContextInput | undefined, validator: ValidatorOutput) {
  const argumentsList: DefenseArgument[] = [];

  if (validator.errors.some((e) => e.code === "RULE_REQUIRED_FIELD")) {
    argumentsList.push({
      title: "Required citation details appear incomplete",
      whyItWorks: "Missing required fields can make a citation legally defective.",
      evidence: ["Clear copy of ticket (front/back)", "Highlight missing fields", "Violation code rule reference"]
    });
  }

  if (context?.signageVisible === "no") {
    argumentsList.push({
      title: "Signage was not visible",
      whyItWorks: "If signs were missing, obstructed, or illegible, notice may be inadequate.",
      evidence: ["Photos of block and nearest sign posts", "Time-stamped images", "Map pin of vehicle position"]
    });
  }

  if (context?.hasPermit) {
    argumentsList.push({
      title: "Valid permit/authorization existed",
      whyItWorks: "A permit can exempt or reduce certain parking violations.",
      evidence: ["Permit image (front/back)", "Permit validity dates", "Placement visibility proof"]
    });
  }

  if (context?.inCar) {
    argumentsList.push({
      title: "Driver remained in vehicle",
      whyItWorks: "Some violations hinge on unattended parking conditions.",
      evidence: ["Witness statement", "Dashcam timeline", "Any loading/unloading proof"]
    });
  }

  if (argumentsList.length < 3) {
    argumentsList.push({
      title: "Request discretionary reduction",
      whyItWorks: "Even when validity is uncertain, agencies may reduce penalties with context and clean history.",
      evidence: ["Driving record if available", "Proof of hardship or emergency", "Respectful, concise statement"]
    });
  }

  const bestArguments = argumentsList.slice(0, 3);
  const evidenceChecklist = [
    { item: "Photos of signs and curb markings", why: "Supports visibility/ambiguity arguments" },
    { item: "Photo of vehicle position", why: "Shows distance, angle, and context" },
    { item: "Ticket copy (all sides)", why: "Needed to cite defects or mismatches" },
    { item: "Any permit or payment receipt", why: "Can directly refute the violation claim" }
  ];

  const subject = `Appeal Request for Ticket ${ticket.ticketNumber || "(number unavailable)"}`;
  const body = `To Whom It May Concern,\n\nI respectfully request review of ticket ${ticket.ticketNumber || "[ticket number]"}. Based on the citation details and surrounding circumstances, I believe this matter should be dismissed or reduced.\n\nKey points:\n${bestArguments.map((a, i) => `${i + 1}. ${a.title}: ${a.whyItWorks}`).join("\n")}\n\nI have attached supporting evidence and request a fair reconsideration.\n\nThank you for your time.\n\nSincerely,\n[Your Name]`;

  return { bestArguments, evidenceChecklist, appealDraft: { subject, body } };
}
