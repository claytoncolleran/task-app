import type { Task } from "@task-app/shared";
import { formatDueBadge, getDueStatus } from "../utils/dates.js";
import { bumpTaskToTomorrow, toggleTaskComplete } from "../sync/mutations.js";

interface Props {
  task: Task;
  onOpen: (task: Task) => void;
}

export function TaskRow({ task, onOpen }: Props) {
  const status = getDueStatus(task.dueDate);

  const borderClass =
    status === "overdue"
      ? "border-l-2 border-overdue bg-red-50/40"
      : "border-l-2 border-transparent";

  const badgeClass =
    status === "overdue"
      ? "text-overdue"
      : status === "today"
        ? "text-today"
        : "text-future";

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 ${borderClass} hover:bg-ink-50 group`}>
      <button
        onClick={() => void toggleTaskComplete(task.id, !task.isCompleted)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-300 hover:border-ink-700"
        aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {task.isCompleted && <span className="h-2.5 w-2.5 rounded-full bg-ink-900" />}
      </button>

      <button
        onClick={() => onOpen(task)}
        className="flex-1 truncate text-left text-[15px] leading-tight"
      >
        <span className={task.isCompleted ? "line-through text-ink-500" : ""}>{task.title}</span>
      </button>

      <button
        onClick={() => void bumpTaskToTomorrow(task.id)}
        className={`shrink-0 text-xs tabular-nums ${badgeClass} opacity-80 hover:opacity-100`}
        title="Bump to tomorrow"
      >
        {formatDueBadge(task.dueDate)}
      </button>

      {task.link && (
        <a
          href={task.link.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-ink-500 hover:text-ink-900"
          title={task.link.title}
          onClick={(e) => e.stopPropagation()}
        >
          <LinkIcon />
        </a>
      )}
    </div>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
