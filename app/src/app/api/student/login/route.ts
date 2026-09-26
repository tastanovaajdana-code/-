import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { signStudentToken, STUDENT_COOKIE_NAME } from "@/lib/studentAuth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return Response.json({ error: "Введите почту и пароль" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { email } });
  if (!student || !(await verifyPassword(password, student.passwordHash))) {
    return Response.json({ error: "Неверная почта или пароль" }, { status: 401 });
  }

  const token = signStudentToken({ studentId: student.id, email: student.email, fio: student.fio });
  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${STUDENT_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${180 * 24 * 60 * 60}`
  );
  return response;
}
