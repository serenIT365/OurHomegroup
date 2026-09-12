import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organizationId") || undefined;
  const members = store.listMembers(orgId);
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const member = store.createMember(body);
    return NextResponse.json({ member }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create member" }, { status: 400 });
  }
}
