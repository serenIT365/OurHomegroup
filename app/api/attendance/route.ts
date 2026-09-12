import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const meetingId = req.nextUrl.searchParams.get("meetingId") || undefined;
  const organizationId = req.nextUrl.searchParams.get("organizationId") || undefined;
  const records = store.listAttendance(meetingId, organizationId);
  return NextResponse.json({ attendance: records });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, ...data } = body;

  if (action === "join") {
    const record = store.recordJoin(data);
    return NextResponse.json({ record }, { status: 201 });
  }
  if (action === "leave") {
    const record = store.recordLeave(data.userId, data.meetingId);
    return NextResponse.json({ record });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
