import Link from "next/link";
import { store } from "@/lib/store";

export default async function MeetingsListPage() {
  const meetings = await store.listMeetings("org_demo");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">OurHomegroup</Link>
          <Link href="/dashboard" className="text-sm hover:text-teal-600">Dashboard</Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold mb-8">Meetings</h1>
        <div className="grid gap-4">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              className="block bg-white dark:bg-zinc-900 border rounded-2xl p-6 hover:border-teal-500 transition"
            >
              <div className="font-medium text-lg">{m.name}</div>
              <div className="text-sm text-zinc-500 mt-1">
                {m.type} · {m.visibility} · {m.provider}
              </div>
              <div className="text-sm text-zinc-400 mt-2">
                {new Date(m.startAt).toLocaleString()}
              </div>
            </Link>
          ))}
          {meetings.length === 0 && (
            <p className="text-zinc-500">No meetings yet. Create one in Admin.</p>
          )}
        </div>
      </main>
    </div>
  );
}
