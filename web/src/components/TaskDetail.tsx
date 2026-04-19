import { useEffect, useRef, useState } from "react";
import type { Task, RecurringConfig, TaskLink } from "@task-app/shared";
import { deleteTask, updateTask } from "../sync/mutations.js";
import { toDateInputValue, fromDateInputValue } from "../utils/dates.js";
import { api } from "../api/client.js";
import { GroupSelect } from "./GroupSelect.js";
import { RecurringEditor } from "./RecurringEditor.js";
import { describeRecurring } from "../utils/recurring.js";

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [recurring, setRecurring] = useState<RecurringConfig | null>(null);
  const [link, setLink] = useState<TaskLink | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const loadedTaskId = useRef<string | null>(null);
  const initialLinkUrl = useRef<string>("");

  useEffect(() => {
    if (!task) return;
    loadedTaskId.current = task.id;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(toDateInputValue(task.dueDate));
    setGroupId(task.groupId);
    setLinkUrl(task.link?.url ?? "");
    setLink(task.link);
    setRecurring(task.recurring ?? null);
    initialLinkUrl.current = task.link?.url ?? "";
    setSavedAt(null);
  }, [task]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title, task]);

  useEffect(() => {
    if (!task) return;
    if (loadedTaskId.current !== task.id) return;
    const id = setTimeout(() => {
      void updateTask(task.id, {
        title: title.trim() || task.title,
        description,
        dueDate: fromDateInputValue(dueDate),
        groupId,
        link,
        recurring,
      });
      setSavedAt(Date.now());
    }, 350);
    return () => clearTimeout(id);
  }, [title, description, dueDate, groupId, link, recurring, task]);

  useEffect(() => {
    if (!task) return;
    if (loadedTaskId.current !== task.id) return;
    const trimmed = linkUrl.trim();
    if (trimmed === initialLinkUrl.current) return;
    if (!trimmed) {
      setLink(null);
      initialLinkUrl.current = "";
      return;
    }
    const id = setTimeout(async () => {
      try {
        const r = await api.fetchLinkTitle(trimmed);
        setLink({ url: r.url, title: r.title });
      } catch {
        setLink({ url: trimmed, title: trimmed });
      }
      initialLinkUrl.current = trimmed;
    }, 500);
    return () => clearTimeout(id);
  }, [linkUrl, task]);

  if (!task) return null;

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
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-[6vh]" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink-100 p-3">
          <div className="text-xs uppercase tracking-wide text-ink-500">
            Edit task {savedAt && <span className="ml-2 normal-case text-ink-300">Saved</span>}
          </div>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-ink-500 hover:bg-ink-50">
            Done
          </button>
        </div>
        <div className="space-y-4 p-4">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            className="w-full resize-none break-words text-lg leading-tight outline-none"
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
              <GroupSelect value={groupId} onChange={setGroupId} />
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
            {link?.title && link.title !== link.url && (
              <div className="mt-1 truncate text-xs text-ink-500">{link.title}</div>
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

          <RecurringEditor value={recurring} dueDate={dueDate ? fromDateInputValue(dueDate) : null} onChange={setRecurring} />
          {recurring?.enabled && (
            <div className="text-xs text-ink-500">{describeRecurring(recurring)}</div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-ink-100 p-3">
          <button
            onClick={() => void handleDelete()}
            className="rounded px-3 py-1.5 text-sm text-overdue hover:bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="rounded bg-ink-900 px-3 py-1.5 text-sm text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
