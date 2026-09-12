"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
} from "@livekit/components-react";
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

export default function MeetingRoom({
  meeting,
  userIdentity,
  userName,
  role = "member",
  organizationId,
}: MeetingRoomProps) {
  const [provider, setProvider] = useState<"livekit" | "zoom">(
    meeting.provider === "zoom" ? "zoom" : "livekit"
  );
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const recordJoin = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          meetingId: meeting.id,
          organizationId: meeting.organizationId,
          userId: userIdentity,
          displayName: userName || userIdentity,
          role,
        }),
      });
      const data = await res.json();
      if (data.record) setAttendanceId(data.record.id);
    } catch {
      /* non-blocking */
    }
  }, [meeting, userIdentity, userName, role]);

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
      /* non-blocking */
    }
  }, [meeting.id, userIdentity]);

  async function connectLiveKit() {
    setError(null);
    try {
      const { token: t, mock } = await fetchLiveKitToken({
        roomName: meeting.livekitRoomName,
        identity: userIdentity,
        name: userName,
        role,
        organizationId: organizationId || meeting.organizationId,
      });
      if (mock && !livekitUrl) {
        setError(
          "LiveKit keys / NEXT_PUBLIC_LIVEKIT_URL not configured. Running in mock mode — UI only."
        );
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

  const isModerator = role === "moderator" || role === "admin" || role === "superadmin";

  return (
    <div className="bg-zinc-900 text-white rounded-3xl overflow-hidden border border-zinc-700">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-zinc-700">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{meeting.name}</h2>
          <p className="text-xs text-zinc-400">
            {meeting.type || "Support meeting"} · {meeting.visibility} · Capacity{" "}
            {meeting.capacity}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProvider("livekit")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition",
              provider === "livekit" ? "bg-teal-600" : "bg-zinc-800 hover:bg-zinc-700"
            )}
          >
            LiveKit
          </button>
          <button
            onClick={() => setProvider("zoom")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition",
              provider === "zoom" ? "bg-blue-600" : "bg-zinc-800 hover:bg-zinc-700"
            )}
          >
            Zoom
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="min-h-[480px] relative">
        {provider === "zoom" && (
          <div className="flex flex-col items-center justify-center h-[480px] gap-4 p-8">
            <p className="text-zinc-300 text-center max-w-md">
              Zoom fallback selected. Participants will leave OurHomegroup UI and join the external Zoom meeting.
            </p>
            <button
              onClick={openZoom}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-2xl font-medium"
            >
              Open in Zoom
            </button>
          </div>
        )}

        {provider === "livekit" && !token && (
          <div className="flex flex-col items-center justify-center h-[480px] gap-4 p-8">
            {meeting.waitingRoomEnabled && (
              <div className="text-5xl mb-2">🚪</div>
            )}
            <h3 className="text-2xl font-semibold">
              {meeting.waitingRoomEnabled ? "Waiting Room" : "Ready to join"}
            </h3>
            <p className="text-zinc-400 text-sm text-center max-w-sm">
              Camera and microphone are optional. Moderators control admission.
            </p>
            {error && <p className="text-amber-400 text-sm max-w-md text-center">{error}</p>}
            <button
              onClick={connectLiveKit}
              className="bg-teal-600 hover:bg-teal-500 px-8 py-3 rounded-2xl font-medium"
            >
              {isModerator ? "Start / Join as Moderator" : "Request to Join"}
            </button>
          </div>
        )}

        {provider === "livekit" && token && livekitUrl && (
          <LiveKitRoom
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            video={true}
            audio={true}
            onDisconnected={() => {
              setToken(null);
              setJoined(false);
              recordLeave();
            }}
            className="h-[480px]"
            data-lk-theme="default"
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}

        {provider === "livekit" && token && !livekitUrl && (
          <div className="flex flex-col items-center justify-center h-[480px] gap-3 p-8 text-center">
            <p className="text-teal-400 font-medium">Mock connected</p>
            <p className="text-sm text-zinc-400 max-w-md">
              Token issued (role: {role}). Set NEXT_PUBLIC_LIVEKIT_URL and API keys to enable real media tracks.
            </p>
            <div className="flex gap-3 mt-4">
              <button className="px-4 py-2 rounded-xl bg-white/10 text-sm">🎤 Mute</button>
              <button className="px-4 py-2 rounded-xl bg-white/10 text-sm">📷 Video</button>
              <button
                onClick={() => {
                  setToken(null);
                  setJoined(false);
                  recordLeave();
                }}
                className="px-4 py-2 rounded-xl bg-red-600/80 text-sm"
              >
                Leave
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="px-6 py-3 border-t border-zinc-800 text-xs text-zinc-500 flex flex-wrap gap-4 justify-between">
        <span>Room: {meeting.livekitRoomName}</span>
        <span>Role: {role}</span>
        {attendanceId && <span>Attendance recorded</span>}
      </div>
    </div>
  );
}
