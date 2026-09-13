"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useLocalParticipant,
  useParticipants,
  useTracks,
  useRoomContext,
  isTrackReference,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
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
  isChairperson?: boolean;
}

type QueuePerson = {
  id: string;
  name: string;
  initials: string;
  onStage: boolean;
  requesting: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MeetingRoom({
  meeting,
  userIdentity,
  userName,
  role = "member",
  organizationId,
  isChairperson = false,
}: MeetingRoomProps) {
  const showZoom = meeting.provider === "hybrid" || meeting.provider === "zoom";
  const [provider, setProvider] = useState<"livekit" | "zoom">(
    meeting.provider === "zoom" ? "zoom" : "livekit"
  );
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const displayName = userName || "Guest";
  const realLiveKit = Boolean(livekitUrl && token && !token.startsWith("mock."));

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
        setError("Preview mode: camera stays off until you enable it. No demo attendees.");
      }
      setToken(t);
      setJoined(true);
      await recordJoin();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    }
  }

  useEffect(() => {
    return () => {
      if (joined) recordLeave();
    };
  }, [joined, recordLeave]);

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

  const zoomUrl = meeting.zoomJoinUrl || createZoomFallbackLink(meeting.name).joinUrl;
  const useZoomShell = meeting.provider === "zoom" || provider === "zoom";

  if (useZoomShell && !joined) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0d1b2a] text-white">
        <TopBar meeting={meeting} nowLabel={nowLabel} count={0} showZoom={true} />
        <div className="flex flex-col items-center justify-center min-h-[420px] gap-4 p-10">
          <p className="text-sm text-blue-300">
            {isChairperson ? "Chairperson lobby · Zoom" : "Attendee lobby · Zoom"}
          </p>
          <h3 className="text-2xl font-semibold">{meeting.name}</h3>
          <p className="text-sm text-zinc-400 text-center max-w-md">
            Same room layout as LiveKit. Camera and mic stay off until you enable them.
            Zoom audio/video for the group session uses your Zoom join link inside this shell.
          </p>
          {error && <p className="text-amber-300 text-sm">{error}</p>}
          <button
            onClick={async () => {
              setJoined(true);
              await recordJoin();
            }}
            className="bg-teal-600 hover:bg-teal-500 px-8 py-3 rounded-2xl font-medium"
          >
            {isChairperson ? "Start Zoom meeting as Chairperson" : "Join Zoom meeting"}
          </button>
        </div>
      </div>
    );
  }

  if (useZoomShell && joined) {
    return (
      <LocalSession
        meeting={meeting}
        isChairperson={isChairperson}
        displayName={displayName}
        userIdentity={userIdentity}
        nowLabel={nowLabel}
        showZoom={true}
        onLeave={() => {
          setJoined(false);
          recordLeave();
        }}
        zoomJoinUrl={zoomUrl}
      />
    );
  }

  if (!token) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0d1b2a] text-white">
        <TopBar meeting={meeting} nowLabel={nowLabel} count={0} showZoom={showZoom} />
        <div className="flex flex-col items-center justify-center min-h-[420px] gap-4 p-10">
          <p className="text-sm text-teal-300">
            {isChairperson ? "Chairperson lobby" : "Attendee lobby"}
          </p>
          <h3 className="text-2xl font-semibold">{meeting.name}</h3>
          <p className="text-sm text-zinc-400 text-center max-w-md">
            Camera and microphone stay off until you turn them on.
          </p>
          {error && <p className="text-amber-300 text-sm">{error}</p>}
          <button
            onClick={connectLiveKit}
            className="bg-teal-600 hover:bg-teal-500 px-8 py-3 rounded-2xl font-medium"
          >
            {isChairperson ? "Start meeting as Chairperson" : "Join meeting"}
          </button>
        </div>
      </div>
    );
  }

  const leave = () => {
    setToken(null);
    setJoined(false);
    recordLeave();
  };

  if (realLiveKit) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl!}
        connect
        video={false}
        audio={false}
        onDisconnected={leave}
        data-lk-theme="default"
      >
        <RoomAudioRenderer />
        <LiveKitSession
          meeting={meeting}
          isChairperson={isChairperson}
          displayName={displayName}
          userIdentity={userIdentity}
          nowLabel={nowLabel}
          showZoom={showZoom}
          onLeave={leave}
        />
      </LiveKitRoom>
    );
  }

  return (
    <LocalSession
      meeting={meeting}
      isChairperson={isChairperson}
      displayName={displayName}
      userIdentity={userIdentity}
      nowLabel={nowLabel}
      showZoom={showZoom}
      onLeave={leave}
    />
  );
}

function LiveKitSession(props: SessionProps) {
  const room = useRoomContext();
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } = useLocalParticipant();
  const participants = useParticipants();
  const camTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const shareTracks = useTracks(
    [Track.Source.ScreenShare, Track.Source.ScreenShareAudio],
    { onlySubscribed: false }
  );
  const [localShare, setLocalShare] = useState<MediaStream | null>(null);
  const [remoteQueue, setRemoteQueue] = useState<QueuePerson[]>([]);

  const chairId = props.meeting.chairId || props.meeting.hostId || "";
  const localCam = camTracks.find((t) => t.participant.identity === localParticipant.identity);
  const chairCam = camTracks.find((t) => t.participant.identity === chairId);
  const shareVideo = shareTracks.find((t) => t.source === Track.Source.ScreenShare);
  const sharing = Boolean(localShare) || shareTracks.some((t) => t.publication && !t.publication.isMuted);

  useEffect(() => {
    const onData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "share-queue") setRemoteQueue(msg.queue || []);
      } catch {
        /* ignore */
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room]);

  async function publishQueue(queue: QueuePerson[]) {
    setRemoteQueue(queue);
    const bytes = new TextEncoder().encode(JSON.stringify({ type: "share-queue", queue }));
    await room.localParticipant.publishData(bytes, { reliable: true });
  }

  async function toggleCam() {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  }
  async function toggleMic() {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }
  async function toggleShare() {
    if (localShare || localParticipant.isScreenShareEnabled) {
      localShare?.getTracks().forEach((tr) => tr.stop());
      setLocalShare(null);
      try {
        await localParticipant.setScreenShareEnabled(false);
      } catch {
        /* already off */
      }
      return;
    }
    const media = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
    media.getVideoTracks()[0]?.addEventListener("ended", () => {
      setLocalShare(null);
      localParticipant.setScreenShareEnabled(false).catch(() => undefined);
    });
    setLocalShare(media);
    const vt = media.getVideoTracks()[0];
    const at = media.getAudioTracks()[0];
    if (vt) {
      await localParticipant.publishTrack(vt, { source: Track.Source.ScreenShare });
    }
    if (at) {
      await localParticipant.publishTrack(at, { source: Track.Source.ScreenShareAudio });
    }
  }

  const others = participants.filter(
    (p) =>
      p.identity !== localParticipant.identity &&
      p.identity !== chairId &&
      p.identity !== props.userIdentity
  );

  const videoById: Record<string, ReactNode> = {};
  for (const tr of camTracks) {
    if (tr.publication) {
      if (isTrackReference(tr)) {
        videoById[tr.participant.identity] = (
          <VideoTrack trackRef={tr} className="h-full w-full object-cover" />
        );
      }
    }
  }

  const chairTile =
    (chairCam && isTrackReference(chairCam) && (
      <VideoTrack trackRef={chairCam} className="h-full w-full object-cover" />
    )) ||
    (props.isChairperson && isCameraEnabled && localCam && isTrackReference(localCam) ? (
      <VideoTrack trackRef={localCam} className="h-full w-full object-cover" />
    ) : null);

  const shareTile = localShare ? (
    <LocalPreview stream={localShare} muted={false} />
  ) : shareVideo && isTrackReference(shareVideo) ? (
    <VideoTrack trackRef={shareVideo} className="min-w-full min-h-full object-contain bg-black" />
  ) : null;

  return (
    <MeetingChrome
      {...props}
      cameraOn={isCameraEnabled}
      micOn={isMicrophoneEnabled}
      onToggleCam={toggleCam}
      onToggleMic={toggleMic}
      onShareContent={toggleShare}
      contentActive={sharing}
      screenShareTile={shareTile}
      cameraTile={chairTile}
      videoById={videoById}
      syncedQueue={remoteQueue}
      onQueueChange={publishQueue}
      liveAttendees={others.map((p) => ({
        id: p.identity,
        name: p.name || p.identity,
        initials: initials(p.name || p.identity),
        onStage: false,
        requesting: false,
      }))}
    />
  );
}

function LocalSession(props: SessionProps) {
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shareStream, setShareStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((tr) => tr.stop());
      shareStream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [stream, shareStream]);

  async function toggleCam() {
    if (cameraOn) {
      stream?.getVideoTracks().forEach((t) => t.stop());
      setStream((s) => {
        s?.getVideoTracks().forEach((t) => s.removeTrack(t));
        return s;
      });
      setCameraOn(false);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream((prev) => {
        prev?.getVideoTracks().forEach((t) => t.stop());
        return media;
      });
      setCameraOn(true);
    } catch {
      /* permission denied */
    }
  }

  async function toggleMic() {
    setMicOn((v) => !v);
    if (!micOn) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch {
        setMicOn(false);
      }
    }
  }

  async function toggleShare() {
    if (shareStream) {
      shareStream.getTracks().forEach((tr) => tr.stop());
      setShareStream(null);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      media.getVideoTracks()[0]?.addEventListener("ended", () => setShareStream(null));
      setShareStream(media);
    } catch {
      /* cancelled */
    }
  }

  return (
    <MeetingChrome
      {...props}
      cameraOn={cameraOn}
      micOn={micOn}
      onToggleCam={toggleCam}
      onToggleMic={toggleMic}
      onShareContent={toggleShare}
      contentActive={Boolean(shareStream)}
      screenShareTile={
        shareStream ? <LocalPreview stream={shareStream} muted={false} /> : null
      }
      cameraTile={cameraOn && stream ? <LocalPreview stream={stream} /> : null}
      videoById={{}}
      liveAttendees={[]}
    />
  );
}

function LocalPreview({ stream, muted = true }: { stream: MediaStream; muted?: boolean }) {
  return (
    <video
      autoPlay
      muted={muted}
      playsInline
      controls={false}
      ref={(el) => {
        if (el && el.srcObject !== stream) el.srcObject = stream;
      }}
      className="h-full w-full object-contain bg-black"
    />
  );
}

function ContentPlayer({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full overflow-auto bg-black">
      <div className="min-w-[120%] min-h-[120%]">{children}</div>
    </div>
  );
}

type SessionProps = {
  meeting: Meeting;
  isChairperson: boolean;
  displayName: string;
  userIdentity: string;
  nowLabel: string;
  showZoom: boolean;
  onLeave: () => void;
  zoomJoinUrl?: string;
};

function MeetingChrome({
  meeting,
  isChairperson,
  displayName,
  userIdentity,
  nowLabel,
  onLeave,
  zoomJoinUrl,
  cameraOn,
  micOn,
  onToggleCam,
  onToggleMic,
  onShareContent,
  cameraTile,
  liveAttendees,
  screenShareTile,
  contentActive,
  videoById = {},
  syncedQueue,
  onQueueChange,
}: SessionProps & {
  cameraOn: boolean;
  micOn: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onShareContent?: () => void;
  cameraTile: ReactNode;
  liveAttendees: QueuePerson[];
  screenShareTile?: ReactNode;
  contentActive?: boolean;
  videoById?: Record<string, ReactNode>;
  syncedQueue?: QueuePerson[];
  onQueueChange?: (q: QueuePerson[]) => void;
}) {
  const [queue, setQueue] = useState<QueuePerson[]>([]);
  const [stageId, setStageId] = useState<string | null>(null);
  const [contentOpen, setContentOpen] = useState(false);
  const [contentCollapsed, setContentCollapsed] = useState(false);

  useEffect(() => {
    if (contentActive) setContentOpen(true);
    if (contentActive === false) setContentOpen(false);
  }, [contentActive]);

  useEffect(() => {
    if (syncedQueue) setQueue(syncedQueue);
  }, [syncedQueue]);

  function commitQueue(next: QueuePerson[]) {
    setQueue(next);
    onQueueChange?.(next);
  }

  const requesting = queue.filter((p) => p.requesting && !p.onStage);
  const onStage = queue.filter((p) => p.onStage);
  const attendees = liveAttendees.filter(
    (p) =>
      p.id !== userIdentity &&
      !queue.some((q) => q.id === p.id && q.requesting)
  );

  const speaker = onStage.find((p) => p.id === stageId) || onStage[0];

  function requestShare() {
    commitQueue(
      queue.some((p) => p.id === userIdentity)
        ? queue.map((p) => (p.id === userIdentity ? { ...p, requesting: true } : p))
        : [
            ...queue,
            {
              id: userIdentity,
              name: displayName,
              initials: initials(displayName),
              onStage: false,
              requesting: true,
            },
          ]
    );
  }

  function promote(id: string) {
    commitQueue(queue.map((p) => (p.id === id ? { ...p, onStage: true, requesting: false } : p)));
    setStageId(id);
  }

  function removeFromStage(id: string) {
    commitQueue(queue.map((p) => (p.id === id ? { ...p, onStage: false } : p)));
    setStageId((cur) => (cur === id ? null : cur));
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

  const count = 1 + liveAttendees.length;

  return (
    <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#0d1b2a] text-white">
      <TopBar meeting={meeting} nowLabel={nowLabel} count={count} showZoom={false} />

      <div className="grid lg:grid-cols-[200px_1fr_300px] min-h-[640px]">
        <aside className="hidden lg:flex flex-col border-r border-white/10 bg-[#0b1724] p-4">
          <div className="px-3 py-2 rounded-xl bg-teal-700/40 text-sm">Meeting Room</div>
          <p className="mt-auto text-xs text-zinc-500 italic">“Recovery happens together.”</p>
        </aside>

        <section className="p-4 space-y-4 relative overflow-hidden">
          {contentOpen && (
            <div
              className={
                "absolute inset-y-0 z-20 bg-[#0e2233] border-l border-teal-700/50 shadow-2xl transition-all duration-300 " +
                (contentCollapsed
                  ? "right-0 w-10"
                  : "right-0 left-0")
              }
            >
              <div className="h-full flex">
                <button
                  onClick={() => setContentCollapsed((v) => !v)}
                  className="w-10 shrink-0 bg-teal-800/80 hover:bg-teal-700 text-xs writing-vertical"
                  title={contentCollapsed ? "Expand content" : "Collapse content"}
                >
                  {contentCollapsed ? "⟨" : "⟩"}
                </button>
                {!contentCollapsed && (
                  <div className="flex-1 p-4 flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Shared content</h3>
                      {isChairperson && (
                        <button
                          onClick={() => {
                            setContentOpen(false);
                            onShareContent?.();
                          }}
                          className="text-xs px-3 py-1 rounded-lg bg-red-600"
                        >
                          Stop sharing
                        </button>
                      )}
                    </div>
                    <div className="flex-1 rounded-2xl bg-black border border-white/10 overflow-auto min-h-[280px]">
                      <div className="min-w-[140%] min-h-[140%]">
                        {screenShareTile || (
                          <div className="h-[280px] flex items-center justify-center text-zinc-400 text-sm p-6 text-center">
                            Waiting for shared content… Choose a window or tab. Enable tab audio if you are sharing a video.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4">
          <div className="w-44 self-start rounded-2xl overflow-hidden bg-zinc-800 border border-white/10">
            <div className="text-[10px] text-zinc-400 px-2 pt-2">
              {isChairperson ? "Chairperson (You)" : "Chairperson"}
            </div>
            <div className="h-28 bg-zinc-900 relative">
              {(isChairperson ? cameraTile : videoById[meeting.chairId || meeting.hostId || ""]) || (
                <div className="h-full flex items-end p-2 text-xs text-zinc-400">Camera off</div>
              )}
            </div>
            <div className="px-2 py-1 text-xs">
              {isChairperson ? displayName : "Chairperson"}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-zinc-800 min-h-[260px] border border-white/10">
            <div className="absolute top-3 left-3 text-xs bg-black/50 px-2 py-1 rounded-full">
              Currently Speaking
            </div>
            <div className="h-[260px] flex items-center justify-center text-lg relative overflow-hidden">
              {speaker && videoById[speaker.id] ? (
                <div className="absolute inset-0">{videoById[speaker.id]}</div>
              ) : speaker ? (
                speaker.name
              ) : (
                "Waiting for a share…"
              )}
            </div>
            {isChairperson && speaker && (
              <button
                onClick={() => removeFromStage(speaker.id)}
                className="absolute bottom-3 right-3 bg-red-600 text-xs px-3 py-1.5 rounded-lg"
              >
                Remove from Stage
              </button>
            )}
          </div>
          {zoomJoinUrl && (
            <div className="rounded-2xl border border-blue-500/30 bg-[#0b1724] p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-200">Zoom session</span>
                <a
                  href={zoomJoinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-3 py-1 rounded-lg bg-blue-600"
                >
                  Open Zoom
                </a>
              </div>
              <div className="h-48 rounded-xl overflow-hidden bg-black/40 border border-white/10">
                <iframe
                  title="Zoom meeting"
                  src={zoomJoinUrl}
                  className="w-full h-full"
                  allow="camera; microphone; display-capture; autoplay; fullscreen"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                If Zoom blocks embedding, use Open Zoom. Chair/stage controls in this shell still apply.
              </p>
            </div>
          )}
          </div>

          {isChairperson && (
            <div className="rounded-2xl border border-white/10 p-3">
              <div className="text-sm mb-2">Current Stage Order ({onStage.length})</div>
              {onStage.length === 0 && (
                <p className="text-xs text-zinc-500">No one is on stage.</p>
              )}
              {onStage.map((p, i) => (
                <div key={p.id} className="flex justify-between text-sm py-1">
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <button className="text-red-300 text-xs" onClick={() => removeFromStage(p.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="border-l border-white/10 bg-[#0b1724] p-4 space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-2">
              People Requesting to Share ({requesting.length})
            </h3>
            {requesting.length === 0 ? (
              <p className="text-xs text-zinc-500">No one is requesting to share.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {requesting.map((p, i) => (
                  <button
                    key={p.id}
                    disabled={!isChairperson}
                    onClick={() => promote(p.id)}
                    className="rounded-xl bg-zinc-800 p-2 text-center text-[11px]"
                  >
                    <div>#{i + 1}</div>
                    <div className="w-full aspect-square mx-auto my-1 rounded-lg bg-teal-900 overflow-hidden">
                      {videoById[p.id] || (
                        <div className="h-full flex items-center justify-center">{p.initials}</div>
                      )}
                    </div>
                    {p.name}
                    {isChairperson && (
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
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Other Attendees ({attendees.length})</h3>
            {attendees.length === 0 ? (
              <p className="text-xs text-zinc-500">No other attendees yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {attendees.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                      {videoById[p.id] || (
                        <div className="h-full flex items-center justify-center text-[10px] text-zinc-500">
                          {p.initials}
                        </div>
                      )}
                    </div>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 py-3 bg-[#0b1724]">
        {(isChairperson || speaker?.id === userIdentity) ? (
          <button
            onClick={onToggleMic}
            className={cn("px-3 py-2 rounded-xl text-xs", micOn ? "bg-teal-700" : "bg-white/5")}
          >
            {micOn ? "Mute" : "Unmute"}
          </button>
        ) : (
          <span className="px-3 py-2 rounded-xl text-xs text-zinc-500">Mic locked</span>
        )}
        <button
          onClick={onToggleCam}
          className={cn("px-3 py-2 rounded-xl text-xs", cameraOn ? "bg-teal-700" : "bg-white/5")}
        >
          {cameraOn ? "Stop Video" : "Start Video"}
        </button>
        <span className="px-3 py-2 rounded-xl text-xs bg-teal-700">Participants</span>
        {isChairperson && (
          <button
            onClick={() => {
              setContentOpen(true);
              setContentCollapsed(false);
              onShareContent?.();
            }}
            className="px-3 py-2 rounded-xl text-xs bg-teal-800"
          >
            Share Content
          </button>
        )}
        {!isChairperson && (
          <button onClick={requestShare} className="px-3 py-2 rounded-xl text-xs bg-teal-800">
            Request to share
          </button>
        )}
        {contentOpen && (
          <button
            onClick={() => setContentCollapsed((v) => !v)}
            className="px-3 py-2 rounded-xl text-xs bg-white/10"
          >
            {contentCollapsed ? "Expand content" : "Collapse content"}
          </button>
        )}
        <button onClick={onLeave} className="px-3 py-2 rounded-xl text-xs bg-red-600">
          {isChairperson ? "End Meeting" : "Leave"}
        </button>
      </div>
    </div>
  );
}

function TopBar({
  meeting,
  nowLabel,
  count,
  showZoom,
}: {
  meeting: Meeting;
  nowLabel: string;
  count: number;
  showZoom: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-[#0b1724]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center">🌿</div>
        <div>
          <div className="font-semibold">OurHomegroup</div>
          <div className="text-[11px] text-zinc-400">Support · Share · Stay Strong</div>
        </div>
        <div className="hidden md:block ml-3">
          <div className="font-semibold">{meeting.name}</div>
          <div className="text-[11px] text-zinc-400">One day at a time · You are not alone</div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <span className="hidden sm:inline">{nowLabel}</span>
        <span>👤 {count}</span>
        {showZoom && <span className="text-xs">Hybrid</span>}
      </div>
    </div>
  );
}
