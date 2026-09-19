import Link from "next/link";
import { store } from "@/lib/store";
import type { Meeting } from "@/lib/types";
import { upcomingSlots, type MeetingSlot } from "@/lib/occurrences";

export const dynamic = "force-dynamic";

function providerLabel(p: Meeting["provider"]) {
  if (p === "livekit") return "OHG";
  if (p === "zoom") return "Zoom";
  return "Hybrid";
}

function dayKey(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz || "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function dayHeading(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "America/New_York",
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function timeLabel(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "America/New_York",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function MeetingsListPage() {
  const meetings = (await store.listMeetings("org_demo")).filter(
    (m) => m.enabled !== false && m.status !== "pending" && m.status !== "declined"
  );
  const slots = upcomingSlots(meetings, new Date(), 8);

  function groups(list: MeetingSlot[]) {
    const map = new Map<string, MeetingSlot[]>();
    for (const s of list) {
      const k = dayKey(s.startAt, s.meeting.timezone);
      const arr = map.get(k) || [];
      arr.push(s);
      map.set(k, arr);
    }
    return [...map.entries()];
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white/90 dark:bg-zinc-900/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-sm">
            OurHomegroup
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-zinc-500 hover:text-teal-600">
              Admin
            </Link>
            <Link href="/dashboard" className="text-zinc-500 hover:text-teal-600">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Meetings</h1>
            <p className="text-xs text-zinc-500">Upcoming dates including recurrence · next 8 weeks</p>
          </div>
          <div className="flex gap-3">
            <Link href="/meetings/submit" className="text-xs text-teal-700 hover:underline">
              Submit a meeting
            </Link>
            <Link href="/admin" className="text-xs text-teal-700 hover:underline">
              Admin
            </Link>
          </div>
        </div>

        {slots.length === 0 ? (
          <p className="text-sm text-zinc-500">No upcoming meetings.</p>
        ) : (
          <div className="space-y-5">
            {groups(slots).map(([key, rows]) => (
              <section key={key}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
                  {dayHeading(rows[0].startAt, rows[0].meeting.timezone)}
                </h2>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                  {rows.map((s, i) => (
                    <Link
                      key={`${s.meeting.id}-${s.startAt}`}
                      href={`/meetings/${s.meeting.id}`}
                      className={
                        "grid grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[5rem_1fr_7rem_5rem_auto] gap-2 items-center px-3 py-2 text-sm hover:bg-teal-50/60 dark:hover:bg-teal-950/30 " +
                        (i > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : "")
                      }
                    >
                      <time className="tabular-nums text-zinc-600 dark:text-zinc-300 font-medium">
                        {timeLabel(s.startAt, s.meeting.timezone)}
                      </time>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{s.meeting.name}</div>
                        <div className="text-[11px] text-zinc-500 truncate sm:hidden">
                          {s.meeting.type || "Meeting"} · {providerLabel(s.meeting.provider)}
                        </div>
                      </div>
                      <div className="hidden sm:block text-zinc-500 truncate">
                        {s.meeting.type || "Meeting"}
                      </div>
                      <div className="hidden sm:block text-zinc-500">
                        {providerLabel(s.meeting.provider)}
                      </div>
                      <span className="text-xs text-teal-700 dark:text-teal-400 whitespace-nowrap">
                        Join →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
