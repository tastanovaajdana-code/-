import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { testId } = await params;
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const timeLimitMinutes = Number(body.timeLimitMinutes ?? 30);
  const maxScore = body.maxScore !== undefined && body.maxScore !== null && body.maxScore !== ""
    ? Number(body.maxScore)
    : null;

  if (!title) return Response.json({ error: "Укажите название раздела" }, { status: 400 });

  const count = await prisma.section.count({ where: { testId } });

  const section = await prisma.section.create({
    data: {
      testId,
      title,
      order: count,
      timeLimitMinutes: Number.isFinite(timeLimitMinutes) && timeLimitMinutes > 0 ? timeLimitMinutes : 30,
      maxScore,
    },
  });

  return Response.json({ id: section.id });
}
