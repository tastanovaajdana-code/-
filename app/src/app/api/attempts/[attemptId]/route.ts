import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      group: true,
      test: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: { questions: { select: { id: true } } },
          },
        },
      },
      sectionResults: true,
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
    let status: "not_started" | "in_progress" | "done" = "not_started";
    if (result?.finishedAt) status = "done";
    else if (result) status = "in_progress";

    return {
      id: section.id,
      title: section.title,
      order: section.order,
      timeLimitMinutes: section.timeLimitMinutes,
      questionCount: section.questions.length,
      status,
      correctCount: result?.correctCount ?? 0,
      totalQuestions: result?.totalQuestions ?? section.questions.length,
      score: result?.score ?? 0,
    };
  });

  return Response.json({
    id: attempt.id,
    studentFio: attempt.studentFio,
    group: { id: attempt.group.id, name: attempt.group.name },
    test: { id: attempt.test.id, title: attempt.test.title, description: attempt.test.description },
    totalScore: attempt.totalScore,
    finishedAt: attempt.finishedAt,
    sections,
  });
}
