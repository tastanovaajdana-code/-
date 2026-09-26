import { prisma } from "@/lib/prisma";

export async function computeStudentStats(email: string) {
  const attempts = await prisma.attempt.findMany({
    where: { studentEmail: email, finishedAt: { not: null } },
    orderBy: { finishedAt: "asc" },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: { questions: { select: { points: true } } },
          },
        },
      },
      sectionResults: true,
    },
  });

  const resultsBySectionByAttempt = attempts.map((attempt) => {
    const resultMap = new Map(attempt.sectionResults.map((r) => [r.sectionId, r]));
    const sectionMaxTotal = attempt.test.sections.reduce((sum, s) => {
      const max = s.maxScore ?? s.questions.reduce((qs, q) => qs + q.points, 0);
      return sum + max;
    }, 0);

    return {
      attemptId: attempt.id,
      testTitle: attempt.test.title,
      finishedAt: attempt.finishedAt,
      totalScore: attempt.totalScore,
      maxScore: Math.round(sectionMaxTotal * 100) / 100,
      percent: sectionMaxTotal > 0 ? Math.round((attempt.totalScore / sectionMaxTotal) * 1000) / 10 : 0,
      sections: attempt.test.sections.map((section) => {
        const result = resultMap.get(section.id);
        const max = section.maxScore ?? section.questions.reduce((qs, q) => qs + q.points, 0);
        return {
          title: section.title,
          score: result?.score ?? 0,
          maxScore: Math.round(max * 100) / 100,
          percent: max > 0 ? Math.round(((result?.score ?? 0) / max) * 1000) / 10 : 0,
        };
      }),
    };
  });

  const sectionAverages = new Map<string, { sum: number; count: number }>();
  for (const a of resultsBySectionByAttempt) {
    for (const s of a.sections) {
      const entry = sectionAverages.get(s.title) ?? { sum: 0, count: 0 };
      entry.sum += s.percent;
      entry.count += 1;
      sectionAverages.set(s.title, entry);
    }
  }

  return {
    attempts: resultsBySectionByAttempt,
    sectionAverages: Array.from(sectionAverages.entries()).map(([title, { sum, count }]) => ({
      title,
      averagePercent: Math.round((sum / count) * 10) / 10,
    })),
  };
}
