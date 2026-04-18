import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.js";
import { syncRoutes } from "./routes/sync.js";
import { linkRoutes } from "./routes/link.js";

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });

const allowedOrigin = process.env.APP_URL ?? "http://localhost:5173";

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin === allowedOrigin || /localhost:\d+$/.test(origin)) return cb(null, true);
    cb(new Error("origin not allowed"), false);
  },
  credentials: false,
});

app.get("/health", async () => ({ ok: true, time: new Date().toISOString() }));

await app.register(authRoutes);
await app.register(syncRoutes);
await app.register(linkRoutes);

const port = Number(process.env.PORT ?? 3000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
