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

  const sectionResult = await prisma.attemptSectionResult.findUnique({
    where: { attemptId_sectionId: { attemptId, sectionId } },
    include: { answers: true },
  });

  if (!sectionResult?.finishedAt) {
    return Response.json(
      { error: "Разбор ответов доступен только после завершения раздела" },
      { status: 403 }
    );
  }

  const answerByQuestion = new Map(sectionResult.answers.map((a) => [a.questionId, a]));

  return Response.json({
    sectionTitle: section.title,
    correctCount: sectionResult.correctCount,
    totalQuestions: sectionResult.totalQuestions,
    score: sectionResult.score,
    questions: section.questions.map((q) => {
      const answer = answerByQuestion.get(q.id);
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE,
        imageUrl: q.imageUrl,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        givenAnswer: answer?.givenAnswer ?? "",
        isCorrect: answer?.isCorrect ?? false,
      };
    }),
  });
}
