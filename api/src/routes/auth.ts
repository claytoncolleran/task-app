import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, magicLinks } from "../db/schema.js";
import { signSession } from "../auth/jwt.js";
import { sendMagicLink } from "../auth/mailer.js";

const requestSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({ token: z.string().min(10) });

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/request", async (req, reply) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_email" });
    const email = parsed.data.email.toLowerCase().trim();

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(magicLinks).values({ token, email, expiresAt });

    const appUrl = process.env.APP_URL ?? "http://localhost:5173";
    const link = `${appUrl}/auth/verify?token=${encodeURIComponent(token)}`;
    await sendMagicLink(email, link);

    return { ok: true };
  });

  app.post("/auth/verify", async (req, reply) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_token" });
    const { token } = parsed.data;

    const [row] = await db
      .select()
      .from(magicLinks)
      .where(and(eq(magicLinks.token, token), isNull(magicLinks.consumedAt), gt(magicLinks.expiresAt, new Date())))
      .limit(1);

    if (!row) return reply.code(400).send({ error: "invalid_or_expired" });

    await db.update(magicLinks).set({ consumedAt: new Date() }).where(eq(magicLinks.token, token));

    const [existing] = await db.select().from(users).where(eq(users.email, row.email)).limit(1);
    let user = existing;
    if (!user) {
      const id = nanoid();
      const [created] = await db.insert(users).values({ id, email: row.email }).returning();
      user = created;
    }

    const session = signSession({ id: user.id, email: user.email });
    return {
      token: session,
      user: {
        id: user.id,
        email: user.email,
        createdDate: user.createdDate.toISOString(),
      },
    };
  });
}
