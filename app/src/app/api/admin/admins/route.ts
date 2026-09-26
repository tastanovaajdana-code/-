import { prisma } from "@/lib/prisma";
import { hashPassword, requireFullAdmin } from "@/lib/auth";

export async function GET() {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, login: true, role: true, createdAt: true },
  });

  return Response.json(admins);
}

export async function POST(request: Request) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const login = String(body.login ?? "").trim();
  const password = String(body.password ?? "");
  const role = body.role === "curator" ? "curator" : "admin";

  if (!login || !password) {
    return Response.json({ error: "Укажите логин и пароль" }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "Пароль должен быть не короче 6 символов" }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { login } });
  if (existing) {
    return Response.json({ error: "Такой логин уже занят" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.create({
    data: { login, passwordHash, role },
    select: { id: true, login: true, role: true, createdAt: true },
  });

  return Response.json(admin);
}
