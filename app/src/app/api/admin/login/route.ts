import { prisma } from "@/lib/prisma";
import { signAdminToken, verifyPassword, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const login = String(body.login ?? "").trim();
  const password = String(body.password ?? "");

  if (!login || !password) {
    return Response.json({ error: "Введите логин и пароль" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { login } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return Response.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const token = signAdminToken({
    adminId: admin.id,
    login: admin.login,
    role: admin.role === "curator" ? "curator" : "admin",
  });

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 60 * 60}`
  );
  return response;
}
