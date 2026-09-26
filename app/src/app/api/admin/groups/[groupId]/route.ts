import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { groupId } = await params;
  try {
    await prisma.group.delete({ where: { id: groupId } });
  } catch {
    return Response.json({ error: "Не удалось удалить группу" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
