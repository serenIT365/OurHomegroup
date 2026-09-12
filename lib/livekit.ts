import type { Role } from "./types";

export type MeetingProvider = "livekit" | "zoom" | "hybrid";

export interface TokenRequest {
  roomName: string;
  identity: string;
  name?: string;
  role?: Role;
  organizationId?: string;
}

export async function fetchLiveKitToken(req: TokenRequest): Promise<{
  token: string;
  mock?: boolean;
}> {
  const res = await fetch("/api/livekit-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to obtain LiveKit token");
  }
  return res.json();
}
