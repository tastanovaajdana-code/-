import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { groupId } = await params;
  const body = await request.json();
  const curatorId = body.curatorId ? String(body.curatorId).trim() : null;

  try {
    const group = await prisma.group.update({ where: { id: groupId }, data: { curatorId } });
    return Response.json(group);
  } catch {
    return Response.json({ error: "Не удалось обновить группу" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { groupId } = await params;
  try {
    await prisma.group.delete({ where: { id: groupId } });
  } catch {
    return Response.json({ error: "Не удалось удалить группу" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
