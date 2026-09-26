import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/studentAuth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const session = await getStudentSession();

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
    isMe: session ? a.studentEmail === session.email : false,
  }));

  return Response.json({ testTitle: test.title, rows });
}
