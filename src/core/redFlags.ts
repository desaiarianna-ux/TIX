import { ValidationItem } from "./types";

const SIGNALS = [
  /gift\s*card/i,
  /bitcoin|crypto|ethereum|usdt/i,
  /urgent|immediately|final notice|arrest/i,
  /zelle|venmo|cash\s*app/i
];

const NON_GOV_LINK = /https?:\/\/(?![^\s]*\.gov\b)[^\s]+/i;

export function scanScamSignals(text?: string): ValidationItem[] {
  if (!text?.trim()) return [];
  const findings: ValidationItem[] = [];
  for (const rule of SIGNALS) {
    if (rule.test(text)) {
      findings.push({
        code: "SCAM_SIGNAL",
        message: "Message includes scam-like payment or threat language. Verify via official .gov channels."
      });
      break;
    }
  }

  if (NON_GOV_LINK.test(text)) {
    findings.push({
      code: "SCAM_SIGNAL",
      message: "Non-.gov payment or dispute link detected. Treat as suspicious until verified."
    });
  }
  return findings;
}
