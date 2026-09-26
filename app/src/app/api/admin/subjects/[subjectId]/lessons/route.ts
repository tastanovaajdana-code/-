import { prisma } from "@/lib/prisma";
import { getAdminSession, requireFullAdmin } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { subjectId } = await params;
  const lessons = await prisma.lesson.findMany({
    where: { subjectId },
    orderBy: { order: "asc" },
    include: { practiceTest: true },
  });

  return Response.json(
    lessons.map((l) => ({
      id: l.id,
      title: l.title,
      videoUrl: l.videoUrl,
      description: l.description,
      durationMinutes: l.durationMinutes,
      practiceType: l.practiceType,
      practiceTestId: l.practiceTestId,
      practiceTestTitle: l.practiceTest?.title ?? null,
      practiceText: l.practiceText,
      dueDate: l.dueDate,
      order: l.order,
      isActive: l.isActive,
    }))
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { subjectId } = await params;
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const videoUrl = body.videoUrl ? String(body.videoUrl).trim() : null;
  const description = body.description ? String(body.description).trim() : null;
  const durationMinutes = body.durationMinutes ? Number(body.durationMinutes) : null;
  const practiceType = String(body.practiceType ?? "none").trim();
  const practiceTestId = body.practiceTestId ? String(body.practiceTestId).trim() : null;
  const practiceText = body.practiceText ? String(body.practiceText).trim() : null;
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;

  if (!title) return Response.json({ error: "Укажите название урока" }, { status: 400 });
  if (!["none", "test", "text"].includes(practiceType)) {
    return Response.json({ error: "Неверный тип практики" }, { status: 400 });
  }
  if (practiceType === "test" && !practiceTestId) {
    return Response.json({ error: "Выберите тест для практики" }, { status: 400 });
  }
  if (practiceType === "text" && !practiceText) {
    return Response.json({ error: "Укажите текст практического задания" }, { status: 400 });
  }

  const lesson = await prisma.lesson.create({
    data: {
      subjectId,
      title,
      videoUrl,
      description,
      durationMinutes,
      practiceType,
      practiceTestId: practiceType === "test" ? practiceTestId : null,
      practiceText: practiceType === "text" ? practiceText : null,
      dueDate,
      order,
    },
  });
  return Response.json(lesson);
}
