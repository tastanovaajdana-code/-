import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ homeworkId: string }> }
) {
  const { homeworkId } = await params;
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  await prisma.homeworkCompletion.upsert({
    where: { homeworkId_studentEmail: { homeworkId, studentEmail: email } },
    update: {},
    create: { homeworkId, studentEmail: email },
  });
  return Response.json({ ok: true });
}
