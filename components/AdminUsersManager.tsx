"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, UserProfile } from "@/lib/types";
import MemberRoleSelect from "@/components/MemberRoleSelect";

export default function AdminUsersManager({ members }: { members: UserProfile[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function patch(id: string, body: Partial<UserProfile> & { id?: string }) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      const msg = `Saved ${data.member?.name || "user"} — ${new Date().toLocaleString()}`;
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

  async function remove(m: UserProfile) {
    if (!confirm(`Delete account “${m.name}”? This cannot be undone.`)) return;
    setBusy(m.id);
    try {
      const res = await fetch(`/api/members?id=${encodeURIComponent(m.id)}`, { method: "DELETE" });
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
      <div className="flex justify-end">
        <button type="button" onClick={() => setAddOpen((v) => !v)} className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white">
          Add user
        </button>
      </div>
      {error && <p className="text-sm text-amber-700">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">{saved}</p>}
      {addOpen && <AddUserForm onDone={() => { setAddOpen(false); router.refresh(); }} />}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-left">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-zinc-100 dark:border-zinc-800 align-top">
                <td className="px-4 py-3 font-medium">{m.nickname || m.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {m.email?.trim() ? m.email : <span className="text-zinc-400">No email on file</span>}
                </td>
                <td className="px-4 py-3">
                  <MemberRoleSelect memberId={m.id} current={m.role} />
                </td>
                <td className="px-4 py-3 text-xs">
                  {m.enabled === false ? "Disabled" : "Active"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className="text-xs px-2 py-1 rounded-lg border" onClick={() => setEditing(editing?.id === m.id ? null : m)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy === m.id}
                      className="text-xs px-2 py-1 rounded-lg border"
                      onClick={() => patch(m.id, { enabled: m.enabled === false })}
                    >
                      {m.enabled === false ? "Enable" : "Disable"}
                    </button>
                    <button type="button" className="text-xs px-2 py-1 rounded-lg border border-red-300 text-red-700" onClick={() => remove(m)}>
                      Delete
                    </button>
                  </div>
                  {editing?.id === m.id && (
                    <UserEditForm
                      member={m}
                      busy={busy === m.id}
                      onCancel={() => setEditing(null)}
                      onSave={(body) => patch(m.id, body)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserEditForm({
  member,
  busy,
  onCancel,
  onSave,
}: {
  member: UserProfile;
  busy: boolean;
  onCancel: () => void;
  onSave: (body: Partial<UserProfile>) => void;
}) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email || "");
  const [nickname, setNickname] = useState(member.nickname || "");
  const [role, setRole] = useState<Role>(member.role);
  return (
    <form
      className="mt-2 grid sm:grid-cols-2 gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name: name.trim(), email: email.trim(), nickname: nickname.trim() || undefined, role });
      }}
    >
      <input className="rounded-lg border px-2 py-1 text-xs bg-transparent" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <input className="rounded-lg border px-2 py-1 text-xs bg-transparent" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input className="rounded-lg border px-2 py-1 text-xs bg-transparent" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Display name" />
      <select className="rounded-lg border px-2 py-1 text-xs bg-transparent" value={role} onChange={(e) => setRole(e.target.value as Role)}>
        {["visitor", "member", "moderator", "poweruser", "admin", "superadmin"].map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={busy} className="text-xs px-2 py-1 rounded-lg bg-teal-600 text-white">Save</button>
        <button type="button" onClick={onCancel} className="text-xs px-2 py-1 rounded-lg border">Cancel</button>
      </div>
    </form>
  );
}

function AddUserForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="rounded-xl border p-3 grid sm:grid-cols-3 gap-2 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, role, organizationId: "org_demo" }),
        });
        const data = await res.json();
        if (!res.ok) setErr(data.error || "Could not add user");
        else onDone();
      }}
    >
      <input required className="rounded-lg border px-2 py-1 bg-transparent" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input required type="email" className="rounded-lg border px-2 py-1 bg-transparent" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <select className="rounded-lg border px-2 py-1 bg-transparent" value={role} onChange={(e) => setRole(e.target.value as Role)}>
        {["member", "moderator", "poweruser", "admin"].map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {err && <p className="sm:col-span-3 text-xs text-amber-700">{err}</p>}
      <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white">Create account</button>
    </form>
  );
}
