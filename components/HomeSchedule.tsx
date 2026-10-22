"use client";

import { useState } from "react";
import Link from "next/link";

export type HomeItem = {
  id: string;
  href: string;
  name: string;
  meta: string;
  type?: string;
  frequency?: string;
  description?: string;
  provider?: string;
  tags?: string[];
};

export default function HomeSchedule({
  marathon,
  live,
  nextHour,
  nextSix,
}: {
  marathon: HomeItem[];
  live: HomeItem[];
  nextHour: HomeItem[];
  nextSix: HomeItem[];
}) {
  const [open, setOpen] = useState<HomeItem | null>(null);

  return (
    <>
      <section className="relative z-10 -mt-28 max-w-3xl mx-auto px-4 pb-10 space-y-2">
        {marathon.length > 0 && (
          <Bucket title="24HR Meetings" tone="marathon" items={marathon} defaultOpen onPick={setOpen} />
        )}
        <Bucket title="Meetings in progress" tone="live" items={live} defaultOpen onPick={setOpen} />
        <Bucket title="Meetings within next hour" tone="soon" items={nextHour} onPick={setOpen} />
        <Bucket title="Meetings within next 6 hours" tone="later" items={nextSix} onPick={setOpen} />
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setOpen(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#111820] p-5 text-zinc-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{open.name}</h3>
              <button onClick={() => setOpen(null)} className="text-zinc-400 text-sm">Close</button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{open.meta}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Tags</dt>
                <dd>{open.tags && open.tags.length ? open.tags.join(", ") : open.type || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Frequency</dt>
                <dd className="capitalize">{open.frequency || "One-time"}</dd>
              </div>
              {open.description && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-500">Description</dt>
                  <dd className="text-zinc-300">{open.description}</dd>
                </div>
              )}
            </dl>
            <Link
              href={open.href}
              className="mt-5 inline-block rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
            >
              Join
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function Bucket({
  title,
  tone,
  items,
  defaultOpen = false,
  onPick,
}: {
  title: string;
  tone: "marathon" | "live" | "soon" | "later";
  items: HomeItem[];
  defaultOpen?: boolean;
  onPick: (item: HomeItem) => void;
}) {
  const wrap =
    tone === "marathon"
      ? "bg-zinc-800/80 border-zinc-700"
      : tone === "live"
        ? "bg-emerald-950/30 border-emerald-900"
        : tone === "soon"
          ? "bg-amber-950/30 border-amber-900"
          : "bg-sky-950/30 border-sky-900";
  return (
    <details open={defaultOpen} className="rounded-2xl border border-white/10 bg-black/45 backdrop-blur px-3 py-2">
      <summary className="cursor-pointer flex items-center justify-between text-sm font-semibold py-1">
        <span className={tone === "marathon" ? "text-yellow-400" : ""}>{title}</span>
        <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${tone === "marathon" ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800"}`}>
          {items.length}
        </span>
      </summary>
      <div className="mt-2 space-y-2">
        {items.length === 0 && <p className="text-sm text-zinc-500 px-1 py-2">None right now.</p>}
        {items.map((it) => (
          <button
            key={it.id + it.meta}
            type="button"
            onClick={() => onPick(it)}
            className={`block w-full text-left rounded-xl border px-3 py-2.5 ${wrap}`}
          >
            <div className="font-medium text-sm">{it.name}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{it.meta}</div>
          </button>
        ))}
      </div>
    </details>
  );
}
