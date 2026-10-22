"use client";

import { useState } from "react";

export default function AdminTagsManager({ initial }: { initial: string[] }) {
  const [tags, setTags] = useState(initial);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Could not add tag");
      return;
    }
    setTags((t) => [...t, n].sort());
    setName("");
    setMsg("Tag added");
  }

  async function remove(tag: string) {
    if (!confirm(`Delete tag “${tag}”? Meetings keep the label until reassigned.`)) return;
    const res = await fetch(`/api/tags?name=${encodeURIComponent(tag)}`, { method: "DELETE" });
    if (!res.ok) {
      setMsg("Could not delete tag");
      return;
    }
    setTags((t) => t.filter((x) => x !== tag));
    setMsg("Tag deleted");
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111820] p-4 space-y-3">
      <h3 className="font-semibold">Tags</h3>
      <p className="text-xs text-zinc-500">
        Admins add and delete tags. Members can only assign existing tags to a meeting.
      </p>
      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag"
          className="flex-1 rounded-xl border border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
        <button className="rounded-xl bg-teal-600 px-4 py-2 text-sm">Add</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-xs">
            {t}
            <button type="button" onClick={() => remove(t)} className="text-rose-400">
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-zinc-500">No tags yet.</span>}
      </div>
      {msg && <p className="text-xs text-zinc-400">{msg}</p>}
    </div>
  );
}
