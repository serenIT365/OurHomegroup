import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

/**
 * Meeting SDK JWT. Secret stays on the server.
 * https://developers.zoom.us/docs/meeting-sdk/auth/
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const meetingNumber = String(body.meetingNumber || "").replace(/\D/g, "");
    const role = body.role === 1 || body.role === "1" ? 1 : 0;

    const sdkKey = process.env.ZOOM_MEETING_SDK_KEY || process.env.NEXT_PUBLIC_ZOOM_MEETING_SDK_KEY;
    const sdkSecret = process.env.ZOOM_MEETING_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: "Zoom Meeting SDK credentials are not configured" },
        { status: 501 }
      );
    }
    if (!meetingNumber) {
      return NextResponse.json({ error: "meetingNumber required" }, { status: 400 });
    }

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const token = await new SignJWT({
      appKey: sdkKey,
      sdkKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      tokenExp: exp,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(new TextEncoder().encode(sdkSecret));

    return NextResponse.json({
      signature: token,
      sdkKey,
      meetingNumber,
      role,
    });
  } catch (err) {
    console.error("[zoom/signature]", err);
    return NextResponse.json({ error: "Unable to sign Zoom JWT" }, { status: 500 });
  }
}
