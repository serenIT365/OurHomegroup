import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionName = String(body.sessionName || "").slice(0, 200);
    const userIdentity = String(body.userIdentity || "guest").slice(0, 34);
    const role = body.role === 1 || body.role === "1" ? 1 : 0;

    const sdkKey =
      process.env.ZOOM_VIDEO_SDK_KEY ||
      process.env.ZOOM_MEETING_SDK_KEY ||
      process.env.NEXT_PUBLIC_ZOOM_MEETING_SDK_KEY;
    const sdkSecret = process.env.ZOOM_VIDEO_SDK_SECRET || process.env.ZOOM_MEETING_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: "Zoom Video SDK credentials are not configured (ZOOM_VIDEO_SDK_KEY / SECRET)" },
        { status: 501 }
      );
    }
    if (!sessionName) {
      return NextResponse.json({ error: "sessionName required" }, { status: 400 });
    }

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const token = await new SignJWT({
      app_key: sdkKey,
      tpc: sessionName,
      version: 1,
      role_type: role,
      user_identity: userIdentity,
      iat,
      exp,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(new TextEncoder().encode(sdkSecret));

    return NextResponse.json({ token, sessionName, sdkKeyPresent: true });
  } catch (err) {
    console.error("[zoom/video-token]", err);
    return NextResponse.json({ error: "Unable to sign Video SDK JWT" }, { status: 500 });
  }
}
