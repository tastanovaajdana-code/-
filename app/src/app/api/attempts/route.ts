import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const fio = String(body.fio ?? "").trim();
  const groupName = String(body.group ?? "").trim();
  const testId = String(body.testId ?? "").trim();

  if (!fio || !groupName || !testId) {
    return Response.json(
      { error: "Укажите ФИО, группу и тест" },
      { status: 400 }
    );
  }

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || !test.isActive) {
    return Response.json({ error: "Тест не найден" }, { status: 404 });
  }

  const group = await prisma.group.upsert({
    where: { name: groupName },
    update: {},
    create: { name: groupName },
  });

  const attempt = await prisma.attempt.create({
    data: {
      studentFio: fio,
      groupId: group.id,
      testId: test.id,
    },
  });

  return Response.json({ attemptId: attempt.id });
}
