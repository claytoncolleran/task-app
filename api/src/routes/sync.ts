import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks, groups } from "../db/schema.js";
import { requireAuth } from "../auth/jwt.js";

const recurringSchema = z
  .object({
    enabled: z.boolean(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    pattern: z.string().optional(),
    endDate: z.string().nullable().optional(),
  })
  .nullable();

const linkSchema = z
  .object({
    url: z.string().url(),
    title: z.string(),
  })
  .nullable();

const incomingTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().default(""),
  dueDate: z.string().nullable(),
  groupId: z.string().nullable(),
  link: linkSchema,
  isCompleted: z.boolean(),
  completedDate: z.string().nullable(),
  recurring: recurringSchema,
  createdDate: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

const incomingGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  createdDate: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

const pushSchema = z.object({
  tasks: z.array(incomingTaskSchema).default([]),
  groups: z.array(incomingGroupSchema).default([]),
});

function toDate(v: string | null | undefined): Date | null {
  return v ? new Date(v) : null;
}

export async function syncRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.get("/sync/pull", async (req) => {
    const userId = req.user!.id;
    const since = typeof req.query === "object" && req.query && "since" in req.query
      ? String((req.query as { since?: string }).since ?? "")
      : "";
    const sinceDate = since ? new Date(since) : new Date(0);

    const taskRows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), gt(tasks.updatedAt, sinceDate)));

    const groupRows = await db
      .select()
      .from(groups)
      .where(and(eq(groups.userId, userId), gt(groups.updatedAt, sinceDate)));

    return {
      tasks: taskRows.map(serializeTask),
      groups: groupRows.map(serializeGroup),
      serverTime: new Date().toISOString(),
    };
  });

  app.post("/sync/push", async (req, reply) => {
    const userId = req.user!.id;
    const parsed = pushSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_body", issues: parsed.error.issues });

    for (const g of parsed.data.groups) {
      const [existing] = await db.select().from(groups).where(eq(groups.id, g.id)).limit(1);
      if (existing && existing.userId !== userId) continue;
      const incomingUpdated = new Date(g.updatedAt);
      if (existing && existing.updatedAt >= incomingUpdated) continue;

      if (existing) {
        await db
          .update(groups)
          .set({
            name: g.name,
            updatedAt: incomingUpdated,
            deletedAt: toDate(g.deletedAt),
          })
          .where(eq(groups.id, g.id));
      } else {
        await db.insert(groups).values({
          id: g.id,
          userId,
          name: g.name,
          createdDate: new Date(g.createdDate),
          updatedAt: incomingUpdated,
          deletedAt: toDate(g.deletedAt),
        });
      }
    }

    for (const t of parsed.data.tasks) {
      const [existing] = await db.select().from(tasks).where(eq(tasks.id, t.id)).limit(1);
      if (existing && existing.userId !== userId) continue;
      const incomingUpdated = new Date(t.updatedAt);
      if (existing && existing.updatedAt >= incomingUpdated) continue;

      const values = {
        title: t.title,
        description: t.description,
        dueDate: toDate(t.dueDate),
        groupId: t.groupId,
        link: t.link,
        isCompleted: t.isCompleted,
        completedDate: toDate(t.completedDate),
        recurring: t.recurring,
        updatedAt: incomingUpdated,
        deletedAt: toDate(t.deletedAt),
      };

      if (existing) {
        await db.update(tasks).set(values).where(eq(tasks.id, t.id));
      } else {
        await db.insert(tasks).values({
          id: t.id,
          userId,
          ...values,
          createdDate: new Date(t.createdDate),
        });
      }
    }

    return { ok: true, serverTime: new Date().toISOString() };
  });
}

function serializeTask(row: typeof tasks.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    groupId: row.groupId,
    link: row.link,
    isCompleted: row.isCompleted,
    completedDate: row.completedDate ? row.completedDate.toISOString() : null,
    recurring: row.recurring,
    createdDate: row.createdDate.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

function serializeGroup(row: typeof groups.$inferSelect) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    createdDate: row.createdDate.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}
