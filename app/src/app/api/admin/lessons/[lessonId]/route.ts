import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { lessonId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl ? String(body.videoUrl).trim() : null;
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes ? Number(body.durationMinutes) : null;
  if (body.practiceType !== undefined) data.practiceType = String(body.practiceType).trim();
  if (body.practiceTestId !== undefined) data.practiceTestId = body.practiceTestId ? String(body.practiceTestId).trim() : null;
  if (body.practiceText !== undefined) data.practiceText = body.practiceText ? String(body.practiceText).trim() : null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.order !== undefined) data.order = Number(body.order);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  try {
    const lesson = await prisma.lesson.update({ where: { id: lessonId }, data });
    return Response.json(lesson);
  } catch {
    return Response.json({ error: "Не удалось обновить урок" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { lessonId } = await params;
  try {
    await prisma.lesson.delete({ where: { id: lessonId } });
  } catch {
    return Response.json({ error: "Не удалось удалить урок" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
