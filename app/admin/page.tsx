import { store } from "@/lib/store";
import Link from "next/link";
import CreateMeetingForm from "@/components/CreateMeetingForm";
import MembersList from "@/components/MembersList";

export default async function AdminPage() {
  const orgs = await store.listOrgs();
  const meetings = await store.listMeetings("org_demo");
  const members = await store.listMembers("org_demo");
  const attendance = await store.listAttendance(undefined, "org_demo");

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
            <Link href="/dashboard" className="hover:text-teal-600">
              Dashboard
            </Link>
            <Link href="/meetings" className="hover:text-teal-600">
              Meetings
            </Link>
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

        {/* Create meeting */}
        <section id="create-meeting">
          <CreateMeetingForm organizationId="org_demo" />
        </section>

        {/* Members */}
        <section id="members">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Members</h2>
              <p className="text-sm text-zinc-500">
                {members.length} members in this organization · privacy settings
                respected
              </p>
            </div>
          </div>
          <MembersList members={members} />
        </section>

        {/* Meetings list */}
        <section>
          <h2 className="text-xl font-semibold tracking-tight mb-4">
            Meetings ({meetings.length})
          </h2>
          <div className="space-y-2">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm"
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-zinc-500 text-xs mt-0.5">
                    {new Date(m.startAt).toLocaleString()} · {m.provider} ·{" "}
                    {m.visibility}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/meetings/${m.id}?format=ics`}
                    className="px-3 py-1.5 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    ICS
                  </a>
                  <Link
                    href={`/meetings/${m.id}`}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
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
