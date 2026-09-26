import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const goals = await prisma.studentGoal.findMany({
    where: { email },
    include: { subject: true },
  });

  return Response.json(
    goals.map((g) => ({
      subjectId: g.subjectId,
      subjectName: g.subject?.name ?? null,
      targetPercent: g.targetPercent,
    }))
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const subjectId: string | null = body.subjectId ? String(body.subjectId).trim() : null;
  const targetPercent = Math.round(Number(body.targetPercent));

  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });
  if (!Number.isFinite(targetPercent) || targetPercent < 1 || targetPercent > 100) {
    return Response.json({ error: "Цель должна быть числом от 1 до 100" }, { status: 400 });
  }

  const existing = await prisma.studentGoal.findFirst({ where: { email, subjectId } });
  const goal = existing
    ? await prisma.studentGoal.update({ where: { id: existing.id }, data: { targetPercent } })
    : await prisma.studentGoal.create({ data: { email, subjectId, targetPercent } });

  return Response.json({ subjectId: goal.subjectId, targetPercent: goal.targetPercent });
}
