import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId") || undefined;
  const members = await store.listMembers(orgId);
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const member = await store.createMember(body);
    return NextResponse.json({ member }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create member" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const member =
      body.role && Object.keys(body).length <= 2
        ? await store.updateMemberRole(body.id, body.role)
        : await store.updateMember(body.id, body);
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ member });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update member" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const ok = await store.deleteMember(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 400 });
  }
}
