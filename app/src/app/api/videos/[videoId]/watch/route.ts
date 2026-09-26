import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  await prisma.videoWatch.upsert({
    where: { videoLessonId_studentEmail: { videoLessonId: videoId, studentEmail: email } },
    update: {},
    create: { videoLessonId: videoId, studentEmail: email },
  });
  return Response.json({ ok: true });
}
