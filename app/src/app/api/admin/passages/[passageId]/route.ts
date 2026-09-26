import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ passageId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { passageId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim() || null;
  if (typeof body.text === "string") data.text = body.text.trim() || null;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;

  await prisma.passage.update({ where: { id: passageId }, data });
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ passageId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { passageId } = await params;
  try {
    await prisma.passage.delete({ where: { id: passageId } });
  } catch {
    return Response.json({ error: "Не удалось удалить текст" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
