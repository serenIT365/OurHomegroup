"use client";

import { useEffect, useRef, useState } from "react";
import { parseZoomJoinUrl } from "@/lib/zoom";

export default function ZoomSdkJoin({
  joinUrl,
  userName,
  isHost,
}: {
  joinUrl: string;
  userName: string;
  isHost: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Preparing Zoom…");
  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    const { meetingNumber, password } = parseZoomJoinUrl(joinUrl);
    if (!meetingNumber || meetingNumber.length < 9) {
      setError("This meeting needs a real Zoom join URL (zoom.us/j/NUMBERS).");
      return;
    }
    if (joinedRef.current) return;
    joinedRef.current = true;

    // Zoom SDK types vary by version; keep this untyped at the boundary.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let client: any = null;

    (async () => {
      try {
        const sigRes = await fetch("/api/zoom/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingNumber,
            role: isHost ? 1 : 0,
          }),
        });
        const sig = await sigRes.json();
        if (!sigRes.ok) {
          setError(sig.error || "Could not create Zoom signature");
          return;
        }

        setStatus("Loading Meeting SDK…");
        const ZoomMtgEmbedded = (await import("@zoom/meetingsdk/embedded")).default;
        client = ZoomMtgEmbedded.createClient();
        const root = rootRef.current;
        if (!root) return;

        await client.init({
          zoomAppRoot: root,
          language: "en-US",
          patchJsMedia: true,
        });

        setStatus("Joining Zoom meeting…");
        await client.join({
          sdkKey: sig.sdkKey,
          signature: sig.signature,
          meetingNumber,
          password,
          userName: userName || "Guest",
        });
        setStatus("In Zoom meeting");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Zoom join failed");
        joinedRef.current = false;
      }
    })();

    return () => {
      client?.leave?.().catch(() => undefined);
    };
  }, [joinUrl, userName, isHost]);

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-[#0b1724] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 text-sm">
        <span className="text-blue-200">Zoom session</span>
        <a
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs px-3 py-1 rounded-lg bg-blue-600"
        >
          Open Zoom
        </a>
      </div>
      {error && (
        <p className="px-3 pb-2 text-xs text-amber-300">
          {error} Use Open Zoom if the embedded client cannot start.
        </p>
      )}
      {!error && status !== "In Zoom meeting" && (
        <p className="px-3 pb-2 text-xs text-zinc-400">{status}</p>
      )}
      <div ref={rootRef} className="min-h-[360px] bg-black" />
    </div>
  );
}
