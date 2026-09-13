"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["member", "moderator", "poweruser", "admin"];

export default function MemberRoleSelect({
  memberId,
  current,
}: {
  memberId: string;
  current: Role;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(current);
  const [saving, setSaving] = useState(false);

  async function onChange(next: Role) {
    setRole(next);
    setSaving(true);
    await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: memberId, role: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={role}
      disabled={saving}
      onChange={(e) => onChange(e.target.value as Role)}
      className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
