"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MeetingProvider } from "@/lib/types";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "UTC",
];

export default function CreateMeetingForm({
  organizationId = "org_demo",
}: {
  organizationId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "",
    provider: "hybrid" as MeetingProvider,
    capacity: 40,
    waitingRoomEnabled: true,
    recordingEnabled: false,
    visibility: "private" as "public" | "private" | "invite",
    timezone: "America/New_York",
    language: "en",
    startAt: "",
    recurrence: "weekly" as "none" | "daily" | "weekly" | "monthly",
    zoomJoinUrl: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!form.name.trim() || !form.startAt) {
      setError("Name and start time are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          type: form.type.trim() || undefined,
          provider: form.provider,
          capacity: Number(form.capacity) || 40,
          waitingRoomEnabled: form.waitingRoomEnabled,
          recordingEnabled: form.recordingEnabled,
          visibility: form.visibility,
          timezone: form.timezone,
          language: form.language,
          startAt: new Date(form.startAt).toISOString(),
          recurrence: form.recurrence,
          zoomJoinUrl: form.zoomJoinUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create meeting");
      }

      const { meeting } = await res.json();
      setSuccess(`Created “${meeting.name}”`);
      setForm((prev) => ({
        ...prev,
        name: "",
        description: "",
        type: "",
        zoomJoinUrl: "",
        startAt: "",
      }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-5"
    >
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Create Meeting</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Schedule a new recovery or support meeting for this organization.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 rounded-xl">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium">Meeting name *</span>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Women's Recovery"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>

        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={2}
            placeholder="Brief description for members"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Type / topic</span>
          <input
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            placeholder="Women's Recovery, Veterans, Open…"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Provider</span>
          <select
            value={form.provider}
            onChange={(e) => update("provider", e.target.value as MeetingProvider)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="hybrid">Hybrid (LiveKit + Zoom option)</option>
            <option value="livekit">LiveKit only</option>
            <option value="zoom">Zoom only</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Start date & time *</span>
          <input
            required
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => update("startAt", e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Timezone</span>
          <select
            value={form.timezone}
            onChange={(e) => update("timezone", e.target.value)}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Recurrence</span>
          <select
            value={form.recurrence}
            onChange={(e) =>
              update("recurrence", e.target.value as typeof form.recurrence)
            }
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="none">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Visibility</span>
          <select
            value={form.visibility}
            onChange={(e) =>
              update("visibility", e.target.value as typeof form.visibility)
            }
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="invite">Invite only</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Capacity</span>
          <input
            type="number"
            min={1}
            max={500}
            value={form.capacity}
            onChange={(e) => update("capacity", Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>

        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium">Zoom join URL (optional fallback)</span>
          <input
            value={form.zoomJoinUrl}
            onChange={(e) => update("zoomJoinUrl", e.target.value)}
            placeholder="https://zoom.us/j/…"
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.waitingRoomEnabled}
            onChange={(e) => update("waitingRoomEnabled", e.target.checked)}
            className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
          />
          Waiting room
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.recordingEnabled}
            onChange={(e) => update("recordingEnabled", e.target.checked)}
            className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
          />
          Recording enabled
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
        >
          {loading ? "Creating…" : "Create meeting"}
        </button>
      </div>
    </form>
  );
}
