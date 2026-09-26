import { getStudentSession } from "@/lib/studentAuth";
import { computeStudentStats } from "@/lib/studentStats";

export async function GET() {
  const session = await getStudentSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const data = await computeStudentStats(session.email);
  return Response.json(data);
}
