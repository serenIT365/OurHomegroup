import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CreateMeetingForm from "@/components/CreateMeetingForm";

export const dynamic = "force-dynamic";

export default async function SubmitMeetingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/meetings" className="text-sm text-zinc-500">
            ← Meetings
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <CreateMeetingForm organizationId="org_demo" pending />
      </main>
    </div>
  );
}
