import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const url = new URL(request.url);
  const myEmail = (url.searchParams.get("email") || "").trim().toLowerCase();

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) return Response.json({ error: "Тест не найден" }, { status: 404 });

  const attempts = await prisma.attempt.findMany({
    where: { testId, finishedAt: { not: null } },
    orderBy: { totalScore: "desc" },
    include: { group: true },
  });

  const rows = attempts.map((a, i) => ({
    rank: i + 1,
    studentFio: a.studentFio,
    groupName: a.group.name,
    totalScore: a.totalScore,
    isMe: myEmail ? a.studentEmail === myEmail : false,
  }));

  return Response.json({ testTitle: test.title, rows });
}
