import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { attemptId } = await params;
  try {
    await prisma.attempt.delete({ where: { id: attemptId } });
  } catch {
    return Response.json({ error: "Не удалось удалить попытку" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
