import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SECRET = process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
export const ADMIN_COOKIE_NAME = "ort_admin_session";

export type AdminRole = "admin" | "curator";

export type AdminTokenPayload = {
  adminId: string;
  login: string;
  role: AdminRole;
};

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "12h" });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** Returns the session only if it belongs to a full admin (not a curator). */
export async function requireFullAdmin(): Promise<AdminTokenPayload | null> {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
