import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json();
  const fio = String(body.fio ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const groupName = String(body.group ?? "").trim();
  const testId = String(body.testId ?? "").trim();

  if (!fio || !email || !groupName || !testId) {
    return Response.json(
      { error: "Укажите ФИО, электронную почту и группу" },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Некорректный формат электронной почты" }, { status: 400 });
  }

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || !test.isActive) {
    return Response.json({ error: "Тест не найден" }, { status: 404 });
  }

  const existing = await prisma.attempt.findUnique({
    where: { testId_studentEmail: { testId, studentEmail: email } },
  });

  if (existing) {
    if (existing.finishedAt) {
      return Response.json(
        { error: "Вы уже проходили этот тест с указанной электронной почтой. Повторная сдача невозможна." },
        { status: 409 }
      );
    }
    return Response.json({ attemptId: existing.id });
  }

  const group = await prisma.group.upsert({
    where: { name: groupName },
    update: {},
    create: { name: groupName },
  });

  try {
    const attempt = await prisma.attempt.create({
      data: {
        studentFio: fio,
        studentEmail: email,
        groupId: group.id,
        testId: test.id,
      },
    });
    return Response.json({ attemptId: attempt.id });
  } catch {
    const race = await prisma.attempt.findUnique({
      where: { testId_studentEmail: { testId, studentEmail: email } },
    });
    if (race) return Response.json({ attemptId: race.id });
    return Response.json({ error: "Не удалось начать тест, попробуйте ещё раз" }, { status: 500 });
  }
}
