import { prisma } from "@/lib/prisma";
import { getAdminSession, requireFullAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const tests = await prisma.test.findMany({
    orderBy: { createdAt: "desc" },
    include: { sections: { include: { questions: { select: { id: true } } } } },
  });

  return Response.json(
    tests.map((test) => ({
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
        questionCount: s.questions.length,
      })),
    }))
  );
}

export async function POST(request: Request) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;

  if (!title) return Response.json({ error: "Укажите название теста" }, { status: 400 });

  const test = await prisma.test.create({ data: { title, description } });
  return Response.json({ id: test.id });
}
