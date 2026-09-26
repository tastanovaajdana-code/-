import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: { include: { sections: { orderBy: { order: "asc" } } } },
      sectionResults: true,
      group: true,
    },
  });

  if (!attempt) {
    return Response.json({ error: "Попытка не найдена" }, { status: 404 });
  }

  const resultsBySection = new Map(
    attempt.sectionResults.map((r) => [r.sectionId, r])
  );

  const sections = attempt.test.sections.map((section) => {
    const result = resultsBySection.get(section.id);
    return {
      id: section.id,
      title: section.title,
      correctCount: result?.correctCount ?? 0,
      totalQuestions: result?.totalQuestions ?? 0,
      score: result?.score ?? 0,
      finished: Boolean(result?.finishedAt),
    };
  });

  return Response.json({
    studentFio: attempt.studentFio,
    group: attempt.group.name,
    testId: attempt.testId,
    testTitle: attempt.test.title,
    totalScore: attempt.totalScore,
    finished: Boolean(attempt.finishedAt),
    sections,
  });
}
