"use client";

import { useEffect, useRef, useState } from "react";
import { parseZoomJoinUrl } from "@/lib/zoom";

/** A = Open Zoom (default). B = Meeting SDK Component View on demand. */
export default function ZoomSdkJoin({
  joinUrl,
  userName,
  isHost,
  autoEmbed = false,
}: {
  joinUrl: string;
  userName: string;
  isHost: boolean;
  autoEmbed?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [embed, setEmbed] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (autoEmbed) {
      /* still require an explicit click — SDK is not React 19 safe */
    }
  }, [autoEmbed]);

  useEffect(() => {
    if (!embed) return;
    const { meetingNumber, password } = parseZoomJoinUrl(joinUrl);
    if (!meetingNumber || meetingNumber.length < 9) {
      setError("Need a real Zoom join URL: https://zoom.us/j/MEETINGID?pwd=…");
      return;
    }
    if (joinedRef.current) return;
    joinedRef.current = true;
    let client: any = null;

    (async () => {
      try {
        const sigRes = await fetch("/api/zoom/signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meetingNumber, role: isHost ? 1 : 0 }),
        });
        const sig = await sigRes.json();
        if (!sigRes.ok) {
          setError(sig.error || "Could not sign Meeting SDK JWT");
          return;
        }
        setStatus("Loading Zoom Component View…");
        const ZoomMtgEmbedded = (await import("@zoom/meetingsdk/embedded")).default;
        client = ZoomMtgEmbedded.createClient();
        if (!rootRef.current) return;
        await client.init({
          zoomAppRoot: rootRef.current,
          language: "en-US",
          patchJsMedia: true,
        });
        await client.join({
          sdkKey: sig.sdkKey,
          signature: sig.signature,
          meetingNumber,
          password,
          userName: userName || "Guest",
        });
        setStatus("");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Embed failed";
        setError(msg.includes("ReactCurrentOwner")
          ? "Zoom Component View is not compatible with this React version. Use Open Zoom."
          : msg + " — use Open Zoom.");
        joinedRef.current = false;
        setEmbed(false);
      }
    })();

    return () => {
      client?.leave?.().catch(() => undefined);
    };
  }, [embed, joinUrl, userName, isHost]);

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-[#0b1724] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
        <span className="text-blue-200">Zoom Meeting (Workplace)</span>
        <div className="flex gap-2">
          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-3 py-1 rounded-lg bg-blue-600"
          >
            Open Zoom
          </a>
          {!embed && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setEmbed(true);
              }}
              className="text-xs px-3 py-1 rounded-lg bg-white/10"
            >
              Embed on this page
            </button>
          )}
        </div>
      </div>
      {error && <p className="px-3 pb-2 text-xs text-amber-300">{error}</p>}
      {status && !error && <p className="px-3 pb-2 text-xs text-zinc-400">{status}</p>}
      {embed && !error && <div ref={rootRef} className="min-h-[420px] bg-black" />}
      {!embed && (
        <p className="px-4 py-6 text-sm text-zinc-400">
          Workplace-licensed Zoom Meeting. Use <strong className="text-white">Open Zoom</strong> for
          the Zoom app or browser client. Embed is optional and may fail on this React version.
        </p>
      )}
    </div>
  );
}
