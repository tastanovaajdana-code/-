import { prisma } from "@/lib/prisma";

async function trackSummary(track: "ort" | "manas", email: string) {
  const subjects = await prisma.subject.findMany({
    where: { track },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: { progress: { where: { studentEmail: email } } },
      },
    },
  });

  const testIds = subjects
    .flatMap((s) => s.lessons)
    .filter((l) => l.practiceType === "test" && l.practiceTestId)
    .map((l) => l.practiceTestId as string);
  const attempts = testIds.length
    ? await prisma.attempt.findMany({ where: { testId: { in: testIds }, studentEmail: email } })
    : [];
  const attemptByTestId = new Map(attempts.map((a) => [a.testId, a]));

  let totalLessons = 0;
  let watchedLessons = 0;
  let nextItem: { subjectId: string; subjectName: string; lessonTitle: string; durationMinutes: number | null; dueDate: Date | null; kind: "video" | "practice" } | null = null;

  for (const subject of subjects) {
    for (const lesson of subject.lessons) {
      totalLessons++;
      const watched = Boolean(lesson.progress[0]?.watchedAt);
      if (watched) watchedLessons++;

      const practiceDone =
        lesson.practiceType === "test"
          ? Boolean(lesson.practiceTestId && attemptByTestId.get(lesson.practiceTestId)?.finishedAt)
          : lesson.practiceType === "text"
            ? Boolean(lesson.progress[0]?.practiceDone)
            : true;

      if (!nextItem && (!watched || !practiceDone)) {
        nextItem = {
          subjectId: subject.id,
          subjectName: subject.name,
          lessonTitle: lesson.title,
          durationMinutes: lesson.durationMinutes,
          dueDate: lesson.dueDate,
          kind: !watched ? "video" : "practice",
        };
      }
    }
  }

  return { totalLessons, watchedLessons, nextItem };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const [ort, manas] = await Promise.all([trackSummary("ort", email), trackSummary("manas", email)]);

  return Response.json({ ort, manas });
}
