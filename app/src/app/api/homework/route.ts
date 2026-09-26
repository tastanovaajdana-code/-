import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const lessons = await prisma.lesson.findMany({
    where: { isActive: true, practiceType: { not: "none" } },
    orderBy: [{ dueDate: "asc" }, { order: "asc" }],
    include: {
      subject: true,
      practiceTest: true,
      progress: { where: { studentEmail: email } },
    },
  });

  const testIds = lessons.filter((l) => l.practiceType === "test" && l.practiceTestId).map((l) => l.practiceTestId as string);
  const attempts = testIds.length
    ? await prisma.attempt.findMany({ where: { testId: { in: testIds }, studentEmail: email } })
    : [];
  const attemptByTestId = new Map(attempts.map((a) => [a.testId, a]));

  return Response.json(
    lessons.map((l) => {
      let status: "not_started" | "in_progress" | "done" = "not_started";
      let attemptId: string | null = null;

      if (l.practiceType === "test") {
        const attempt = l.practiceTestId ? attemptByTestId.get(l.practiceTestId) : undefined;
        if (attempt) {
          attemptId = attempt.id;
          status = attempt.finishedAt ? "done" : "in_progress";
        }
      } else {
        status = l.progress[0]?.practiceDone ? "done" : "not_started";
      }

      return {
        lessonId: l.id,
        title: l.title,
        track: l.subject.track,
        subjectName: l.subject.name,
        practiceType: l.practiceType,
        practiceTestId: l.practiceTestId,
        dueDate: l.dueDate,
        status,
        attemptId,
      };
    })
  );
}
