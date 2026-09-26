import { STUDENT_COOKIE_NAME } from "@/lib/studentAuth";

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${STUDENT_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}
