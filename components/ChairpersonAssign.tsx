"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Meeting, MeetingOccurrence, UserProfile } from "@/lib/types";
import { canBeChair } from "@/lib/roles";

export default function ChairpersonAssign({
  meeting,
  canEdit,
}: {
  meeting: Meeting;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [occurrences, setOccurrences] = useState<MeetingOccurrence[]>([]);
  const [defaultChair, setDefaultChair] = useState(meeting.chairId || meeting.hostId || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/members?organizationId=${meeting.organizationId}`)
      .then((r) => r.json())
      .then((d) => setMembers((d.members || []).filter((m: UserProfile) => canBeChair(m.role))));
    fetch(`/api/meetings/occurrences?meetingId=${meeting.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOccurrences(d.occurrences || []);
        if (d.defaultChairId) setDefaultChair(d.defaultChairId);
      });
  }, [meeting.id, meeting.organizationId]);

  async function saveDefault(chairId: string) {
    setSaving(true);
    await fetch("/api/meetings/occurrences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: meeting.id, chairId: chairId || null }),
    });
    setDefaultChair(chairId);
    setSaving(false);
    router.refresh();
  }

  async function saveOccurrence(occurrenceId: string, chairId: string) {
    setSaving(true);
    await fetch("/api/meetings/occurrences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occurrenceId, chairId: chairId || null }),
    });
    setOccurrences((prev) =>
      prev.map((o) => (o.id === occurrenceId ? { ...o, chairId: chairId || undefined } : o))
    );
    setSaving(false);
  }

  const eligible = members;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
      <div>
        <h3 className="font-semibold">Chairperson assignment</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Chair view is per meeting (and per occurrence). Eligible: Moderator, Admin, Power User.
        </p>
      </div>

      <label className="block text-sm space-y-1">
        <span>Default chairperson (all new occurrences)</span>
        <select
          disabled={!canEdit || saving}
          value={defaultChair}
          onChange={(e) => saveDefault(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm bg-transparent"
        >
          <option value="">Unassigned</option>
          {eligible.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nickname || m.name} ({m.role})
            </option>
          ))}
        </select>
      </label>

      <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium list-none flex items-center justify-between">
          <span>Upcoming occurrences ({occurrences.length})</span>
          <span className="text-xs text-zinc-500 font-normal">Expand</span>
        </summary>
        <div className="space-y-2 mt-3">
          {occurrences.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {new Date(o.startAt).toLocaleString()}
              </span>
              <select
                disabled={!canEdit || saving}
                value={o.chairId || defaultChair || ""}
                onChange={(e) => saveOccurrence(o.id, e.target.value)}
                className="rounded-lg border px-2 py-1 text-xs bg-transparent"
              >
                <option value="">Use default</option>
                {eligible.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nickname || m.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {occurrences.length === 0 && (
            <p className="text-xs text-zinc-500">No occurrences generated yet.</p>
          )}
        </div>
      </details>
    </div>
  );
}
