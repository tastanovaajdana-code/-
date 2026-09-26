import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ universityId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { universityId } = await params;
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const order = Number.isFinite(Number(body.order)) ? Number(body.order) : 0;
  if (!name) return Response.json({ error: "Укажите название направления" }, { status: 400 });

  try {
    const program = await prisma.program.create({ data: { universityId, name, order } });
    return Response.json(program);
  } catch {
    return Response.json({ error: "Такое направление уже есть у этого университета" }, { status: 409 });
  }
}
