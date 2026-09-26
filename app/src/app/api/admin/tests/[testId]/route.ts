import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { testId } = await params;
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!test) return Response.json({ error: "Тест не найден" }, { status: 404 });

  return Response.json({
    id: test.id,
    title: test.title,
    description: test.description,
    isActive: test.isActive,
    sections: test.sections.map((s) => ({
      id: s.id,
      title: s.title,
      order: s.order,
      timeLimitMinutes: s.timeLimitMinutes,
      maxScore: s.maxScore,
      questions: s.questions,
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { testId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  await prisma.test.update({ where: { id: testId }, data });
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { testId } = await params;
  try {
    await prisma.test.delete({ where: { id: testId } });
  } catch {
    return Response.json({ error: "Не удалось удалить тест" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
