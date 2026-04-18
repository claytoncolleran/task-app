import Dexie, { type Table } from "dexie";
import type { Task, Group } from "@task-app/shared";

export interface LocalTask extends Task {}
export interface LocalGroup extends Group {}

export interface Meta {
  key: string;
  value: string;
}

class TaskDB extends Dexie {
  tasks!: Table<LocalTask, string>;
  groups!: Table<LocalGroup, string>;
  meta!: Table<Meta, string>;

  constructor() {
    super("task-app");
    this.version(1).stores({
      tasks: "id, userId, groupId, dueDate, isCompleted, updatedAt, deletedAt",
      groups: "id, userId, updatedAt, deletedAt",
      meta: "key",
    });
  }
}

export const db = new TaskDB();

export async function getMeta(key: string): Promise<string | null> {
  const row = await db.meta.get(key);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}
