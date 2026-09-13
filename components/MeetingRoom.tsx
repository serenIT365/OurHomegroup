"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { fetchLiveKitToken } from "@/lib/livekit";
import type { Meeting, Role } from "@/lib/types";
import { createZoomFallbackLink } from "@/lib/zoom";
import { cn } from "@/lib/utils";

interface MeetingRoomProps {
  meeting: Meeting;
  userIdentity: string;
  userName?: string;
  role?: Role;
  organizationId?: string;
}

type Participant = {
  id: string;
  name: string;
  initials: string;
  onStage: boolean;
  requesting: boolean;
  isChair: boolean;
  speaking: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const SEED: Omit<Participant, "onStage" | "requesting" | "speaking">[] = [
  { id: "p1", name: "Alex S.", initials: "AS", isChair: false },
  { id: "p2", name: "Jamie K.", initials: "JK", isChair: false },
  { id: "p3", name: "Taylor M.", initials: "TM", isChair: false },
  { id: "p4", name: "Morgan B.", initials: "MB", isChair: false },
  { id: "p5", name: "Chris L.", initials: "CL", isChair: false },
  { id: "p6", name: "Dana R.", initials: "DR", isChair: false },
  { id: "p7", name: "Jordan P.", initials: "JP", isChair: false },
  { id: "p8", name: "Casey W.", initials: "CW", isChair: false },
  { id: "p9", name: "Riley T.", initials: "RT", isChair: false },
  { id: "p10", name: "Pat H.", initials: "PH", isChair: false },
  { id: "p11", name: "Lee D.", initials: "LD", isChair: false },
  { id: "p12", name: "Sam K.", initials: "SK", isChair: false },
];

export default function MeetingRoom({
  meeting,
  userIdentity,
  userName,
  role = "member",
  organizationId,
}: MeetingRoomProps) {
  const showZoom = meeting.provider === "hybrid" || meeting.provider === "zoom";
  const [provider, setProvider] = useState<"livekit" | "zoom">(
    meeting.provider === "zoom" ? "zoom" : "livekit"
  );
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const isChair = role === "moderator" || role === "admin" || role === "superadmin";
  const displayName = userName || "Guest";

  const [queue, setQueue] = useState<Participant[]>(() =>
    SEED.map((p, i) => ({
      ...p,
      onStage: false,
      requesting: i < 9,
      speaking: false,
    }))
  );
  const [stageSpeakerId, setStageSpeakerId] = useState<string | null>(null);

  const recordJoin = useCallback(async () => {
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          meetingId: meeting.id,
          organizationId: meeting.organizationId,
          userId: userIdentity,
          displayName,
          role,
        }),
      });
    } catch {
      /* ignore */
    }
  }, [meeting, userIdentity, displayName, role]);

  const recordLeave = useCallback(async () => {
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leave",
          meetingId: meeting.id,
          userId: userIdentity,
        }),
      });
    } catch {
      /* ignore */
    }
  }, [meeting.id, userIdentity]);

  async function connectLiveKit() {
    setError(null);
    try {
      const { token: t, mock } = await fetchLiveKitToken({
        roomName: meeting.livekitRoomName,
        identity: userIdentity,
        name: displayName,
        role,
        organizationId: organizationId || meeting.organizationId,
      });
      if (mock && !livekitUrl) {
        setError("LiveKit not configured — chair/attendee layout is in preview mode.");
      }
      setToken(t);
      setJoined(true);
      await recordJoin();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    }
  }

  function openZoom() {
    const url = meeting.zoomJoinUrl || createZoomFallbackLink(meeting.name).joinUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    return () => {
      if (joined) recordLeave();
    };
  }, [joined, recordLeave]);

  const requesting = queue.filter((p) => p.requesting && !p.onStage);
  const onStage = queue.filter((p) => p.onStage);
  const others = queue.filter((p) => !p.requesting && !p.onStage);
  const speaker = onStage.find((p) => p.id === stageSpeakerId) || onStage[0];

  function promote(id: string) {
    setQueue((prev) =>
      prev.map((p) => (p.id === id ? { ...p, onStage: true, requesting: false } : p))
    );
    setStageSpeakerId(id);
  }

  function removeFromStage(id: string) {
    setQueue((prev) => prev.map((p) => (p.id === id ? { ...p, onStage: false, speaking: false } : p)));
    setStageSpeakerId((cur) => (cur === id ? null : cur));
  }

  function moveQueue(id: string, dir: -1 | 1) {
    setQueue((prev) => {
      const req = prev.filter((p) => p.requesting && !p.onStage);
      const rest = prev.filter((p) => !(p.requesting && !p.onStage));
      const idx = req.findIndex((p) => p.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= req.length) return prev;
      const copy = [...req];
      const [item] = copy.splice(idx, 1);
      copy.splice(next, 0, item);
      return [...copy, ...rest];
    });
  }

  function requestShare() {
    const id = userIdentity;
    setQueue((prev) => {
      if (prev.some((p) => p.id === id)) {
        return prev.map((p) => (p.id === id ? { ...p, requesting: true } : p));
      }
      return [
        {
          id,
          name: displayName,
          initials: initials(displayName),
          onStage: false,
          requesting: true,
          isChair: isChair,
          speaking: false,
        },
        ...prev,
      ];
    });
  }

  const nowLabel = useMemo(
    () =>
      new Date().toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    []
  );

  if (provider === "zoom" && showZoom) {
    return (
      <div className="rounded-3xl border border-zinc-700 bg-zinc-900 text-white p-10 text-center">
        <p className="text-zinc-300 mb-4">Zoom fallback for this hybrid meeting.</p>
        <button onClick={openZoom} className="bg-blue-600 px-6 py-3 rounded-2xl">
          Open in Zoom
        </button>
        <button
          onClick={() => setProvider("livekit")}
          className="ml-3 px-6 py-3 rounded-2xl border border-zinc-600"
        >
          Back to LiveKit
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-3xl border border-zinc-700 bg-[#0d1b2a] text-white overflow-hidden">
        <Header meeting={meeting} showZoom={showZoom} onZoom={() => setProvider("zoom")} nowLabel={nowLabel} count={queue.length + 1} />
        <div className="flex flex-col items-center justify-center min-h-[420px] gap-4 p-10">
          <p className="text-sm text-teal-300">{isChair ? "Chairperson lobby" : "Attendee lobby"}</p>
          <h3 className="text-2xl font-semibold">{meeting.name}</h3>
          {error && <p className="text-amber-300 text-sm">{error}</p>}
          <button onClick={connectLiveKit} className="bg-teal-600 hover:bg-teal-500 px-8 py-3 rounded-2xl font-medium">
            {isChair ? "Start meeting as Chairperson" : "Join meeting"}
          </button>
        </div>
      </div>
    );
  }

  const shell = (
    <MeetingChrome
      meeting={meeting}
      isChair={isChair}
      displayName={displayName}
      nowLabel={nowLabel}
      showZoom={showZoom}
      onZoom={() => setProvider("zoom")}
      onLeave={() => {
        setToken(null);
        setJoined(false);
        recordLeave();
      }}
      requesting={requesting}
      onStage={onStage}
      others={others}
      speaker={speaker}
      promote={isChair ? promote : undefined}
      removeFromStage={isChair ? removeFromStage : undefined}
      moveQueue={isChair ? moveQueue : undefined}
      requestShare={!isChair ? requestShare : undefined}
    />
  );

  if (livekitUrl && token && !token.startsWith("mock.")) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect
        video
        audio
        onDisconnected={() => {
          setToken(null);
          setJoined(false);
          recordLeave();
        }}
        data-lk-theme="default"
      >
        <RoomAudioRenderer />
        {shell}
        <LiveKitStageOverlay />
      </LiveKitRoom>
    );
  }

  return shell;
}

function LiveKitStageOverlay() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  if (!tracks.length) return null;
  return (
    <div className="hidden">
      {tracks.map((t) => (
        <VideoTrack key={t.participant.identity} trackRef={t} />
      ))}
    </div>
  );
}

function Header({
  meeting,
  showZoom,
  onZoom,
  nowLabel,
  count,
}: {
  meeting: Meeting;
  showZoom: boolean;
  onZoom: () => void;
  nowLabel: string;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-[#0b1724]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-lg">🌿</div>
        <div>
          <div className="font-semibold leading-tight">OurHomegroup</div>
          <div className="text-[11px] text-zinc-400">Support · Share · Stay Strong</div>
        </div>
        <div className="hidden md:block ml-4">
          <div className="font-semibold">{meeting.name}</div>
          <div className="text-[11px] text-zinc-400">
            {meeting.description || "One day at a time · You are not alone"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-zinc-400 hidden sm:inline">{nowLabel}</span>
        <span className="flex items-center gap-1 text-zinc-300">👤 {count}</span>
        {showZoom && (
          <button onClick={onZoom} className="text-xs px-3 py-1.5 rounded-full bg-blue-600">
            Zoom fallback
          </button>
        )}
      </div>
    </div>
  );
}

function MeetingChrome(props: {
  meeting: Meeting;
  isChair: boolean;
  displayName: string;
  nowLabel: string;
  showZoom: boolean;
  onZoom: () => void;
  onLeave: () => void;
  requesting: Participant[];
  onStage: Participant[];
  others: Participant[];
  speaker?: Participant;
  promote?: (id: string) => void;
  removeFromStage?: (id: string) => void;
  moveQueue?: (id: string, dir: -1 | 1) => void;
  requestShare?: () => void;
}) {
  const {
    meeting,
    isChair,
    displayName,
    nowLabel,
    showZoom,
    onZoom,
    onLeave,
    requesting,
    onStage,
    others,
    speaker,
    promote,
    removeFromStage,
    moveQueue,
    requestShare,
  } = props;

  return (
    <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0d1b2a] text-white">
      <Header
        meeting={meeting}
        showZoom={showZoom}
        onZoom={onZoom}
        nowLabel={nowLabel}
        count={requesting.length + onStage.length + others.length + 1}
      />

      <div className="grid lg:grid-cols-[220px_1fr_320px] gap-0 min-h-[640px]">
        {/* Nav */}
        <aside className="hidden lg:flex flex-col border-r border-white/10 bg-[#0b1724] p-4">
          <nav className="space-y-1 text-sm">
            {["Meeting Room", "Community", "Resources", "Calendar", "Messages", "My Profile"].map(
              (item, i) => (
                <div
                  key={item}
                  className={cn(
                    "px-3 py-2 rounded-xl",
                    i === 0 ? "bg-teal-700/40 text-teal-100" : "text-zinc-400"
                  )}
                >
                  {item}
                </div>
              )
            )}
          </nav>
          <p className="mt-auto text-xs text-zinc-500 italic px-2">
            “Recovery happens together.”
          </p>
        </aside>

        {/* Stage */}
        <section className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="w-40 shrink-0 rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 p-2">
              <div className="text-[10px] text-zinc-400 mb-1">Chairperson (You)</div>
              <div className="h-24 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-end p-2 text-xs">
                {isChair ? displayName : "Chair"}
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-zinc-800 min-h-[280px] border border-white/10">
            <div className="absolute top-3 left-3 text-xs bg-black/50 px-2 py-1 rounded-full">
              Currently Speaking
            </div>
            <div className="h-[280px] flex items-center justify-center text-xl font-medium">
              {speaker ? speaker.name : "Waiting for a share…"}
            </div>
            <div className="absolute bottom-3 left-3 text-sm">{speaker?.name}</div>
            {isChair && speaker && removeFromStage && (
              <button
                onClick={() => removeFromStage(speaker.id)}
                className="absolute bottom-3 right-3 bg-red-600 text-xs px-3 py-1.5 rounded-lg"
              >
                Remove from Stage
              </button>
            )}
          </div>

          {isChair && (
            <div className="rounded-2xl border border-white/10 p-3">
              <div className="flex justify-between text-sm mb-2">
                <span>Current Stage Order ({onStage.length})</span>
                <span className="text-zinc-500 text-xs">Chair can reorder queue</span>
              </div>
              {onStage.length === 0 && (
                <p className="text-xs text-zinc-500">Promote someone from the request list.</p>
              )}
              {onStage.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <button
                    onClick={() => removeFromStage?.(p.id)}
                    className="text-xs text-red-300 hover:text-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isChair && (
            <p className="text-center text-zinc-400 text-sm italic py-2">
              “Progress, not perfection.”
            </p>
          )}
        </section>

        {/* Right rail */}
        <aside className="border-l border-white/10 bg-[#0b1724] p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">
                People Requesting to Share ({requesting.length})
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {requesting.map((p, i) => (
                <button
                  key={p.id}
                  disabled={!isChair}
                  onClick={() => promote?.(p.id)}
                  className="rounded-xl bg-zinc-800 p-2 text-center text-[11px] hover:bg-zinc-700 disabled:hover:bg-zinc-800"
                >
                  <div className="text-zinc-500">#{i + 1}</div>
                  <div className="w-10 h-10 mx-auto my-1 rounded-lg bg-teal-800 flex items-center justify-center">
                    {p.initials}
                  </div>
                  {p.name}
                  {isChair && moveQueue && (
                    <div className="flex justify-center gap-1 mt-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQueue(p.id, -1);
                        }}
                      >
                        ↑
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQueue(p.id, 1);
                        }}
                      >
                        ↓
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {isChair && (
              <p className="text-[11px] text-zinc-500 mt-2">Click a person to put them on stage.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Other Attendees ({others.length})</h3>
            <div className="grid grid-cols-2 gap-1 text-xs text-zinc-300">
              {others.map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">
                    {p.initials[0]}
                  </span>
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 py-3 bg-[#0b1724]">
        <Control label="Mute" />
        <Control label="Stop Video" />
        <Control label="Participants" active />
        <Control label="Chat" />
        <Control label="Share Screen" />
        <Control label="Reactions" />
        {!isChair && requestShare && (
          <button onClick={requestShare} className="px-4 py-2 rounded-xl bg-teal-700 text-sm">
            Request to share
          </button>
        )}
        <button onClick={onLeave} className="px-4 py-2 rounded-xl bg-red-600 text-sm ml-2">
          End Meeting
        </button>
      </div>
    </div>
  );
}

function Control({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        "px-3 py-2 rounded-xl text-xs",
        active ? "bg-teal-700" : "bg-white/5 hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}
