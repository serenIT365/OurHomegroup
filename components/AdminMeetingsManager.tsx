"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Meeting, MeetingProvider } from "@/lib/types";
import ChairpersonAssign from "@/components/ChairpersonAssign";

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
    timezone: meeting.timezone,
    startAt: toLocalInput(meeting.startAt),
    capacity: meeting.capacity,
    zoomJoinUrl: meeting.zoomJoinUrl || "",
    recurrence: meeting.recurrence || "none",
    enabled: meeting.enabled !== false,
  });

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
          startAt: form.startAt ? new Date(form.startAt).toISOString() : meeting.startAt,
          capacity: Number(form.capacity) || meeting.capacity,
          zoomJoinUrl: form.zoomJoinUrl.trim() || undefined,
          recurrence: form.recurrence as Meeting["recurrence"],
          enabled: form.enabled,
        });
      }}
    >
      <label className="text-xs space-y-1">
        <span>Name</span>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="text-xs space-y-1">
        <span>Start</span>
        <input
          type="datetime-local"
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          value={form.startAt}
          onChange={(e) => setForm({ ...form, startAt: e.target.value })}
        />
      </label>
      <label className="text-xs space-y-1 sm:col-span-2">
        <span>Description</span>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label className="text-xs space-y-1">
        <span>Type</span>
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        />
      </label>
      <label className="text-xs space-y-1">
        <span>Provider</span>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value as MeetingProvider })}
        >
          <option value="livekit">OHG Platform (LiveKit)</option>
          <option value="zoom">Zoom Meeting</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </label>
      <label className="text-xs space-y-1">
        <span>Visibility</span>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          value={form.visibility}
          onChange={(e) => setForm({ ...form, visibility: e.target.value as Meeting["visibility"] })}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="invite">Invite only</option>
        </select>
      </label>
      <label className="text-xs space-y-1">
        <span>Capacity</span>
        <input
          type="number"
          min={1}
          max={500}
          className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
        />
      </label>
      {form.provider !== "livekit" && (
        <label className="text-xs space-y-1 sm:col-span-2">
          <span>Zoom join URL</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm bg-transparent"
            value={form.zoomJoinUrl}
            onChange={(e) => setForm({ ...form, zoomJoinUrl: e.target.value })}
          />
        </label>
      )}
      <label className="text-xs flex items-center gap-2 sm:col-span-2">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
        />
        Enabled (listed and joinable)
      </label>
      <div className="sm:col-span-2 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs"
        >
          Save
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-lg border text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
}
