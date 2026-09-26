import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ programId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { programId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.order !== undefined) data.order = Number(body.order);

  try {
    const program = await prisma.program.update({ where: { id: programId }, data });
    return Response.json(program);
  } catch {
    return Response.json({ error: "Не удалось обновить направление" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ programId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { programId } = await params;
  try {
    await prisma.program.delete({ where: { id: programId } });
  } catch {
    return Response.json({ error: "Не удалось удалить направление" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
