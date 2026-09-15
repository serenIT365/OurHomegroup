"use client";

import { webClientJoinUrl } from "@/lib/zoom";

/**
 * Workplace Zoom: in-page web client (scaled) + Open in app / new window.
 * Does not load @zoom/meetingsdk (React 19 incompatible).
 */
export default function ZoomSdkJoin({
  joinUrl,
}: {
  joinUrl: string;
  userName?: string;
  isHost?: boolean;
  autoEmbed?: boolean;
}) {
  const valid = Boolean(joinUrl) && !joinUrl.includes("placeholder");
  const webUrl = valid ? webClientJoinUrl(joinUrl) : "";

  if (!valid) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-[#0b1724] p-5 text-sm text-amber-300">
        Add a real Zoom join URL (https://zoom.us/j/…?pwd=…) to this meeting.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-[#0b1724] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <span className="text-sm text-blue-200">Zoom Meeting (Workplace)</span>
        <div className="flex flex-wrap gap-2">
          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500"
          >
            Open in Zoom app
          </a>
          <a
            href={webUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
          >
            Open in new window
          </a>
        </div>
      </div>
      <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
        <iframe
          title="Zoom web meeting"
          src={webUrl}
          className="absolute inset-0 h-full w-full border-0"
          allow="camera; microphone; display-capture; autoplay; fullscreen; clipboard-write"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="px-3 py-2 text-[11px] text-zinc-500">
        In-page view uses Zoom’s web client, scaled to this window. If the frame is blank or
        blocked, use Open in Zoom app or Open in new window — same Workplace meeting.
      </p>
    </div>
  );
}
