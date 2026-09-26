import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { signStudentToken, STUDENT_COOKIE_NAME } from "@/lib/studentAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json();
  const fio = String(body.fio ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const groupId = body.groupId ? String(body.groupId) : null;

  if (!fio || !email || !password || !groupId) {
    return Response.json({ error: "Заполните все поля" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Некорректный формат электронной почты" }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "Пароль должен быть не короче 6 символов" }, { status: 400 });
  }

  const existing = await prisma.student.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "Аккаунт с такой почтой уже существует. Войдите." }, { status: 409 });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return Response.json({ error: "Выберите корректную группу" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const student = await prisma.student.create({
    data: { fio, email, passwordHash, groupId },
  });

  const token = signStudentToken({ studentId: student.id, email: student.email, fio: student.fio });
  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${STUDENT_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${180 * 24 * 60 * 60}`
  );
  return response;
}
