import type { Meeting } from "./types";
import { parseWeekdays } from "./weekdays";

export function meetingDurationMs(meeting: Meeting) {
  if (meeting.endAt) {
    const n = new Date(meeting.endAt).getTime() - new Date(meeting.startAt).getTime();
    if (n > 0) return n;
  }
  return 60 * 60 * 1000;
}

export function upcomingStarts(meeting: Meeting, count = 16): string[] {
  const start = new Date(meeting.startAt);
  const rec = meeting.recurrence || "none";
  if (rec === "none") return [start.toISOString()];

  if (rec === "monthly") {
    const dates: Date[] = [new Date(start)];
    for (let i = 1; i < count; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      dates.push(d);
    }
    return dates.map((d) => d.toISOString());
  }

  const allowed = new Set(parseWeekdays(meeting.recurrenceRule));
  const hh = start.getHours();
  const mm = start.getMinutes();
  const ss = start.getSeconds();
  const out: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (out.length < count && guard < 800) {
    const d = new Date(cursor);
    d.setHours(hh, mm, ss, 0);
    if (d.getTime() >= start.getTime() - 60 * 1000 && allowed.has(d.getDay())) {
      out.push(d);
    }
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return out.map((d) => d.toISOString());
}

export function nextStartAfter(meeting: Meeting, from = new Date()): Date | null {
  const dur = meetingDurationMs(meeting);
  for (const iso of upcomingStarts(meeting, 52)) {
    const t = new Date(iso).getTime();
    if (t + dur > from.getTime()) return new Date(iso);
  }
  return null;
}

export type MeetingSlot = { meeting: Meeting; startAt: string; endAt: number };

export function upcomingSlots(meetings: Meeting[], from = new Date(), weeks = 8): MeetingSlot[] {
  const slots: MeetingSlot[] = [];
  const horizon = from.getTime() + weeks * 7 * 24 * 60 * 60 * 1000;
  for (const meeting of meetings) {
    if (meeting.enabled === false) continue;
    const dur = meetingDurationMs(meeting);
    for (const iso of upcomingStarts(meeting, 52)) {
      const t = new Date(iso).getTime();
      if (t + dur < from.getTime()) continue;
      if (t > horizon) break;
      slots.push({ meeting, startAt: iso, endAt: t + dur });
    }
  }
  return slots.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}
