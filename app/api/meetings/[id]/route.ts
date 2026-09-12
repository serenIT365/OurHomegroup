import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { meetingToICS } from "@/lib/ics";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meeting = store.getMeeting(id);
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format");
  if (format === "ics") {
    const org = store.getOrg(meeting.organizationId);
    const ics = meetingToICS(meeting, org?.name);
    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${meeting.id}.ics"`,
      },
    });
  }

  return NextResponse.json({ meeting });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const updated = store.updateMeeting(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ meeting: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = store.deleteMeeting(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
