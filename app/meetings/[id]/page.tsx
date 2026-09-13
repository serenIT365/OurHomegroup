import { currentUser } from "@clerk/nextjs/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
import MeetingRoom from "@/components/MeetingRoom";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Role } from "@/lib/types";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = await store.getMeeting(id);
  if (!meeting) notFound();

  const user = await currentUser();
  const profile = user ? await store.getMember(user.id) : null;
  const role: Role =
    profile?.role || (user?.publicMetadata?.role as Role) || "member";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/meetings" className="text-sm text-zinc-500 hover:text-teal-600">
            ← All meetings
          </Link>
          <a
            href={`/api/meetings/${meeting.id}?format=ics`}
            className="text-sm px-4 py-2 rounded-full border"
          >
            Download ICS
          </a>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <MeetingRoom
          meeting={meeting}
          userIdentity={user?.id || "anonymous-guest"}
          userName={user?.fullName || user?.firstName || "Guest"}
          role={role}
          organizationId={meeting.organizationId}
        />
      </main>
    </div>
  );
}
