import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/studentAuth";

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session) return Response.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await request.json();
  const testId = String(body.testId ?? "").trim();
  if (!testId) return Response.json({ error: "Не указан тест" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id: session.studentId } });
  if (!student || !student.groupId) {
    return Response.json({ error: "Аккаунт не найден или не привязан к группе" }, { status: 400 });
  }

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || !test.isActive) {
    return Response.json({ error: "Тест не найден" }, { status: 404 });
  }

  const existing = await prisma.attempt.findUnique({
    where: { testId_studentEmail: { testId, studentEmail: student.email } },
  });

  if (existing) {
    if (existing.finishedAt) {
      return Response.json(
        { error: "Вы уже проходили этот тест. Повторная сдача невозможна." },
        { status: 409 }
      );
    }
    return Response.json({ attemptId: existing.id });
  }

  try {
    const attempt = await prisma.attempt.create({
      data: {
        studentFio: student.fio,
        studentEmail: student.email,
        groupId: student.groupId,
        testId: test.id,
      },
    });
    return Response.json({ attemptId: attempt.id });
  } catch {
    const race = await prisma.attempt.findUnique({
      where: { testId_studentEmail: { testId, studentEmail: student.email } },
    });
    if (race) return Response.json({ attemptId: race.id });
    return Response.json({ error: "Не удалось начать тест, попробуйте ещё раз" }, { status: 500 });
  }
}
