import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  await prisma.lessonProgress.upsert({
    where: { lessonId_studentEmail: { lessonId, studentEmail: email } },
    update: { watchedAt: new Date() },
    create: { lessonId, studentEmail: email, watchedAt: new Date() },
  });
  return Response.json({ ok: true });
}
