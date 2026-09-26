import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/studentAuth";

export async function GET() {
  const session = await getStudentSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    include: { group: true },
  });
  if (!student) return Response.json({ error: "Не найден" }, { status: 404 });

  return Response.json({
    id: student.id,
    fio: student.fio,
    email: student.email,
    groupId: student.groupId,
    groupName: student.group?.name ?? null,
  });
}
