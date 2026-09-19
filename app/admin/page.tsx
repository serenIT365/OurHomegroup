import { store } from "@/lib/store";
import Link from "next/link";
import CreateMeetingForm from "@/components/CreateMeetingForm";
import AdminMeetingsManager from "@/components/AdminMeetingsManager";
import AdminUsersManager from "@/components/AdminUsersManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let orgs = [] as Awaited<ReturnType<typeof store.listOrgs>>;
  let meetings = [] as Awaited<ReturnType<typeof store.listMeetings>>;
  let members = [] as Awaited<ReturnType<typeof store.listMembers>>;
  let attendance = [] as Awaited<ReturnType<typeof store.listAttendance>>;
  try {
    orgs = await store.listOrgs();
    meetings = await store.listMeetings("org_demo");
    members = await store.listMembers("org_demo");
    attendance = await store.listAttendance(undefined, "org_demo");
  } catch (e) {
    console.error("[admin] store error", e);
  }

  const byMeeting = meetings.map((m) => {
    const records = attendance.filter((a) => a.meetingId === m.id);
    const durations = records
      .filter((r) => r.durationSeconds)
      .map((r) => r.durationSeconds!);
    const avg =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
    return { meeting: m, joins: records.length, avgDurationSec: avg };
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            OurHomegroup Admin
          </Link>
          <nav className="flex gap-6 text-sm">
            <a href="#meetings" className="hover:text-teal-600">Meetings</a>
            <a href="#users" className="hover:text-teal-600">Users</a>
            <Link href="/dashboard" className="hover:text-teal-600">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-14">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Organization Admin
          </h1>
          <p className="text-zinc-500 text-sm max-w-2xl">
            Manage meetings, members, and basic attendance for{" "}
            <strong>Demo Recovery Collective</strong>. Multi-tenant isolation is
            scaffolded via <code className="text-xs">organizationId</code>.
          </p>
        </div>

        <nav className="flex gap-2 text-sm">
          <a href="#meetings" className="px-3 py-1.5 rounded-full bg-teal-600 text-white">Meetings</a>
          <a href="#users" className="px-3 py-1.5 rounded-full border">Users</a>
        </nav>

        <section id="meetings" className="scroll-mt-20 space-y-8">
          <h2 className="text-xl font-semibold">Meetings</h2>
          <CreateMeetingForm organizationId="org_demo" />
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Directory ({meetings.length})
              {meetings.filter((m) => m.status === "pending").length > 0 && (
                <span className="ml-2 text-sm font-normal text-amber-600">
                  {meetings.filter((m) => m.status === "pending").length} pending
                </span>
              )}
            </h3>
          <p className="text-xs text-zinc-500 mb-3">
            Edit details, disable/enable listing, or delete. Optional SQL:
            <code className="ml-1">ALTER TABLE meetings ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;</code>
          </p>
          <AdminMeetingsManager meetings={meetings} />
          </div>
        </section>

        <section id="users" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-sm text-zinc-500">
            Admin and Power User can add, edit, disable, or delete accounts. Email is always visible here.
          </p>
          <AdminUsersManager members={members} />
        </section>

        {/* Attendance report */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight mb-4">
            Attendance snapshot
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800 text-left">
                <tr>
                  <th className="px-4 py-3">Meeting</th>
                  <th className="px-4 py-3">Joins</th>
                  <th className="px-4 py-3">Avg duration</th>
                </tr>
              </thead>
              <tbody>
                {byMeeting.map(({ meeting, joins, avgDurationSec }) => (
                  <tr
                    key={meeting.id}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">{meeting.name}</td>
                    <td className="px-4 py-3">{joins}</td>
                    <td className="px-4 py-3">
                      {avgDurationSec
                        ? `${Math.round(avgDurationSec / 60)} min`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Orgs */}
        <section>
          <h2 className="text-lg font-medium mb-3">Organizations</h2>
          <div className="grid gap-3">
            {orgs.map((o) => (
              <div
                key={o.id}
                className="bg-white dark:bg-zinc-900 border rounded-2xl p-5 flex justify-between"
              >
                <div>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-sm text-zinc-500">/{o.slug}</div>
                </div>
                <div className="text-xs text-zinc-400">{o.id}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
