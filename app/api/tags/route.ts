import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await store.listTags("org_demo");
  return NextResponse.json({ tags });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const tag = await store.createTag("org_demo", name);
  return NextResponse.json({ tag });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  await store.deleteTag("org_demo", name);
  return NextResponse.json({ ok: true });
}
