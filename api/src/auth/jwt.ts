import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error("JWT_SECRET is not set");
}

export interface AuthedUser {
  id: string;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthedUser;
  }
}

export function signSession(user: AuthedUser): string {
  return jwt.sign(user, SECRET!, { expiresIn: "30d" });
}

export function verifySession(token: string): AuthedUser | null {
  try {
    const decoded = jwt.verify(token, SECRET!) as AuthedUser & { iat: number; exp: number };
    return { id: decoded.id, email: decoded.email };
  } catch {
    return null;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  const token = header.slice("Bearer ".length);
  const user = verifySession(token);
  if (!user) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  req.user = user;
}
