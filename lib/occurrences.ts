import type { Meeting } from "./types";

export function meetingDurationMs(meeting: Meeting) {
  if (meeting.endAt) {
    const n = new Date(meeting.endAt).getTime() - new Date(meeting.startAt).getTime();
    if (n > 0) return n;
  }
  return 60 * 60 * 1000;
}

export function upcomingStarts(meeting: Meeting, count = 16): string[] {
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
