import { ValidatorOutput } from "./types";

export function scoreValidation(validator: ValidatorOutput) {
  let pay = 70;
  let fight = 30;

  pay -= validator.errors.length * 25;
  fight += validator.errors.length * 25;

  pay -= validator.warnings.length * 10;
  fight += validator.warnings.length * 10;

  fight += validator.notes.length * 5;

  pay = Math.max(0, Math.min(100, pay));
  fight = Math.max(0, Math.min(100, fight));

  let verdict: "likely_valid" | "possibly_invalid" | "likely_invalid" = "likely_valid";
  if (fight >= 75 || validator.errors.length >= 2) verdict = "likely_invalid";
  else if (fight >= 45 || validator.warnings.length >= 2) verdict = "possibly_invalid";

  const summary =
    verdict === "likely_invalid"
      ? "Multiple inconsistencies were found; this ticket may be challengeable."
      : verdict === "possibly_invalid"
        ? "Some issues were found. You may have arguments to challenge or reduce this ticket."
        : "Ticket details look mostly consistent. Paying may be the safer path unless new evidence appears.";

  return {
    verdict,
    payLikelihoodScore: pay,
    fightLikelihoodScore: fight,
    summary,
    explanation: {
      baseline: { pay: 70, fight: 30 },
      adjustments: {
        hardErrors: validator.errors.length,
        warnings: validator.warnings.length,
        notes: validator.notes.length
      }
    }
  };
}
