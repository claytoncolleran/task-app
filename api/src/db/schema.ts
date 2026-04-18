import { pgTable, text, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdDate: timestamp("created_date", { withTimezone: true }).defaultNow().notNull(),
});

export const magicLinks = pgTable("magic_links", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
});

export const groups = pgTable(
  "groups",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdDate: timestamp("created_date", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("groups_user_idx").on(t.userId),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    dueDate: timestamp("due_date", { withTimezone: true }),
    groupId: text("group_id"),
    link: jsonb("link").$type<{ url: string; title: string } | null>(),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedDate: timestamp("completed_date", { withTimezone: true }),
    recurring: jsonb("recurring").$type<{
      enabled: boolean;
      frequency: "daily" | "weekly" | "monthly" | "yearly";
      pattern?: string;
      endDate?: string | null;
    } | null>(),
    createdDate: timestamp("created_date", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("tasks_user_idx").on(t.userId),
    updatedIdx: index("tasks_updated_idx").on(t.userId, t.updatedAt),
  }),
);
