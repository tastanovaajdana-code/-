import { prisma } from "@/lib/prisma";
import { computeStudentStats } from "@/lib/studentStats";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const groupName = (url.searchParams.get("group") || "").trim();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const [goal, stats, videos, group] = await Promise.all([
    prisma.studentGoal.findUnique({ where: { email } }),
    computeStudentStats(email),
    prisma.videoLesson.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { watches: { where: { studentEmail: email } } },
    }),
    groupName ? prisma.group.findUnique({ where: { name: groupName } }) : null,
  ]);

  const homework = group
    ? await prisma.homework.findMany({
        where: { groupId: group.id },
        orderBy: { order: "asc" },
        include: { completions: { where: { studentEmail: email } } },
      })
    : [];

  const testIds = homework.filter((h) => h.type === "test" && h.testId).map((h) => h.testId as string);
  const attempts = testIds.length
    ? await prisma.attempt.findMany({ where: { testId: { in: testIds }, studentEmail: email } })
    : [];
  const attemptByTestId = new Map(attempts.map((a) => [a.testId, a]));

  const homeworkWithStatus = homework.map((h) => ({
    id: h.id,
    title: h.title,
    type: h.type,
    completed: h.type === "test" ? Boolean(h.testId && attemptByTestId.get(h.testId)?.finishedAt) : h.completions.length > 0,
  }));

  const videosWithStatus = videos.map((v) => ({ id: v.id, title: v.title, durationMinutes: v.durationMinutes, watched: v.watches.length > 0 }));

  const completedCount = videosWithStatus.filter((v) => v.watched).length + homeworkWithStatus.filter((h) => h.completed).length;
  const totalCount = videosWithStatus.length + homeworkWithStatus.length;

  const nextVideo = videosWithStatus.find((v) => !v.watched) ?? null;
  const nextHomework = homeworkWithStatus.find((h) => !h.completed) ?? null;

  const lastAttempt = stats.attempts[stats.attempts.length - 1] ?? null;
  const weakestSection = lastAttempt
    ? lastAttempt.sections.slice().sort((a, b) => a.percent - b.percent)[0] ?? null
    : null;

  return Response.json({
    goalPercent: goal?.targetPercent ?? null,
    lastPercent: lastAttempt?.percent ?? null,
    weeklyPlan: { completed: completedCount, total: totalCount },
    nextVideo,
    nextHomework,
    weakestSectionTitle: weakestSection?.title ?? null,
    hasAttempts: stats.attempts.length > 0,
  });
}
