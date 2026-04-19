import { useEffect, useRef, useState } from "react";
import type { RecurringConfig } from "@task-app/shared";
import { createTask } from "../sync/mutations.js";
import { fromDateInputValue } from "../utils/dates.js";
import { GroupSelect } from "./GroupSelect.js";
import { RecurringEditor } from "./RecurringEditor.js";

interface Props {
  open: boolean;
  defaultGroupId?: string | null;
  onClose: () => void;
}

export function AddTaskModal({ open, defaultGroupId, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayValue());
  const [groupId, setGroupId] = useState<string | null>(defaultGroupId ?? null);
  const [recurring, setRecurring] = useState<RecurringConfig | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDueDate(todayValue());
      setGroupId(defaultGroupId ?? null);
      setRecurring(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, defaultGroupId]);

  if (!open) return null;

  async function submit() {
    const t = title.trim();
    if (!t) return;
    await createTask({
      title: t,
      dueDate: fromDateInputValue(dueDate),
      groupId,
      recurring,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-[10vh]" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4 p-4">
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

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-ink-500">Due</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded border border-ink-100 px-2 py-1 text-sm"
            />
          </div>

          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">Group</div>
            <GroupSelect value={groupId} onChange={setGroupId} />
          </div>

          <RecurringEditor
            value={recurring}
            dueDate={fromDateInputValue(dueDate)}
            onChange={setRecurring}
          />
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

function todayValue(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
