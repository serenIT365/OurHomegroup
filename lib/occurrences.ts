import type { Meeting } from "./types";

export function upcomingStarts(meeting: Meeting, count = 8): string[] {
  const start = new Date(meeting.startAt);
  const dates: Date[] = [new Date(start)];
  const rec = meeting.recurrence || "none";
  if (rec === "none") return dates.map((d) => d.toISOString());
  const step = rec === "daily" ? 1 : rec === "weekly" ? 7 : 30;
  for (let i = 1; i < count; i++) {
    const d = new Date(start);
    if (rec === "monthly") d.setMonth(d.getMonth() + i);
    else d.setDate(d.getDate() + step * i);
    dates.push(d);
  }
  return dates.map((d) => d.toISOString());
}
