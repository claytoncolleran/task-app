import { useEffect, useRef, useState } from "react";
import { createGroup, createTask } from "../sync/mutations.js";
import { useGroups } from "../hooks/useTasks.js";
import { fromDateInputValue } from "../utils/dates.js";

interface Props {
  open: boolean;
  defaultGroupId?: string | null;
  onClose: () => void;
}

export function AddTaskModal({ open, defaultGroupId, onClose }: Props) {
  const groups = useGroups();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayValue());
  const [groupId, setGroupId] = useState<string | null>(defaultGroupId ?? null);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDueDate(todayValue());
      setGroupId(defaultGroupId ?? null);
      setNewGroupName("");
      setCreatingGroup(false);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, defaultGroupId]);

  if (!open) return null;

  async function submit() {
    const t = title.trim();
    if (!t) return;
    let gid = groupId;
    if (creatingGroup && newGroupName.trim()) {
      const g = await createGroup(newGroupName.trim());
      gid = g.id;
    }
    await createTask({ title: t, dueDate: fromDateInputValue(dueDate), groupId: gid });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[10vh]" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
              if (e.key === "Escape") onClose();
            }}
            placeholder="Task title"
            className="w-full border-b border-ink-100 pb-2 text-lg outline-none placeholder:text-ink-300"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-500">Due</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded border border-ink-100 px-2 py-1 text-sm"
            />
          </div>

          <div className="mt-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">Group</div>
            <div className="flex flex-wrap gap-1.5">
              <GroupPill active={groupId === null && !creatingGroup} onClick={() => { setGroupId(null); setCreatingGroup(false); }}>
                None
              </GroupPill>
              {groups.slice(0, 10).map((g) => (
                <GroupPill
                  key={g.id}
                  active={groupId === g.id && !creatingGroup}
                  onClick={() => { setGroupId(g.id); setCreatingGroup(false); }}
                >
                  {g.name}
                </GroupPill>
              ))}
              {groups.length < 10 && (
                <GroupPill active={creatingGroup} onClick={() => setCreatingGroup(true)}>
                  + New
                </GroupPill>
              )}
            </div>
            {creatingGroup && (
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name"
                className="mt-2 w-full rounded border border-ink-100 px-2 py-1 text-sm outline-none"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-100 p-3">
          <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-ink-500 hover:bg-ink-50">
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={!title.trim()}
            className="rounded bg-ink-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs ${
        active ? "border-ink-900 bg-ink-900 text-white" : "border-ink-100 bg-white text-ink-700 hover:border-ink-300"
      }`}
    >
      {children}
    </button>
  );
}

function todayValue(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
