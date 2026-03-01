import clsx from "clsx";

type Props = { step: number; labels: string[] };

export function Stepper({ step, labels }: Props) {
  return (
    <div className="mb-6 flex w-full items-center gap-3">
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                active && "bg-blue-600 text-white",
                done && "bg-emerald-600 text-white",
                !active && !done && "bg-slate-200 text-slate-600"
              )}
            >
              {idx}
            </div>
            <span className={clsx("text-sm", active ? "font-semibold text-slate-900" : "text-slate-600")}>{label}</span>
            {idx < labels.length && <div className="ml-1 h-px flex-1 bg-slate-300" />}
          </div>
        );
      })}
    </div>
  );
}
