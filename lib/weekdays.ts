export const WEEKDAYS = [
  { n: 0, short: "Sun", by: "SU" },
  { n: 1, short: "Mon", by: "MO" },
  { n: 2, short: "Tue", by: "TU" },
  { n: 3, short: "Wed", by: "WE" },
  { n: 4, short: "Thu", by: "TH" },
  { n: 5, short: "Fri", by: "FR" },
  { n: 6, short: "Sat", by: "SA" },
] as const;

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function parseWeekdays(rule?: string | null): number[] {
  if (!rule || !rule.trim()) return [...ALL_DAYS];
  const upper = rule.toUpperCase();
  const fromBy = WEEKDAYS.filter((d) => upper.includes(d.by)).map((d) => d.n);
  if (fromBy.length) return fromBy;
  const nums = rule
    .split(/[,;|\s]+/)
    .map((p) => Number(p))
    .filter((n) => n >= 0 && n <= 6);
  return nums.length ? nums : [...ALL_DAYS];
}

export function encodeWeekdays(days: number[]): string {
  const set = [...new Set(days)].filter((n) => n >= 0 && n <= 6).sort();
  if (!set.length) return WEEKDAYS.map((d) => d.by).join(",");
  return set.map((n) => WEEKDAYS[n].by).join(",");
}
