import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ universityId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { universityId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.order !== undefined) data.order = Number(body.order);

  try {
    const university = await prisma.university.update({ where: { id: universityId }, data });
    return Response.json(university);
  } catch {
    return Response.json({ error: "Не удалось обновить университет" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ universityId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { universityId } = await params;
  try {
    await prisma.university.delete({ where: { id: universityId } });
  } catch {
    return Response.json({ error: "Не удалось удалить университет" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
