import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.STUDENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
export const STUDENT_COOKIE_NAME = "ort_student_session";

export type StudentTokenPayload = {
  studentId: string;
  email: string;
  fio: string;
};

export function signStudentToken(payload: StudentTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "180d" });
}

export function verifyStudentToken(token: string): StudentTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as StudentTokenPayload;
  } catch {
    return null;
  }
}

export async function getStudentSession(): Promise<StudentTokenPayload | null> {
  const store = await cookies();
  const token = store.get(STUDENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyStudentToken(token);
}
