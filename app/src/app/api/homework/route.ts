import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const groupName = (url.searchParams.get("group") || "").trim();
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!groupName || !email) {
    return Response.json({ error: "Укажите группу и email" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({ where: { name: groupName } });
  if (!group) return Response.json([]);

  const homework = await prisma.homework.findMany({
    where: { groupId: group.id },
    orderBy: { order: "asc" },
    include: {
      test: true,
      completions: { where: { studentEmail: email } },
    },
  });

  const testIds = homework.filter((h) => h.testId).map((h) => h.testId as string);
  const attempts = testIds.length
    ? await prisma.attempt.findMany({
        where: { testId: { in: testIds }, studentEmail: email },
      })
    : [];
  const attemptByTestId = new Map(attempts.map((a) => [a.testId, a]));

  return Response.json(
    homework.map((h) => {
      if (h.type === "test") {
        const attempt = h.testId ? attemptByTestId.get(h.testId) : undefined;
        return {
          id: h.id,
          title: h.title,
          type: h.type,
          testId: h.testId,
          testTitle: h.test?.title ?? null,
          dueDate: h.dueDate,
          completed: Boolean(attempt?.finishedAt),
          attemptId: attempt?.id ?? null,
        };
      }
      return {
        id: h.id,
        title: h.title,
        type: h.type,
        textBody: h.textBody,
        dueDate: h.dueDate,
        completed: h.completions.length > 0,
      };
    })
  );
}
