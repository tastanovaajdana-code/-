import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { sectionId } = await params;
  const body = await request.json();

  const text = String(body.text ?? "").trim();
  const type = String(body.type ?? "single");
  const correctAnswer = String(body.correctAnswer ?? "").trim();
  const points = body.points !== undefined ? Number(body.points) : 1;

  if (!text || !correctAnswer || !["single", "multiple", "text"].includes(type)) {
    return Response.json({ error: "Заполните вопрос корректно" }, { status: 400 });
  }

  const count = await prisma.question.count({ where: { sectionId } });

  const question = await prisma.question.create({
    data: {
      sectionId,
      text,
      type,
      optionA: body.optionA || null,
      optionB: body.optionB || null,
      optionC: body.optionC || null,
      optionD: body.optionD || null,
      correctAnswer,
      points: Number.isFinite(points) && points > 0 ? points : 1,
      order: count,
    },
  });

  return Response.json({ id: question.id });
}
