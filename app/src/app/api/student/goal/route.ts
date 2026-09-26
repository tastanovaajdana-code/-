import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const goal = await prisma.studentGoal.findUnique({ where: { email } });
  return Response.json({ targetPercent: goal?.targetPercent ?? null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const targetPercent = Math.round(Number(body.targetPercent));

  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });
  if (!Number.isFinite(targetPercent) || targetPercent < 1 || targetPercent > 100) {
    return Response.json({ error: "Цель должна быть числом от 1 до 100" }, { status: 400 });
  }

  const goal = await prisma.studentGoal.upsert({
    where: { email },
    update: { targetPercent },
    create: { email, targetPercent },
  });
  return Response.json({ targetPercent: goal.targetPercent });
}
