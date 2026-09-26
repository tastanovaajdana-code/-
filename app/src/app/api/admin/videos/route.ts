import { prisma } from "@/lib/prisma";
import { getAdminSession, requireFullAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const videos = await prisma.videoLesson.findMany({ orderBy: { order: "asc" } });
  return Response.json(videos);
}

export async function POST(request: Request) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const url = String(body.url ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const subject = body.subject ? String(body.subject).trim() : null;
  const durationMinutes = body.durationMinutes ? Number(body.durationMinutes) : null;
  const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;

  if (!title || !url) {
    return Response.json({ error: "Укажите название и ссылку на видео" }, { status: 400 });
  }

  const video = await prisma.videoLesson.create({
    data: { title, url, description, subject, durationMinutes, order },
  });
  return Response.json(video);
}
