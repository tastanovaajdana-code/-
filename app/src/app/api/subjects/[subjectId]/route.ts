import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return Response.json({ error: "Предмет не найден" }, { status: 404 });

  const lessons = await prisma.lesson.findMany({
    where: { subjectId, isActive: true },
    orderBy: { order: "asc" },
    include: {
      practiceTest: true,
      progress: { where: { studentEmail: email } },
    },
  });

  const testIds = lessons.filter((l) => l.practiceType === "test" && l.practiceTestId).map((l) => l.practiceTestId as string);
  const attempts = testIds.length
    ? await prisma.attempt.findMany({ where: { testId: { in: testIds }, studentEmail: email } })
    : [];
  const attemptByTestId = new Map(attempts.map((a) => [a.testId, a]));

  return Response.json({
    subject: { id: subject.id, name: subject.name, track: subject.track },
    lessons: lessons.map((l) => {
      const attempt = l.practiceTestId ? attemptByTestId.get(l.practiceTestId) : undefined;
      return {
        id: l.id,
        title: l.title,
        videoUrl: l.videoUrl,
        description: l.description,
        durationMinutes: l.durationMinutes,
        practiceType: l.practiceType,
        practiceTestId: l.practiceTestId,
        practiceTestTitle: l.practiceTest?.title ?? null,
        practiceText: l.practiceText,
        dueDate: l.dueDate,
        watched: Boolean(l.progress[0]?.watchedAt),
        practiceDone: l.practiceType === "test" ? Boolean(attempt?.finishedAt) : Boolean(l.progress[0]?.practiceDone),
        attemptId: attempt?.id ?? null,
      };
    }),
  });
}
