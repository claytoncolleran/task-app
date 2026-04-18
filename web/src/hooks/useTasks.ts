import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/dexie.js";
import type { Task, Group } from "@task-app/shared";

export function useActiveTasks(): Task[] {
  return (
    useLiveQuery(async () => {
      const all = await db.tasks.toArray();
      return all
        .filter((t) => !t.deletedAt && !t.isCompleted)
        .sort((a, b) => sortByDue(a.dueDate, b.dueDate));
    }, []) ?? []
  );
}

export function useCompletedTasks(): Task[] {
  return (
    useLiveQuery(async () => {
      const all = await db.tasks.toArray();
      return all
        .filter((t) => !t.deletedAt && t.isCompleted)
        .sort((a, b) => (a.completedDate ?? "") > (b.completedDate ?? "") ? -1 : 1);
    }, []) ?? []
  );
}

export function useGroups(): Group[] {
  return (
    useLiveQuery(async () => {
      const all = await db.groups.toArray();
      return all.filter((g) => !g.deletedAt).sort((a, b) => a.name.localeCompare(b.name));
    }, []) ?? []
  );
}

function sortByDue(a: string | null, b: string | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}
