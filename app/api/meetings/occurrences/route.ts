import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { upcomingStarts } from "@/lib/occurrences";
import { canBeChair } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const meetingId = req.nextUrl.searchParams.get("meetingId");
  if (!meetingId) return NextResponse.json({ error: "meetingId required" }, { status: 400 });
  const meeting = await store.getMeeting(meetingId);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await store.listOccurrences(meetingId);
  const needed = upcomingStarts(meeting);
  for (const startAt of needed) {
    if (!existing.some((o) => o.startAt === startAt)) {
      await store.upsertOccurrence({
        meetingId,
        organizationId: meeting.organizationId,
        startAt,
        chairId: meeting.chairId || meeting.hostId || null,
      });
    }
  }
  const occurrences = await store.listOccurrences(meetingId);
  return NextResponse.json({ occurrences, defaultChairId: meeting.chairId || meeting.hostId });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { occurrenceId, meetingId, chairId } = body as {
    occurrenceId?: string;
    meetingId?: string;
    chairId: string | null;
  };

  if (chairId) {
    const member = await store.getMember(chairId);
    if (!member || !canBeChair(member.role)) {
      return NextResponse.json(
        { error: "Chairperson must be a Moderator, Admin, or Power User" },
        { status: 400 }
      );
    }
  }

  if (occurrenceId) {
    const occ = await store.setOccurrenceChair(occurrenceId, chairId);
    return NextResponse.json({ occurrence: occ });
  }
  if (meetingId) {
    const meeting = await store.updateMeeting(meetingId, {
      chairId: chairId || undefined,
      hostId: chairId || undefined,
    });
    return NextResponse.json({ meeting });
  }
  return NextResponse.json({ error: "occurrenceId or meetingId required" }, { status: 400 });
}
