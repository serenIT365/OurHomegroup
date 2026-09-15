import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { store } from "@/lib/store";
import { upcomingSlots } from "@/lib/occurrences";

export const dynamic = "force-dynamic";

const QUOTES = [
  { t: "One day at a time.", a: "Recovery wisdom" },
  { t: "You are not alone. We stay until the miracle happens.", a: "Homegroup" },
  { t: "Progress, not perfection.", a: "Recovery wisdom" },
  { t: "We can do together what we could not do alone.", a: "Fellowship" },
  { t: "Keep coming back. It works if you work it.", a: "Meeting close" },
  { t: "Courage is one more meeting when you would rather hide.", a: "OurHomegroup" },
  { t: "The opposite of addiction is connection.", a: "Community" },
];

function fmtRemain(ms: number) {
  if (ms <= 0) return "now";
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? `${h} hr ${rm} min` : `${h} hr`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"}`;
}

export default async function Home() {
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  let today: ReturnType<typeof upcomingSlots> = [];
  let live: ReturnType<typeof upcomingSlots> = [];
  try {
    const meetings = (await store.listMeetings("org_demo")).filter((m) => m.enabled !== false);
    const now = new Date();
    const slots = upcomingSlots(meetings, new Date(now.getTime() - 2 * 60 * 60 * 1000), 2);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    live = slots.filter((s) => {
      const t = new Date(s.startAt).getTime();
      return t <= now.getTime() && s.endAt > now.getTime();
    });
    today = slots.filter((s) => {
      const t = new Date(s.startAt).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime() && s.endAt > now.getTime() && !live.includes(s);
    });
  } catch {
    /* store optional on home */
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <nav className="border-b bg-white/90 dark:bg-zinc-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              OH
            </div>
            <span className="font-semibold tracking-tight text-sm">OurHomegroup</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/meetings" className="hover:text-teal-600">
              Meetings
            </Link>
            <Link href="/dashboard" className="hover:text-teal-600 hidden sm:inline">
              Dashboard
            </Link>
            <Link href="/admin" className="hover:text-teal-600 hidden sm:inline">
              Admin
            </Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-teal-600 text-white px-4 py-1.5 rounded-full text-sm">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[380px] flex items-end">
        <img
          src="/home-still.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 text-white">
          <p className="text-teal-200 text-sm mb-2">Support · Share · Stay Strong</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-xl">
            Find your people. Stay for the meeting.
          </h2>
          <blockquote className="mt-5 max-w-xl text-lg text-white/90 italic">
            “{quote.t}”
            <footer className="not-italic text-sm text-white/60 mt-1">— {quote.a}</footer>
          </blockquote>
          <Link
            href="/meetings"
            className="inline-block mt-6 bg-teal-600 hover:bg-teal-500 px-6 py-2.5 rounded-xl font-medium"
          >
            Browse meetings
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-teal-800/40 bg-teal-950/40 p-4">
          <h3 className="text-sm font-semibold text-teal-300 mb-2">Meetings in progress</h3>
          {live.length === 0 ? (
            <p className="text-sm text-zinc-500">None right now.</p>
          ) : (
            <ul className="space-y-2">
              {live.map((s) => (
                <li key={s.meeting.id + s.startAt}>
                  <Link href={`/meetings/${s.meeting.id}`} className="flex justify-between text-sm hover:text-teal-400">
                    <span>{s.meeting.name}</span>
                    <span className="text-zinc-400">{fmtRemain(s.endAt - Date.now())} left</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold mb-2">Today’s meetings</h3>
          {today.length === 0 ? (
            <p className="text-sm text-zinc-500">No more meetings today. See the full schedule.</p>
          ) : (
            <ul className="space-y-2">
              {today.map((s) => (
                <li key={s.meeting.id + s.startAt}>
                  <Link href={`/meetings/${s.meeting.id}`} className="flex justify-between text-sm hover:text-teal-600">
                    <span>{s.meeting.name}</span>
                    <span className="text-zinc-500">in {fmtRemain(new Date(s.startAt).getTime() - Date.now())}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-8 grid md:grid-cols-3 gap-4">
        <aside className="md:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-900">
          <h3 className="font-semibold mb-2">You are welcome here</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            OurHomegroup is a quiet room for recovery and support. Camera off is always allowed.
            What is said here stays here.
          </p>
        </aside>
        <aside className="rounded-2xl border border-rose-900/40 bg-rose-950/30 p-5 text-sm">
          <h3 className="font-semibold text-rose-200 mb-2">If you need help now</h3>
          <ul className="space-y-1.5 text-zinc-300">
            <li>
              US: <a className="text-white underline" href="tel:988">988</a> Suicide &amp; Crisis Lifeline
            </li>
            <li>
              SAMHSA: <a className="text-white underline" href="tel:18006624357">1-800-662-HELP</a>
            </li>
            <li>
              IASP:{" "}
              <a className="text-white underline" href="https://www.iasp.info/suicidalthoughts/" target="_blank" rel="noreferrer">
                Local helplines
              </a>
            </li>
          </ul>
          <p className="text-[11px] text-zinc-500 mt-2">OurHomegroup is peer support, not emergency care.</p>
        </aside>
      </section>

      <footer className="border-t py-8 text-center text-xs text-zinc-500">
        OurHomegroup · One day at a time
      </footer>
    </div>
  );
}
