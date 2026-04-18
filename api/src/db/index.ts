import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sslRequired = process.env.NODE_ENV === "production" || /[?&]sslmode=require/.test(connectionString);

export const sql = postgres(connectionString, {
  ssl: sslRequired ? "require" : false,
  max: 10,
});

export const db = drizzle(sql, { schema });
export { schema };
