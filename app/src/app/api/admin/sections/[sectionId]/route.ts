import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { sectionId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (body.timeLimitMinutes !== undefined) data.timeLimitMinutes = Number(body.timeLimitMinutes);
  if (body.maxScore !== undefined) {
    data.maxScore = body.maxScore === null || body.maxScore === "" ? null : Number(body.maxScore);
  }
  if (body.order !== undefined) data.order = Number(body.order);

  await prisma.section.update({ where: { id: sectionId }, data });
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { sectionId } = await params;
  await prisma.section.delete({ where: { id: sectionId } }).catch(() => null);
  return Response.json({ ok: true });
}
