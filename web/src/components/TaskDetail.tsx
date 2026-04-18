import { useEffect, useState } from "react";
import type { Task, RecurringFrequency } from "@task-app/shared";
import { useGroups } from "../hooks/useTasks.js";
import { deleteTask, updateTask } from "../sync/mutations.js";
import { toDateInputValue, fromDateInputValue } from "../utils/dates.js";
import { api } from "../api/client.js";

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: Props) {
  const groups = useGroups();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>("weekly");
  const [fetchingTitle, setFetchingTitle] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(toDateInputValue(task.dueDate));
    setGroupId(task.groupId);
    setLinkUrl(task.link?.url ?? "");
    setRecurringEnabled(task.recurring?.enabled ?? false);
    setRecurringFreq(task.recurring?.frequency ?? "weekly");
  }, [task]);

  if (!task) return null;

  async function save() {
    if (!task) return;
    let link = task.link;
    const urlTrim = linkUrl.trim();
    if (urlTrim && urlTrim !== task.link?.url) {
      setFetchingTitle(true);
      try {
        const r = await api.fetchLinkTitle(urlTrim);
        link = { url: r.url, title: r.title };
      } catch {
        link = { url: urlTrim, title: urlTrim };
      } finally {
        setFetchingTitle(false);
      }
    } else if (!urlTrim) {
      link = null;
    }
    await updateTask(task.id, {
      title: title.trim() || task.title,
      description,
      dueDate: fromDateInputValue(dueDate),
      groupId,
      link,
      recurring: recurringEnabled ? { enabled: true, frequency: recurringFreq } : null,
    });
    onClose();
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setLinkUrl(text);
    } catch {
      // ignore
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm("Delete this task?")) return;
    await deleteTask(task.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 p-4 pt-[6vh]" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink-100 p-3">
          <div className="text-xs uppercase tracking-wide text-ink-500">Edit task</div>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-ink-500 hover:bg-ink-50">
            Close
          </button>
        </div>
        <div className="space-y-4 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg outline-none"
            placeholder="Task title"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">Due</div>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded border border-ink-100 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">Group</div>
              <select
                value={groupId ?? ""}
                onChange={(e) => setGroupId(e.target.value || null)}
                className="w-full rounded border border-ink-100 px-2 py-1 text-sm"
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">Link</div>
            <div className="flex gap-2">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded border border-ink-100 px-2 py-1 text-sm outline-none"
              />
              <button
                onClick={() => void pasteFromClipboard()}
                className="rounded border border-ink-100 px-2 py-1 text-xs text-ink-700 hover:bg-ink-50"
              >
                Paste
              </button>
            </div>
            {task.link?.title && task.link.title !== task.link.url && (
              <div className="mt-1 truncate text-xs text-ink-500">{task.link.title}</div>
            )}
          </div>

          <div>
            <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">Notes</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded border border-ink-100 p-2 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={recurringEnabled}
                onChange={(e) => setRecurringEnabled(e.target.checked)}
              />
              Recurring
            </label>
            {recurringEnabled && (
              <select
                value={recurringFreq}
                onChange={(e) => setRecurringFreq(e.target.value as RecurringFrequency)}
                className="rounded border border-ink-100 px-2 py-1 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-ink-100 p-3">
          <button
            onClick={() => void handleDelete()}
            className="rounded px-3 py-1.5 text-sm text-overdue hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={() => void save()}
            disabled={fetchingTitle}
            className="rounded bg-ink-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {fetchingTitle ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
