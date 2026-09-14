"use client";

import { useEffect, useRef } from "react";

export default function ZoomVideoTile({
  mediaStream,
  userId,
  kind = "video",
}: {
  mediaStream: any;
  userId: number;
  kind?: "video" | "share";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !mediaStream || userId == null) return;
    let attached: HTMLElement | null = null;
    let cancelled = false;

    (async () => {
      try {
        const el =
          kind === "share"
            ? await mediaStream.attachShareView?.(userId)
            : await mediaStream.attachVideo(userId, 3);
        if (cancelled || !el || !ref.current) return;
        ref.current.innerHTML = "";
        ref.current.appendChild(el);
        attached = el;
      } catch {
        /* attach failed */
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (kind === "share") mediaStream.detachShareView?.(userId);
        else mediaStream.detachVideo?.(userId);
      } catch {
        /* ignore */
      }
      if (attached?.parentElement) attached.parentElement.removeChild(attached);
    };
  }, [mediaStream, userId, kind]);

  return <div ref={ref} className="h-full w-full bg-black [&>*]:h-full [&>*]:w-full [&>*]:object-cover" />;
}
