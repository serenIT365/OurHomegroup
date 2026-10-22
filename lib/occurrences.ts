import type { Meeting } from "./types";
import { parseWeekdays } from "./weekdays";

export function meetingDurationMs(meeting: Meeting) {
  if (meeting.endAt) {
    const n = new Date(meeting.endAt).getTime() - new Date(meeting.startAt).getTime();
    if (n > 0) return n;
  }
  return 60 * 60 * 1000;
}

function wallParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    weekday,
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

function zonedDate(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const asWall = wallParts(new Date(utcGuess), timeZone);
  const wallAsUtc = Date.UTC(asWall.year, asWall.month - 1, asWall.day, asWall.hour, asWall.minute, 0);
  return new Date(utcGuess + (utcGuess - wallAsUtc));
}

export function upcomingStarts(meeting: Meeting, count = 16): string[] {
  const start = new Date(meeting.startAt);
  const rec = meeting.recurrence || "none";
  if (rec === "none") return [start.toISOString()];
  const tz = meeting.timezone || "America/New_York";

  if (rec === "monthly") {
    const base = wallParts(start, tz);
    const dates: Date[] = [];
    for (let i = 0; i < count; i++) {
      const monthIndex = base.month - 1 + i;
      const year = base.year + Math.floor(monthIndex / 12);
      const month = (monthIndex % 12) + 1;
      dates.push(zonedDate(year, month, base.day, base.hour, base.minute, tz));
    }
    return dates.map((d) => d.toISOString());
  }

  const allowed = new Set(parseWeekdays(meeting.recurrenceRule));
  const wall = wallParts(start, tz);
  const out: Date[] = [];
  const cursor = zonedDate(wall.year, wall.month, wall.day, 0, 0, tz);
  let guard = 0;
  while (out.length < count && guard < 800) {
    const c = wallParts(cursor, tz);
    const d = zonedDate(c.year, c.month, c.day, wall.hour, wall.minute, tz);
    const dw = wallParts(d, tz).weekday;
    if (d.getTime() >= start.getTime() - 60 * 1000 && allowed.has(dw)) {
      out.push(d);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
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
    if (meeting.enabled === false || meeting.status === "pending" || meeting.status === "declined") continue;
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
