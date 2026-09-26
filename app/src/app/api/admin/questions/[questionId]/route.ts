import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { questionId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof body.text === "string") data.text = body.text.trim();
  if (typeof body.type === "string") data.type = body.type;
  if (typeof body.correctAnswer === "string") data.correctAnswer = body.correctAnswer.trim();
  if (body.points !== undefined) data.points = Number(body.points);
  for (const key of ["optionA", "optionB", "optionC", "optionD", "optionE", "imageUrl", "explanation"] as const) {
    if (body[key] !== undefined) data[key] = body[key] || null;
  }

  await prisma.question.update({ where: { id: questionId }, data });
  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { questionId } = await params;
  try {
    await prisma.question.delete({ where: { id: questionId } });
  } catch {
    return Response.json({ error: "Не удалось удалить вопрос" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
