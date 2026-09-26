import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const track = (url.searchParams.get("track") || "").trim();
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (track !== "ort" && track !== "manas") {
    return Response.json({ error: "Неверный трек" }, { status: 400 });
  }

  const subjects = await prisma.subject.findMany({
    where: { track },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: { isActive: true },
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

  return Response.json(
    subjects.map((s) => {
      const lessonsTotal = s.lessons.length;
      const lessonsWatched = s.lessons.filter((l) => l.progress[0]?.watchedAt).length;
      const practiceLessons = s.lessons.filter((l) => l.practiceType !== "none");
      const practiceDone = practiceLessons.filter((l) => {
        if (l.practiceType === "test") return Boolean(l.practiceTestId && attemptByTestId.get(l.practiceTestId)?.finishedAt);
        return Boolean(l.progress[0]?.practiceDone);
      }).length;

      return {
        id: s.id,
        name: s.name,
        lessonsTotal,
        lessonsWatched,
        practiceRemaining: practiceLessons.length - practiceDone,
      };
    })
  );
}
