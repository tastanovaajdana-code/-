import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { videoId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.url !== undefined) data.url = String(body.url).trim();
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.subject !== undefined) data.subject = body.subject ? String(body.subject).trim() : null;
  if (body.durationMinutes !== undefined) data.durationMinutes = body.durationMinutes ? Number(body.durationMinutes) : null;
  if (body.order !== undefined) data.order = Number(body.order);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  try {
    const video = await prisma.videoLesson.update({ where: { id: videoId }, data });
    return Response.json(video);
  } catch {
    return Response.json({ error: "Не удалось обновить видеоурок" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { videoId } = await params;
  try {
    await prisma.videoLesson.delete({ where: { id: videoId } });
  } catch {
    return Response.json({ error: "Не удалось удалить видеоурок" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
