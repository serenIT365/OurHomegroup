"use client";

import { useEffect, useMemo, useState } from "react";
import { parseZoomJoinUrl, webClientJoinUrl } from "@/lib/zoom";

/**
 * Workplace Zoom stays on ourhomegroup.com via same-origin /zoom-client.html
 * (Meeting SDK Client View in an isolated iframe — not React 19).
 */
export default function ZoomSdkJoin({
  joinUrl,
  userName,
  isHost,
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
  const [iframeSrc, setIframeSrc] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!valid || !parsed.meetingNumber) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/zoom/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingNumber: parsed.meetingNumber,
            role: isHost ? 1 : 0,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not sign Zoom JWT");
        const qs = new URLSearchParams({
          mn: parsed.meetingNumber,
          pwd: parsed.password || "",
          name,
          signature: data.signature,
          sdkKey: data.sdkKey,
          leaveUrl: typeof window !== "undefined" ? `${window.location.origin}/meetings` : "/meetings",
        });
        if (!cancelled) setIframeSrc(`/zoom-client.html?${qs.toString()}`);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Zoom sign failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [valid, parsed.meetingNumber, parsed.password, name, isHost]);

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
        Joining as <span className="text-zinc-200">{name}</span> with the stored passcode.
      </p>
      {error && <p className="px-3 pb-2 text-xs text-amber-300">{error}</p>}
      <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
        {iframeSrc ? (
          <iframe
            title="OurHomegroup Zoom meeting"
            src={iframeSrc}
            className="absolute inset-0 h-full w-full border-0"
            allow="camera; microphone; display-capture; autoplay; fullscreen; clipboard-write"
            allowFullScreen
          />
        ) : (
          !error && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
              Preparing Zoom on this page…
            </p>
          )
        )}
      </div>
    </div>
  );
}
