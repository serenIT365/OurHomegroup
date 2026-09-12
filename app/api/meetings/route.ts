import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { Meeting } from "@/lib/types";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId") || undefined;
  const meetings = store.listMeetings(orgId);
  return NextResponse.json({ meetings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // In production: validate Clerk session + role (admin/moderator)
    const meeting = store.createMeeting(body as Omit<Meeting, "id" | "createdAt" | "updatedAt" | "livekitRoomName">);
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create meeting" }, { status: 400 });
  }
}
