"use client";

/**
 * Workplace Zoom path (A). Meeting SDK Component View is not loaded:
 * @zoom/meetingsdk reads ReactCurrentOwner and crashes on React 19.
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

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-[#0b1724] p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-blue-200">Zoom Meeting (Workplace license)</span>
        {valid ? (
          <a
            href={joinUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
          >
            Open Zoom
          </a>
        ) : null}
      </div>
      <p className="text-sm text-zinc-400">
        This meeting uses your Zoom Workplace license. Join in the Zoom app or browser —
        same as a normal Zoom meeting. In-page embed is disabled (Zoom Meeting SDK is not
        compatible with this site’s React version).
      </p>
      {valid ? (
        <p className="text-xs text-zinc-500 break-all">{joinUrl}</p>
      ) : (
        <p className="text-xs text-amber-300">
          Add a real join URL (https://zoom.us/j/…?pwd=…) on the meeting to enable Open Zoom.
        </p>
      )}
    </div>
  );
}
