import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const plan = await prisma.weeklyPlan.findUnique({ where: { email } });
  return Response.json({ hoursPerWeek: plan?.hoursPerWeek ?? null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const hoursPerWeek = Math.round(Number(body.hoursPerWeek));
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });
  if (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 168) {
    return Response.json({ error: "Введите число часов от 1 до 168" }, { status: 400 });
  }

  const plan = await prisma.weeklyPlan.upsert({
    where: { email },
    update: { hoursPerWeek },
    create: { email, hoursPerWeek },
  });
  return Response.json({ hoursPerWeek: plan.hoursPerWeek });
}
