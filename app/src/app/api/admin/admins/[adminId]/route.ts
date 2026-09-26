import { prisma } from "@/lib/prisma";
import { hashPassword, requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { adminId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body.password === "string" && body.password) {
    if (body.password.length < 6) {
      return Response.json({ error: "Пароль должен быть не короче 6 символов" }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.password);
  }

  if (body.role === "admin" || body.role === "curator") {
    if (adminId === session.adminId && body.role === "curator") {
      return Response.json({ error: "Нельзя понизить самого себя" }, { status: 400 });
    }
    data.role = body.role;
  }

  if (body.displayName !== undefined) data.displayName = body.displayName ? String(body.displayName).trim() : null;
  if (body.contact !== undefined) data.contact = body.contact ? String(body.contact).trim() : null;

  await prisma.adminUser.update({ where: { id: adminId }, data });
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { adminId } = await params;

  if (adminId === session.adminId) {
    return Response.json({ error: "Нельзя удалить свою же учётную запись" }, { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!target) return Response.json({ error: "Не найден" }, { status: 404 });

  if (target.role === "admin") {
    const adminCount = await prisma.adminUser.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return Response.json(
        { error: "Нельзя удалить последнего администратора" },
        { status: 400 }
      );
    }
  }

  try {
    await prisma.adminUser.delete({ where: { id: adminId } });
  } catch {
    return Response.json({ error: "Не удалось удалить" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
