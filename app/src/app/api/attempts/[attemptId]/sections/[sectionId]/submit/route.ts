import { prisma } from "@/lib/prisma";
import { computeSectionScore, isAnswerCorrect } from "@/lib/scoring";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string; sectionId: string }> }
) {
  const { attemptId, sectionId } = await params;
  const body = await request.json();
  const answersInput: Record<string, string> =
    body && typeof body.answers === "object" && body.answers !== null
      ? body.answers
      : {};

  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    return Response.json({ error: "Попытка не найдена" }, { status: 404 });
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: { questions: true },
  });
  if (!section || section.testId !== attempt.testId) {
    return Response.json({ error: "Раздел не найден" }, { status: 404 });
  }

  const existing = await prisma.attemptSectionResult.findUnique({
    where: { attemptId_sectionId: { attemptId, sectionId } },
  });

  if (existing?.finishedAt) {
    return Response.json({
      correctCount: existing.correctCount,
      totalQuestions: existing.totalQuestions,
      score: existing.score,
    });
  }

  const answersMap = new Map<string, string>();
  for (const question of section.questions) {
    const given = answersInput[question.id];
    if (given !== undefined && given !== null) {
      answersMap.set(question.id, String(given));
    }
  }

  const result = computeSectionScore(section.questions, answersMap, section.maxScore);

  const sectionResult = await prisma.attemptSectionResult.upsert({
    where: { attemptId_sectionId: { attemptId, sectionId } },
    update: {
      finishedAt: new Date(),
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      score: result.score,
    },
    create: {
      attemptId,
      sectionId,
      finishedAt: new Date(),
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      score: result.score,
    },
  });

  await prisma.$transaction(
    section.questions
      .filter((q) => answersMap.has(q.id))
      .map((q) =>
        prisma.answer.upsert({
          where: {
            sectionResultId_questionId: {
              sectionResultId: sectionResult.id,
              questionId: q.id,
            },
          },
          update: {
            givenAnswer: answersMap.get(q.id)!,
            isCorrect: isAnswerCorrect(q, answersMap.get(q.id)),
          },
          create: {
            sectionResultId: sectionResult.id,
            questionId: q.id,
            givenAnswer: answersMap.get(q.id)!,
            isCorrect: isAnswerCorrect(q, answersMap.get(q.id)),
          },
        })
      )
  );

  const allSectionResults = await prisma.attemptSectionResult.findMany({
    where: { attemptId },
  });
  const totalScore = allSectionResults.reduce((sum, r) => sum + r.score, 0);

  const sectionsInTest = await prisma.section.count({ where: { testId: attempt.testId } });
  const finishedSections = allSectionResults.filter((r) => r.finishedAt).length;

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      totalScore: Math.round(totalScore * 100) / 100,
      finishedAt: finishedSections >= sectionsInTest ? new Date() : null,
    },
  });

  return Response.json({
    correctCount: result.correctCount,
    totalQuestions: result.totalQuestions,
    score: result.score,
  });
}
