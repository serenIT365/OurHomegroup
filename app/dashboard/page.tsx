import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { store } from "@/lib/store";

export default async function DashboardPage() {
  const user = await currentUser();
  const meetings = store.listMeetings("org_demo");
  const attendance = store.listAttendance(undefined, "org_demo");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
              OH
            </div>
            <span className="font-semibold">OurHomegroup</span>
          </Link>
          <nav className="flex gap-6 text-sm items-center">
            <Link href="/meetings" className="hover:text-teal-600">
              Meetings
            </Link>
            <Link href="/admin" className="hover:text-teal-600">
              Admin
            </Link>
            {user ? (
              <span className="text-zinc-500">{user.firstName || user.emailAddresses[0]?.emailAddress}</span>
            ) : (
              <Link href="/sign-in" className="text-teal-600">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-zinc-500 mb-10">Your recovery meetings and progress.</p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border p-6">
            <div className="text-sm text-teal-600 font-medium">Upcoming</div>
            <div className="text-3xl font-semibold mt-1">{meetings.length}</div>
            <div className="text-sm text-zinc-500">Scheduled meetings</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border p-6">
            <div className="text-sm text-teal-600 font-medium">Attendance</div>
            <div className="text-3xl font-semibold mt-1">{attendance.length}</div>
            <div className="text-sm text-zinc-500">Recorded joins (demo org)</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border p-6">
            <div className="text-sm text-teal-600 font-medium">Organization</div>
            <div className="text-xl font-semibold mt-1">Demo Recovery Collective</div>
            <div className="text-sm text-zinc-500">Multi-tenant scaffold active</div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Today & Upcoming</h2>
        <div className="space-y-4">
          {meetings.map((m) => (
            <div
              key={m.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-zinc-500">
                  {new Date(m.startAt).toLocaleString()} · {m.provider}
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href={`/api/meetings/${m.id}?format=ics`}
                  className="text-sm px-4 py-2 rounded-xl border hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Add to Calendar
                </a>
                <Link
                  href={`/meetings/${m.id}`}
                  className="text-sm px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700"
                >
                  Join
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
