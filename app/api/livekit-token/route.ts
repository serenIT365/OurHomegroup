import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import type { Role } from "@/lib/types";

/**
 * Role → LiveKit video grants mapping
 */
function grantsForRole(role: Role = "member") {
  const base = {
    roomJoin: true,
    canSubscribe: true,
    canPublishData: true,
  };
  switch (role) {
    case "moderator":
    case "admin":
    case "superadmin":
      return {
        ...base,
        canPublish: true,
        roomAdmin: true,
        canUpdateMetadata: true,
      };
    case "member":
      return { ...base, canPublish: true };
    default:
      return { ...base, canPublish: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomName,
      identity,
      name,
      role = "member",
      organizationId,
    } = body as {
      roomName: string;
      identity: string;
      name?: string;
      role?: Role;
      organizationId?: string;
    };

    if (!roomName || !identity) {
      return NextResponse.json(
        { error: "roomName and identity are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      // Safe mock for local UI development
      return NextResponse.json({
        token: `mock.${Buffer.from(
          JSON.stringify({ roomName, identity, role, organizationId })
        ).toString("base64")}`,
        mock: true,
        roomName,
        identity,
        role,
      });
    }

    const secret = new TextEncoder().encode(apiSecret);
    const videoGrants = {
      room: roomName,
      ...grantsForRole(role),
    };

    const token = await new SignJWT({
      video: videoGrants,
      metadata: JSON.stringify({
        organizationId,
        role,
        name: name || identity,
      }),
      name: name || identity,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(apiKey)
      .setSubject(identity)
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    return NextResponse.json({ token, roomName, identity, role });
  } catch (err) {
    console.error("[livekit-token]", err);
    return NextResponse.json({ error: "Unable to generate token" }, { status: 500 });
  }
}
