"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Meeting, MeetingProvider } from "@/lib/types";
import ChairpersonAssign from "@/components/ChairpersonAssign";
import WeekdayPicker from "@/components/WeekdayPicker";
import { ALL_DAYS, encodeWeekdays, parseWeekdays } from "@/lib/weekdays";

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminMeetingsManager({ meetings }: { meetings: Meeting[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...meetings].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      ),
    [meetings]
  );

  async function patch(id: string, body: Partial<Meeting>) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      const label = data.meeting?.name || body.name || "Meeting";
      const msg = `Saved “${label}” — ${new Date().toLocaleString()}`;
      setSaved(msg);
      window.alert(msg);
      setEditing(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-amber-700">{error}</p>}
      {saved && (
        <p className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl">
          {saved}
        </p>
      )}
      {sorted.map((m) => {
        const on = m.enabled !== false;
        return (
          <div
            key={m.id}
            className={
              "rounded-2xl border bg-white dark:bg-zinc-900 px-4 py-3 text-sm " +
              (on
                ? "border-zinc-200 dark:border-zinc-800"
                : "border-zinc-200 dark:border-zinc-800 opacity-70")
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {m.name}
                  {m.status === "pending" && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-600">Pending</span>
                  )}
                  {m.status === "declined" && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-zinc-500">Declined</span>
                  )}
                  {!on && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-zinc-500">
                      Disabled
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {new Date(m.startAt).toLocaleString()} · {m.provider} · {m.visibility}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.status === "pending" && (
                  <>
                    <button type="button" className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs" onClick={() => patch(m.id, { status: "approved", enabled: true })}>
                      Approve
                    </button>
                    <button type="button" className="px-2.5 py-1 rounded-lg border text-xs" onClick={() => patch(m.id, { status: "declined", enabled: false })}>
                      Decline
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={busy === m.id}
                  onClick={() => patch(m.id, { enabled: !on })}
                  className="px-2.5 py-1 rounded-lg border text-xs"
                >
                  {on ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(editing?.id === m.id ? null : m)}
                  className="px-2.5 py-1 rounded-lg border text-xs"
                >
                  Edit
                </button>
                <Link href={`/meetings/${m.id}`} className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs">
                  Open
                </Link>
                <button
                  type="button"
                  disabled={busy === m.id}
                  onClick={() => remove(m.id, m.name)}
                  className="px-2.5 py-1 rounded-lg border border-red-300 text-red-700 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>

            {editing?.id === m.id && (
              <EditForm
                meeting={m}
                busy={busy === m.id}
                onCancel={() => setEditing(null)}
                onSave={(body) => patch(m.id, body)}
              />
            )}
            <div className="pt-2">
              <ChairpersonAssign meeting={m} canEdit={true} />
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && <p className="text-sm text-zinc-500">No meetings yet.</p>}
    </div>
  );
}

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "UTC",
];

function EditForm({
  meeting,
  busy,
  onCancel,
  onSave,
}: {
  meeting: Meeting;
  busy: boolean;
  onCancel: () => void;
  onSave: (body: Partial<Meeting>) => void;
}) {
  const [form, setForm] = useState({
    name: meeting.name,
    description: meeting.description || "",
    type: meeting.type || "",
    provider: meeting.provider,
    visibility: meeting.visibility,
    timezone: meeting.timezone || "America/New_York",
    language: meeting.language || "en",
    startAt: toLocalInput(meeting.startAt),
    endAt: toLocalInput(meeting.endAt),
    capacity: meeting.capacity,
    zoomJoinUrl: meeting.zoomJoinUrl || "",
    password: meeting.password || "",
    recurrence: meeting.recurrence || "none",
    weekdays: parseWeekdays(meeting.recurrenceRule),
    waitingRoomEnabled: meeting.waitingRoomEnabled,
    recordingEnabled: meeting.recordingEnabled,
    enabled: meeting.enabled !== false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="mt-3 grid sm:grid-cols-2 gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          type: form.type.trim() || undefined,
          provider: form.provider as MeetingProvider,
          visibility: form.visibility,
          timezone: form.timezone,
          language: form.language,
          startAt: form.startAt ? new Date(form.startAt).toISOString() : meeting.startAt,
          endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
          capacity: Number(form.capacity) || meeting.capacity,
          zoomJoinUrl: form.zoomJoinUrl.trim() || undefined,
          password: form.password.trim() || undefined,
          recurrence: form.recurrence as Meeting["recurrence"],
          recurrenceRule:
            form.recurrence === "daily" || form.recurrence === "weekly"
              ? encodeWeekdays(form.weekdays)
              : undefined,
          waitingRoomEnabled: form.waitingRoomEnabled,
          recordingEnabled: form.recordingEnabled,
          enabled: form.enabled,
        });
      }}
    >
      <label className="text-xs space-y-1 sm:col-span-2">
        <span>Name</span>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </label>
      <label className="text-xs space-y-1 sm:col-span-2">
        <span>Description</span>
        <textarea rows={2} className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.description} onChange={(e) => set("description", e.target.value)} />
      </label>
      <label className="text-xs space-y-1">
        <span>Type / topic</span>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.type} onChange={(e) => set("type", e.target.value)} />
      </label>
      <label className="text-xs space-y-1">
        <span>Provider</span>
        <select className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.provider} onChange={(e) => set("provider", e.target.value as MeetingProvider)}>
          <option value="livekit">OHG Platform (LiveKit)</option>
          <option value="zoom">Zoom Meeting (Workplace)</option>
          <option value="hybrid">Hybrid — OHG + Zoom</option>
        </select>
      </label>
      <label className="text-xs space-y-1">
        <span>Start</span>
        <input type="datetime-local" className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.startAt} onChange={(e) => set("startAt", e.target.value)} />
      </label>
      <label className="text-xs space-y-1">
        <span>End (optional)</span>
        <input type="datetime-local" className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.endAt} onChange={(e) => set("endAt", e.target.value)} />
      </label>
      <label className="text-xs space-y-1">
        <span>Timezone</span>
        <select className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </label>
      <label className="text-xs space-y-1">
        <span>Language</span>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.language} onChange={(e) => set("language", e.target.value)} />
      </label>
      <label className="text-xs space-y-1">
        <span>Frequency</span>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          value={form.recurrence}
          onChange={(e) => {
            const recurrence = e.target.value as Meeting["recurrence"];
            setForm((prev) => ({
              ...prev,
              recurrence: recurrence || "none",
              weekdays:
                recurrence === "daily" || recurrence === "weekly"
                  ? prev.weekdays.length
                    ? prev.weekdays
                    : [...ALL_DAYS]
                  : prev.weekdays,
            }));
          }}
        >
          <option value="none">One-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>
      <label className="text-xs space-y-1">
        <span>Visibility</span>
        <select className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.visibility} onChange={(e) => set("visibility", e.target.value as Meeting["visibility"])}>
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="invite">Invite only</option>
        </select>
      </label>
      {(form.recurrence === "daily" || form.recurrence === "weekly") && (
        <div className="text-xs space-y-1 sm:col-span-2">
          <span>Days of week</span>
          <p className="text-[11px] text-zinc-500">
            {form.recurrence === "weekly"
              ? "Weekly series — all days start on; turn off days to skip."
              : "Daily series — uncheck days that should not meet."}
          </p>
          <WeekdayPicker days={form.weekdays} onChange={(weekdays) => set("weekdays", weekdays)} />
        </div>
      )}
      <label className="text-xs space-y-1">
        <span>Capacity</span>
        <input type="number" min={1} max={500} className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
      </label>
      <label className="text-xs space-y-1">
        <span>Room password (optional)</span>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.password} onChange={(e) => set("password", e.target.value)} />
      </label>
      <label className="text-xs space-y-1 sm:col-span-2">
        <span>Zoom join URL</span>
        <input className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent" value={form.zoomJoinUrl} onChange={(e) => set("zoomJoinUrl", e.target.value)} placeholder="https://zoom.us/j/…?pwd=…" />
      </label>
      <label className="text-xs flex items-center gap-2">
        <input type="checkbox" checked={form.waitingRoomEnabled} onChange={(e) => set("waitingRoomEnabled", e.target.checked)} />
        Waiting room
      </label>
      <label className="text-xs flex items-center gap-2">
        <input type="checkbox" checked={form.recordingEnabled} onChange={(e) => set("recordingEnabled", e.target.checked)} />
        Recording
      </label>
      <label className="text-xs flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} />
        Enabled (listed and joinable)
      </label>
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={busy} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs">
          Save changes
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
}
