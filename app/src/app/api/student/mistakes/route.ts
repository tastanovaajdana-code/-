import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const attempts = await prisma.attempt.findMany({
    where: { studentEmail: email, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    include: {
      test: true,
      sectionResults: {
        include: {
          section: true,
          answers: { where: { isCorrect: false } },
        },
      },
    },
  });

  const groups = attempts.flatMap((attempt) =>
    attempt.sectionResults
      .filter((sr) => sr.finishedAt && sr.answers.length > 0)
      .map((sr) => ({
        attemptId: attempt.id,
        sectionId: sr.sectionId,
        testTitle: attempt.test.title,
        sectionTitle: sr.section.title,
        finishedAt: attempt.finishedAt,
        incorrectCount: sr.answers.length,
        totalQuestions: sr.totalQuestions,
      }))
  );

  return Response.json(groups);
}
