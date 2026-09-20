import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { questions: { select: { id: true } } },
      },
    },
  });

  if (!test || !test.isActive) {
    return Response.json({ error: "Тест не найден" }, { status: 404 });
  }

  return Response.json({
    id: test.id,
    title: test.title,
    description: test.description,
    sections: test.sections.map((section) => ({
      id: section.id,
      title: section.title,
      order: section.order,
      timeLimitMinutes: section.timeLimitMinutes,
      questionCount: section.questions.length,
    })),
  });
}
