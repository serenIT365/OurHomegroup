import type { Meeting } from "./types";

/**
 * Minimal ICS generator (no external dependency required for MVP).
 * Supports single events; recurrence can be extended later.
 */
export function meetingToICS(meeting: Meeting, orgName?: string): string {
  const dtStart = formatICSDate(new Date(meeting.startAt));
  const dtEnd = meeting.endAt
    ? formatICSDate(new Date(meeting.endAt))
    : formatICSDate(new Date(new Date(meeting.startAt).getTime() + 60 * 60 * 1000));
  const uid = `${meeting.id}@ourhomegroup.app`;
  const summary = escapeICS(meeting.name);
  const description = escapeICS(
    [
      meeting.description || "",
      orgName ? `Organization: ${orgName}` : "",
      `Join via OurHomegroup: https://app.ourhomegroup.example/meetings/${meeting.id}`,
      meeting.zoomJoinUrl ? `Zoom fallback: ${meeting.zoomJoinUrl}` : "",
    ]
      .filter(Boolean)
      .join("\\n")
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OurHomegroup//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function formatICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
