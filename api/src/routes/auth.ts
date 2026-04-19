import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, magicLinks } from "../db/schema.js";
import { signSession } from "../auth/jwt.js";
import { sendMagicCode } from "../auth/mailer.js";

const requestSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/request", async (req, reply) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_email" });
    const email = parsed.data.email.toLowerCase().trim();

    const code = generateCode();
    const token = `${code}-${nanoid(8)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(magicLinks).values({ token, email, expiresAt });

    await sendMagicCode(email, code);

    return { ok: true };
  });

  app.post("/auth/verify", async (req, reply) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request" });
    const email = parsed.data.email.toLowerCase().trim();
    const { code } = parsed.data;

    const candidates = await db
      .select()
      .from(magicLinks)
      .where(and(eq(magicLinks.email, email), isNull(magicLinks.consumedAt), gt(magicLinks.expiresAt, new Date())));

    const row = candidates.find((r) => r.token.startsWith(`${code}-`));
    if (!row) return reply.code(400).send({ error: "invalid_or_expired" });

    await db.update(magicLinks).set({ consumedAt: new Date() }).where(eq(magicLinks.token, row.token));

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
