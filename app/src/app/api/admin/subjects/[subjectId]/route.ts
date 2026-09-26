import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { subjectId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.order !== undefined) data.order = Number(body.order);

  try {
    const subject = await prisma.subject.update({ where: { id: subjectId }, data });
    return Response.json(subject);
  } catch {
    return Response.json({ error: "Не удалось обновить предмет" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { subjectId } = await params;
  try {
    await prisma.subject.delete({ where: { id: subjectId } });
  } catch {
    return Response.json({ error: "Не удалось удалить предмет" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
