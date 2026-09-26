import { computeStudentStats } from "@/lib/studentStats";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const data = await computeStudentStats(email);
  return Response.json(data);
}
