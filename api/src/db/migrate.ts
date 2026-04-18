import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const sslRequired = process.env.NODE_ENV === "production" || /[?&]sslmode=require/.test(url);
  const sql = postgres(url, { ssl: sslRequired ? "require" : false, max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "./drizzle" });
  await sql.end();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
