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

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setTags((d.tags || []).map((t: { name: string }) => t.name)))
      .catch(() => setTags([]));
  }, []);

  function toggle(name: string) {
    onChange(value.includes(name) ? value.filter((t) => t !== name) : [...value, name]);
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">Tags</span>
      {tags.length === 0 && (
        <p className="text-xs text-zinc-500">No tags yet. An admin can add tags under Admin.</p>
      )}
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
    </div>
  );
}
