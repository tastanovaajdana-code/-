import { prisma } from "@/lib/prisma";
import { getAdminSession, requireFullAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const url = new URL(request.url);
  const track = url.searchParams.get("track") || undefined;

  const subjects = await prisma.subject.findMany({
    where: { track },
    orderBy: [{ track: "asc" }, { order: "asc" }],
    include: { _count: { select: { lessons: true } } },
  });

  return Response.json(
    subjects.map((s) => ({
      id: s.id,
      track: s.track,
      name: s.name,
      order: s.order,
      lessonsCount: s._count.lessons,
    }))
  );
}

export async function POST(request: Request) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const track = String(body.track ?? "").trim();
  const name = String(body.name ?? "").trim();
  const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;

  if (track !== "ort" && track !== "manas") {
    return Response.json({ error: "Неверный трек" }, { status: 400 });
  }
  if (!name) return Response.json({ error: "Укажите название предмета" }, { status: 400 });

  try {
    const subject = await prisma.subject.create({ data: { track, name, order } });
    return Response.json(subject);
  } catch {
    return Response.json({ error: "Предмет с таким названием уже есть в этом треке" }, { status: 409 });
  }
}
