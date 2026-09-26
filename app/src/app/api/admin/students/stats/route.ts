import { getAdminSession } from "@/lib/auth";
import { computeStudentStats } from "@/lib/studentStats";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const data = await computeStudentStats(email);
  return Response.json(data);
}
