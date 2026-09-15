import { currentUser } from "@clerk/nextjs/server";
import { store } from "@/lib/store";
import { upcomingStarts } from "@/lib/occurrences";
import { canAssignChair } from "@/lib/roles";
import MeetingRoom from "@/components/MeetingRoom";
import ChairpersonAssign from "@/components/ChairpersonAssign";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  const nextStart = upcomingStarts(meeting, 1)[0] || meeting.startAt;
  let occurrences = [] as Awaited<ReturnType<typeof store.listOccurrences>>;
  try {
    occurrences = await store.listOccurrences(meeting.id);
    if (!occurrences.some((o) => o.startAt === nextStart)) {
      await store.upsertOccurrence({
        meetingId: meeting.id,
        organizationId: meeting.organizationId,
        startAt: nextStart,
        chairId: meeting.chairId || meeting.hostId || null,
      });
      occurrences = await store.listOccurrences(meeting.id);
    }
  } catch {
    /* table may not exist until SQL is run */
  }

  const thisOcc = occurrences.find((o) => o.startAt === nextStart);
  const chairId = thisOcc?.chairId || meeting.chairId || meeting.hostId;
  const isChairperson = !!user && chairId === user.id;
  const canEditChair = canAssignChair(role);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
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
      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {canEditChair && <ChairpersonAssign meeting={meeting} canEdit={canEditChair} />}
        <MeetingRoom
          meeting={meeting}
          userIdentity={user?.id || "anonymous-guest"}
          userName={user?.fullName || user?.firstName || "Guest"}
          role={role}
          organizationId={meeting.organizationId}
          isChairperson={isChairperson}
        />
      </main>
    </div>
  );
}
