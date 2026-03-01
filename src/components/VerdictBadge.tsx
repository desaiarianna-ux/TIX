import clsx from "clsx";

export function VerdictBadge({ verdict }: { verdict: "likely_valid" | "possibly_invalid" | "likely_invalid" }) {
  const map = {
    likely_valid: "Likely Valid",
    possibly_invalid: "Possibly Invalid",
    likely_invalid: "Likely Invalid"
  };
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-sm font-semibold",
        verdict === "likely_valid" && "bg-emerald-100 text-emerald-800",
        verdict === "possibly_invalid" && "bg-amber-100 text-amber-800",
        verdict === "likely_invalid" && "bg-rose-100 text-rose-800"
      )}
    >
      {map[verdict]}
    </span>
  );
}
