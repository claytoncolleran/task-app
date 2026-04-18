import { nanoid } from "nanoid";
import type { Task, Group, RecurringConfig, TaskLink } from "@task-app/shared";
import { db } from "../db/dexie.js";
import { markDirty, runSync } from "./sync.js";

function nowIso(): string {
  return new Date().toISOString();
}

function getUserId(): string {
  return localStorage.getItem("task-app:user-id") ?? "local";
}

export interface NewTaskInput {
  title: string;
  dueDate: string | null;
  groupId: string | null;
}

export async function createTask(input: NewTaskInput): Promise<Task> {
  const now = nowIso();
  const task: Task = {
    id: nanoid(),
    userId: getUserId(),
    title: input.title.trim(),
    description: "",
    dueDate: input.dueDate,
    groupId: input.groupId,
    link: null,
    isCompleted: false,
    completedDate: null,
    recurring: null,
    createdDate: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.tasks.put(task);
  await markDirty();
  void runSync();
  return task;
}

export interface TaskPatch {
  title?: string;
  description?: string;
  dueDate?: string | null;
  groupId?: string | null;
  link?: TaskLink | null;
  recurring?: RecurringConfig | null;
}

export async function updateTask(id: string, patch: TaskPatch): Promise<void> {
  const existing = await db.tasks.get(id);
  if (!existing) return;
  const updated: Task = { ...existing, ...patch, updatedAt: nowIso() };
  await db.tasks.put(updated);
  await markDirty();
  void runSync();
}

export async function toggleTaskComplete(id: string, complete: boolean): Promise<void> {
  const existing = await db.tasks.get(id);
  if (!existing) return;
  const updated: Task = {
    ...existing,
    isCompleted: complete,
    completedDate: complete ? nowIso() : null,
    updatedAt: nowIso(),
  };
  await db.tasks.put(updated);
  await markDirty();
  void runSync();
}

export async function deleteTask(id: string): Promise<void> {
  const existing = await db.tasks.get(id);
  if (!existing) return;
  const now = nowIso();
  await db.tasks.put({ ...existing, deletedAt: now, updatedAt: now });
  await markDirty();
  void runSync();
}

export async function bumpTaskToTomorrow(id: string): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  await updateTask(id, { dueDate: tomorrow.toISOString() });
}

export async function bumpAllOverdueToTomorrow(): Promise<number> {
  const all = await db.tasks.toArray();
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const overdue = all.filter(
    (t) =>
      !t.isCompleted &&
      !t.deletedAt &&
      t.dueDate &&
      new Date(t.dueDate) < today,
  );

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const tomorrowIso = tomorrow.toISOString();
  const nowIsoStr = nowIso();

  await db.transaction("rw", db.tasks, async () => {
    for (const task of overdue) {
      await db.tasks.put({ ...task, dueDate: tomorrowIso, updatedAt: nowIsoStr });
    }
  });
  if (overdue.length > 0) {
    await markDirty();
    void runSync();
  }
  return overdue.length;
}

export async function createGroup(name: string): Promise<Group> {
  const now = nowIso();
  const group: Group = {
    id: nanoid(),
    userId: getUserId(),
    name: name.trim(),
    createdDate: now,
    updatedAt: now,
    deletedAt: null,
  };
  await db.groups.put(group);
  await markDirty();
  void runSync();
  return group;
}

export async function deleteGroup(id: string): Promise<void> {
  const existing = await db.groups.get(id);
  if (!existing) return;
  const now = nowIso();
  await db.groups.put({ ...existing, deletedAt: now, updatedAt: now });
  await markDirty();
  void runSync();
}
