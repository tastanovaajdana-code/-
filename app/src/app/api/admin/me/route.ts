import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Не авторизован" }, { status: 401 });
  }
  return Response.json({ id: session.adminId, login: session.login, role: session.role });
}
