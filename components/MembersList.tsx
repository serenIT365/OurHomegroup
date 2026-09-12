"use client";

import type { UserProfile, Role } from "@/lib/types";
import MemberRoleSelect from "@/components/MemberRoleSelect";

const roleStyles: Record<Role, string> = {
  visitor: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  member: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  moderator: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  admin: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  superadmin: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

function displayName(m: UserProfile) {
  if (m.privacy.anonymousDisplay) return m.nickname || "Anonymous";
  if (m.privacy.hideLastName) {
    const first = m.name.split(" ")[0];
    return m.nickname || first;
  }
  return m.nickname || m.name;
}

export default function MembersList({ members }: { members: UserProfile[] }) {
  if (members.length === 0) {
    return (
      <div className="text-sm text-zinc-500 py-8 text-center border border-dashed rounded-2xl">
        No members yet for this organization.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Member</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Pronouns</th>
            <th className="px-4 py-3 font-medium">Privacy</th>
            <th className="px-4 py-3 font-medium">Manage</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-600/20 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-medium">
                    {displayName(m).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{displayName(m)}</div>
                    {m.recoveryAnniversary && (
                      <div className="text-xs text-zinc-400">
                        Anniversary {m.recoveryAnniversary}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleStyles[m.role]}`}
                >
                  {m.role}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {m.privacy.hideEmail ? "••••@••••" : m.email}
              </td>
              <td className="px-4 py-3 text-zinc-500">{m.pronouns || "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {m.privacy.anonymousDisplay && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                      anon
                    </span>
                  )}
                  {m.privacy.hideAttendance && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                      hide att.
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <MemberRoleSelect memberId={m.id} current={m.role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
