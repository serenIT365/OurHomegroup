import Link from "next/link";
import { store } from "@/lib/store";
import type { Meeting } from "@/lib/types";

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
  const meetings = await store.listMeetings("org_demo");
  const now = Date.now();

  const sorted = [...meetings].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
  const upcoming = sorted.filter((m) => new Date(m.startAt).getTime() >= now - 60 * 60 * 1000);
  const past = sorted
    .filter((m) => new Date(m.startAt).getTime() < now - 60 * 60 * 1000)
    .reverse();

  function groups(list: Meeting[]) {
    const map = new Map<string, Meeting[]>();
    for (const m of list) {
      const k = dayKey(m.startAt, m.timezone);
      const arr = map.get(k) || [];
      arr.push(m);
      map.set(k, arr);
    }
    return [...map.entries()];
  }

  function Table({ list }: { list: Meeting[] }) {
    return (
      <div className="space-y-5">
        {groups(list).map(([key, rows]) => (
          <section key={key}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
              {dayHeading(rows[0].startAt, rows[0].timezone)}
            </h2>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
              {rows.map((m, i) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}`}
                  className={
                    "grid grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[5rem_1fr_7rem_5rem_auto] gap-2 items-center px-3 py-2 text-sm hover:bg-teal-50/60 dark:hover:bg-teal-950/30 " +
                    (i > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : "")
                  }
                >
                  <time className="tabular-nums text-zinc-600 dark:text-zinc-300 font-medium">
                    {timeLabel(m.startAt, m.timezone)}
                  </time>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-[11px] text-zinc-500 truncate sm:hidden">
                      {m.type || "Meeting"} · {providerLabel(m.provider)}
                    </div>
                  </div>
                  <div className="hidden sm:block text-zinc-500 truncate">{m.type || "Meeting"}</div>
                  <div className="hidden sm:block text-zinc-500">{providerLabel(m.provider)}</div>
                  <span className="text-xs text-teal-700 dark:text-teal-400 whitespace-nowrap">
                    Join →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
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
            <p className="text-xs text-zinc-500">Sorted by date and time</p>
          </div>
          <Link href="/admin" className="text-xs text-teal-700 hover:underline">
            Create meeting
          </Link>
        </div>

        {upcoming.length > 0 ? (
          <Table list={upcoming} />
        ) : (
          <p className="text-sm text-zinc-500 mb-6">No upcoming meetings.</p>
        )}

        {past.length > 0 && (
          <details className="mt-8">
            <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-800">
              Past meetings ({past.length})
            </summary>
            <div className="mt-3">
              <Table list={past} />
            </div>
          </details>
        )}

        {meetings.length === 0 && (
          <p className="text-sm text-zinc-500">No meetings yet. Create one in Admin.</p>
        )}
      </main>
    </div>
  );
}
