"use client";

import { webClientJoinUrl } from "@/lib/zoom";

/**
 * Workplace Zoom: prefill name + passcode on the web-client URL.
 * Zoom may still show a confirm/captcha step; Meeting SDK auto-join is disabled (React 19).
 */
export default function ZoomSdkJoin({
  joinUrl,
  userName,
}: {
  joinUrl: string;
  userName?: string;
  isHost?: boolean;
  autoEmbed?: boolean;
}) {
  const valid = Boolean(joinUrl) && !joinUrl.includes("placeholder");
  const name = (userName || "").trim() || "Guest";
  const webUrl = valid ? webClientJoinUrl(joinUrl, name) : "";

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
      <p className="px-3 py-1 text-[11px] text-zinc-500">
        Joining as <span className="text-zinc-200">{name}</span> with the meeting passcode from the
        stored URL.
      </p>
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
        Passcode is in the link. Display name is your OurHomegroup profile. Zoom may still ask you
        to confirm Join or complete captcha — they do not allow a silent join from a web URL
        without Meeting SDK.
      </p>
    </div>
  );
}
