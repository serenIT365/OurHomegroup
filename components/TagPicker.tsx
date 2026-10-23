"use client";

import { useEffect, useState } from "react";

export default function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setTags((d.tags || []).map((t: { name: string }) => t.name)))
      .catch(() => setTags([]));
  }, []);

  function toggle(name: string) {
    onChange(value.includes(name) ? value.filter((t) => t !== name) : [...value, name]);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || "Could not add tag");
      return;
    }
    if (!tags.includes(name)) setTags((t) => [...t, name].sort());
    if (!value.includes(name)) onChange([...value, name]);
    setDraft("");
    setMsg("");
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">Tags</span>
      <div className="flex flex-wrap gap-2">
        {tags.map((name) => {
          const on = value.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`rounded-full px-3 py-1 text-xs border ${
                on
                  ? "bg-teal-600 border-teal-600 text-white"
                  : "border-zinc-600 text-zinc-300 hover:border-teal-500"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
      <form onSubmit={add} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a tag"
          className="flex-1 rounded-xl border border-zinc-700 bg-transparent px-3 py-1.5 text-xs"
        />
        <button type="submit" className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs">
          Add
        </button>
      </form>
      {msg && <p className="text-xs text-rose-400">{msg}</p>}
    </div>
  );
}
