import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const url = new URL(request.url);
  const groupId = url.searchParams.get("groupId") || undefined;
  const testId = url.searchParams.get("testId") || undefined;

  const attempts = await prisma.attempt.findMany({
    where: {
      groupId: groupId || undefined,
      testId: testId || undefined,
    },
    orderBy: { totalScore: "desc" },
    include: {
      group: true,
      test: { include: { sections: { orderBy: { order: "asc" } } } },
      sectionResults: true,
    },
  });

  const data = attempts.map((attempt) => {
    const resultsBySection = new Map(
      attempt.sectionResults.map((r) => [r.sectionId, r])
    );
    return {
      id: attempt.id,
      studentFio: attempt.studentFio,
      studentEmail: attempt.studentEmail,
      groupName: attempt.group.name,
      testTitle: attempt.test.title,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      totalScore: attempt.totalScore,
      sections: attempt.test.sections.map((section) => {
        const result = resultsBySection.get(section.id);
        return {
          title: section.title,
          score: result?.score ?? 0,
          correctCount: result?.correctCount ?? 0,
          totalQuestions: result?.totalQuestions ?? 0,
          finished: Boolean(result?.finishedAt),
        };
      }),
    };
  });

  return Response.json(data);
}
