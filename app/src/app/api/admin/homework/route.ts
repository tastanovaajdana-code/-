import { prisma } from "@/lib/prisma";
import { getAdminSession, requireFullAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const homework = await prisma.homework.findMany({
    orderBy: { order: "asc" },
    include: { group: true, test: true },
  });
  return Response.json(
    homework.map((h) => ({
      id: h.id,
      title: h.title,
      type: h.type,
      groupId: h.groupId,
      groupName: h.group.name,
      testId: h.testId,
      testTitle: h.test?.title ?? null,
      textBody: h.textBody,
      dueDate: h.dueDate,
      order: h.order,
    }))
  );
}

export async function POST(request: Request) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const type = String(body.type ?? "").trim();
  const groupId = String(body.groupId ?? "").trim();
  const testId = body.testId ? String(body.testId).trim() : null;
  const textBody = body.textBody ? String(body.textBody).trim() : null;
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;

  if (!title || !groupId) {
    return Response.json({ error: "Укажите название и группу" }, { status: 400 });
  }
  if (type !== "test" && type !== "text") {
    return Response.json({ error: "Неверный тип задания" }, { status: 400 });
  }
  if (type === "test" && !testId) {
    return Response.json({ error: "Выберите тест для задания" }, { status: 400 });
  }
  if (type === "text" && !textBody) {
    return Response.json({ error: "Укажите текст задания" }, { status: 400 });
  }

  const homework = await prisma.homework.create({
    data: { title, type, groupId, testId: type === "test" ? testId : null, textBody: type === "text" ? textBody : null, dueDate, order },
  });
  return Response.json(homework);
}
