export type DueStatus = "overdue" | "today" | "future" | "none";

export function getDueStatus(dueDate: string | null): DueStatus {
  if (!dueDate) return "none";
  const d = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d < today) return "overdue";
  if (d < tomorrow) return "today";
  return "future";
}

export function formatDueBadge(dueDate: string | null): string {
  if (!dueDate) return "—";
  const d = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((dDay.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function toDateInputValue(dueDate: string | null): string {
  if (!dueDate) return "";
  const d = new Date(dueDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d, 9, 0, 0, 0);
  return date.toISOString();
}
