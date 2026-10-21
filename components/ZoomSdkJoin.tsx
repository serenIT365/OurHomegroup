"use client";

import { useMemo } from "react";
import { parseZoomJoinUrl, webClientJoinUrl } from "@/lib/zoom";

/**
 * Workplace Zoom opens outside the shell.
 * Embedded Meeting SDK is skipped: unpublished SDK apps return 4011
 * when the meeting is hosted by any Zoom account other than the SDK owner.
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
  const parsed = useMemo(() => parseZoomJoinUrl(joinUrl), [joinUrl]);
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
        <span className="text-sm text-blue-200">Zoom Meeting · OurHomegroup</span>
        <div className="flex flex-wrap gap-2">
          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
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
        Joining as <span className="text-zinc-200">{name}</span>
        {parsed.password ? " with the stored passcode." : "."}
      </p>
      <div className="px-4 py-10 text-center text-sm text-zinc-400">
        <p>This meeting opens in Zoom so it stays on Workplace licensing.</p>
        <p className="mt-2 text-xs text-zinc-500">
          Use Open in Zoom app or Open in new window. Camera and microphone stay off until you turn them on inside Zoom.
        </p>
      </div>
    </div>
  );
}
