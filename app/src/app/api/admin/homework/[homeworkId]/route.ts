import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ homeworkId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { homeworkId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.groupId !== undefined) data.groupId = String(body.groupId).trim();
  if (body.testId !== undefined) data.testId = body.testId ? String(body.testId).trim() : null;
  if (body.textBody !== undefined) data.textBody = body.textBody ? String(body.textBody).trim() : null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.order !== undefined) data.order = Number(body.order);

  try {
    const homework = await prisma.homework.update({ where: { id: homeworkId }, data });
    return Response.json(homework);
  } catch {
    return Response.json({ error: "Не удалось обновить задание" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ homeworkId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { homeworkId } = await params;
  try {
    await prisma.homework.delete({ where: { id: homeworkId } });
  } catch {
    return Response.json({ error: "Не удалось удалить задание" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
