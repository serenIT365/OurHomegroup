import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { Meeting } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get("organizationId") || undefined;
    const meetings = await store.listMeetings(orgId);
    return NextResponse.json({ meetings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to list meetings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const meeting = await store.createMeeting(
      body as Omit<Meeting, "id" | "createdAt" | "updatedAt" | "livekitRoomName">
    );
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 400 });
  }
}
