import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../auth/jwt.js";

const bodySchema = z.object({ url: z.string().url() });

export async function linkRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);

  app.post("/link/title", async (req, reply) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_url" });
    const url = parsed.data.url;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": "TaskApp-LinkFetcher/1.0" },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) return { url, title: url };

      const html = await res.text();
      const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const raw = ogMatch?.[1] ?? titleMatch?.[1] ?? url;
      const title = raw.trim().slice(0, 200);
      return { url, title };
    } catch {
      return { url, title: url };
    }
  });
}
