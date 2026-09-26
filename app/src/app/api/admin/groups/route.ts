import { prisma } from "@/lib/prisma";
import { getAdminSession, requireFullAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { attempts: true } }, curator: true },
  });

  return Response.json(
    groups.map((g) => ({
      id: g.id,
      name: g.name,
      attemptsCount: g._count.attempts,
      curatorId: g.curatorId,
      curatorName: g.curator?.displayName ?? g.curator?.login ?? null,
    }))
  );
}

export async function POST(request: Request) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return Response.json({ error: "Укажите название группы" }, { status: 400 });

  const group = await prisma.group.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  return Response.json({ id: group.id, name: group.name });
}
