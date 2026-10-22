import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { store } from "@/lib/store";
import { upcomingSlots } from "@/lib/occurrences";
import HomeSchedule, { type HomeItem } from "@/components/HomeSchedule";

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

function fmtTime(iso: string, timeZone = "America/New_York") {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

function is24Hour(startAt: string, endAt: number) {
  const hours = (endAt - new Date(startAt).getTime()) / (60 * 60 * 1000);
  return hours >= 20 && hours <= 26;
}

export default async function Home() {
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  let marathonItems: HomeItem[] = [];
  let liveItems: HomeItem[] = [];
  let nextHourItems: HomeItem[] = [];
  let nextSixItems: HomeItem[] = [];
  try {
    const meetings = (await store.listMeetings("org_demo")).filter(
      (m) => m.enabled !== false && m.status !== "pending" && m.status !== "declined"
    );
    const now = new Date();
    const nowMs = now.getTime();
    const slots = upcomingSlots(meetings, new Date(nowMs - 26 * 60 * 60 * 1000), 1);
    const toItem = (s: (typeof slots)[number], meta: string): HomeItem => ({
      id: s.meeting.id,
      href: `/meetings/${s.meeting.id}`,
      name: s.meeting.name,
      meta,
      type: s.meeting.type,
      frequency: s.meeting.recurrence || "none",
      description: s.meeting.description,
      provider: s.meeting.provider,
    });
    marathonItems = slots
      .filter((s) => is24Hour(s.startAt, s.endAt) && new Date(s.startAt).getTime() <= nowMs && s.endAt > nowMs)
      .map((s) => toItem(s, `Started ${fmtTime(s.startAt, s.meeting.timezone)}`));
    liveItems = slots
      .filter((s) => {
        const t = new Date(s.startAt).getTime();
        return t <= nowMs && s.endAt > nowMs && !is24Hour(s.startAt, s.endAt);
      })
      .map((s) => toItem(s, `Started ${fmtTime(s.startAt, s.meeting.timezone)} · ${fmtRemain(s.endAt - Date.now())} remaining`));
    nextHourItems = slots
      .filter((s) => {
        const t = new Date(s.startAt).getTime();
        return t > nowMs && t <= nowMs + 60 * 60 * 1000 && !is24Hour(s.startAt, s.endAt);
      })
      .map((s) => toItem(s, `in ${fmtRemain(new Date(s.startAt).getTime() - Date.now())} · ${fmtTime(s.startAt, s.meeting.timezone)}`));
    nextSixItems = slots
      .filter((s) => {
        const t = new Date(s.startAt).getTime();
        return t > nowMs + 60 * 60 * 1000 && t <= nowMs + 6 * 60 * 60 * 1000 && !is24Hour(s.startAt, s.endAt);
      })
      .map((s) => toItem(s, fmtTime(s.startAt, s.meeting.timezone)));
  } catch {
    /* store optional on home */
  }

  return (
    <div className="min-h-screen bg-[#0b1016] text-zinc-100">
      <nav className="border-b border-white/10 bg-[#0b1016]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              OH
            </div>
            <span className="font-semibold tracking-tight text-sm">OurHomegroup</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-300">
            <Link href="/meetings" className="hover:text-teal-400">Meetings</Link>
            <Link href="/dashboard" className="hover:text-teal-400 hidden sm:inline">Dashboard</Link>
            <Link href="/admin" className="hover:text-teal-400 hidden sm:inline">Admin</Link>
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

      <section className="relative min-h-[680px] flex items-end pb-36">
        <img src="/home-still.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_40%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1016] via-transparent to-black/20" />
        <div className="relative w-full max-w-6xl mx-auto px-4 pb-8">
          <p className="text-teal-200 text-sm mb-2">Support · Share · Stay Strong</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white max-w-xl leading-tight">
            Find your people.<br />
            <span className="text-teal-400">Stay for the meeting.</span>
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/meetings" className="inline-block bg-white text-zinc-900 hover:bg-zinc-100 px-5 py-2.5 rounded-xl font-medium">
              Find a meeting
            </Link>
            <Link href="/meetings/submit" className="inline-block border border-white/30 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl font-medium">
              Learn more
            </Link>
          </div>
          <blockquote className="mt-6 max-w-sm rounded-2xl border border-white/15 bg-black/30 backdrop-blur px-5 py-4 text-white/90 italic">
            “{quote.t}”
            <footer className="not-italic text-sm text-white/60 mt-2">— {quote.a}</footer>
          </blockquote>
        </div>
      </section>

      <HomeSchedule
        marathon={marathonItems}
        live={liveItems}
        nextHour={nextHourItems}
        nextSix={nextSixItems}
      />

      <section className="max-w-6xl mx-auto px-4 pb-8 grid md:grid-cols-3 gap-4">
        <aside className="md:col-span-2 rounded-2xl border border-zinc-800 p-5 bg-[#111820]">
          <h3 className="font-semibold mb-2">You are welcome here</h3>
          <p className="text-sm text-zinc-400">
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

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
        OurHomegroup · One day at a time
      </footer>
    </div>
  );
}
