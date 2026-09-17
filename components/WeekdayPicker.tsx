"use client";

import { WEEKDAYS } from "@/lib/weekdays";

export default function WeekdayPicker({
  days,
  onChange,
}: {
  days: number[];
  onChange: (days: number[]) => void;
}) {
  function toggle(n: number) {
    const has = days.includes(n);
    const next = has ? days.filter((d) => d !== n) : [...days, n];
    onChange(next.length ? next.sort() : [n]);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {WEEKDAYS.map((d) => {
        const on = days.includes(d.n);
        return (
          <button
            key={d.n}
            type="button"
            onClick={() => toggle(d.n)}
            className={
              "min-w-[2.5rem] px-2 py-1.5 rounded-lg text-xs border " +
              (on
                ? "bg-teal-600 text-white border-teal-600"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-500")
            }
          >
            {d.short}
          </button>
        );
      })}
    </div>
  );
}
