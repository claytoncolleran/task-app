import type { Task } from "@task-app/shared";
import { getDueStatus } from "../utils/dates.js";

interface Props {
  tasks: Task[];
}

export function DashboardBubbles({ tasks }: Props) {
  let overdue = 0;
  let today = 0;
  let future = 0;
  for (const t of tasks) {
    const s = getDueStatus(t.dueDate);
    if (s === "overdue") overdue++;
    else if (s === "today") today++;
    else if (s === "future") future++;
  }

  return (
    <div className="flex gap-2 px-3 py-3">
      <Bubble label="Overdue" count={overdue} color="bg-red-100 text-overdue" />
      <Bubble label="Today" count={today} color="bg-green-100 text-today" />
      <Bubble label="Later" count={future} color="bg-ink-100 text-ink-700" />
    </div>
  );
}

function Bubble({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex-1 rounded-lg px-3 py-2 ${color}`}>
      <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{count}</div>
    </div>
  );
}
