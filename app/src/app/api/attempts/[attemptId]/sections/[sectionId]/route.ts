import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string; sectionId: string }> }
) {
  const { attemptId, sectionId } = await params;

  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    return Response.json({ error: "Попытка не найдена" }, { status: 404 });
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!section || section.testId !== attempt.testId) {
    return Response.json({ error: "Раздел не найден" }, { status: 404 });
  }

  let sectionResult = await prisma.attemptSectionResult.findUnique({
    where: { attemptId_sectionId: { attemptId, sectionId } },
    include: { answers: true },
  });

  if (sectionResult?.finishedAt) {
    return Response.json({
      finished: true,
      sectionTitle: section.title,
      correctCount: sectionResult.correctCount,
      totalQuestions: sectionResult.totalQuestions,
      score: sectionResult.score,
    });
  }

  if (!sectionResult) {
    sectionResult = await prisma.attemptSectionResult.create({
      data: { attemptId, sectionId, totalQuestions: section.questions.length },
      include: { answers: true },
    });
  }

  const existingAnswers: Record<string, string> = {};
  for (const answer of sectionResult.answers) {
    existingAnswers[answer.questionId] = answer.givenAnswer;
  }

  return Response.json({
    finished: false,
    sectionTitle: section.title,
    timeLimitMinutes: section.timeLimitMinutes,
    startedAt: sectionResult.startedAt,
    existingAnswers,
    questions: section.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      imageUrl: q.imageUrl,
    })),
  });
}
