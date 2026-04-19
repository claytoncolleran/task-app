import { useState } from "react";
import { useGroups } from "../hooks/useTasks.js";
import { createGroup } from "../sync/mutations.js";

interface Props {
  value: string | null;
  onChange: (groupId: string | null) => void;
  className?: string;
}

const NEW_SENTINEL = "__new__";

export function GroupSelect({ value, onChange, className }: Props) {
  const groups = useGroups();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  async function commitNew() {
    const name = newName.trim();
    if (!name) {
      setCreating(false);
      setNewName("");
      return;
    }
    setBusy(true);
    try {
      const g = await createGroup(name);
      onChange(g.id);
    } finally {
      setBusy(false);
      setCreating(false);
      setNewName("");
    }
  }

  return (
    <div className={className}>
      <select
        value={creating ? NEW_SENTINEL : value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === NEW_SENTINEL) {
            setCreating(true);
            return;
          }
          setCreating(false);
          onChange(v || null);
        }}
        className="w-full rounded border border-ink-100 px-2 py-1 text-sm"
      >
        <option value="">No group</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
        <option value={NEW_SENTINEL}>+ New group...</option>
      </select>
      {creating && (
        <div className="mt-2 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commitNew();
              if (e.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            placeholder="Group name"
            className="flex-1 rounded border border-ink-100 px-2 py-1 text-sm outline-none"
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => void commitNew()}
            disabled={busy || !newName.trim()}
            className="rounded bg-ink-900 px-2 py-1 text-xs text-white disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
