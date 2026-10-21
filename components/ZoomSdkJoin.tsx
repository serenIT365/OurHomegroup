"use client";

import { useMemo, useState } from "react";
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
  const [displayName, setDisplayName] = useState((userName || "").trim() || "Guest");
  const parsed = useMemo(() => parseZoomJoinUrl(joinUrl), [joinUrl]);
  const webUrl = valid ? webClientJoinUrl(joinUrl, displayName) : "";

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
      <div className="px-3 py-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
        <span>Joining as</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-100"
          aria-label="Display name in Zoom"
        />
        <span>{parsed.password ? "with the stored passcode." : ""}</span>
      </div>
      <div className="px-4 py-10 text-center text-sm text-zinc-400">
        <p>This meeting opens in Zoom so it stays on Workplace licensing.</p>
        <p className="mt-2 text-xs text-zinc-500">
          Edit the name above before you open. It is sent as your Zoom display name. Camera and microphone stay off until you turn them on inside Zoom.
        </p>
      </div>
    </div>
  );
}
