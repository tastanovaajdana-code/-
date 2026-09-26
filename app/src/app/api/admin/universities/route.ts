import { prisma } from "@/lib/prisma";
import { getAdminSession, requireFullAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const universities = await prisma.university.findMany({
    orderBy: { order: "asc" },
    include: { programs: { orderBy: { order: "asc" } } },
  });
  return Response.json(universities);
}

export async function POST(request: Request) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;
  if (!name) return Response.json({ error: "Укажите название университета" }, { status: 400 });

  try {
    const university = await prisma.university.create({ data: { name, order } });
    return Response.json(university);
  } catch {
    return Response.json({ error: "Такой университет уже есть" }, { status: 409 });
  }
}
