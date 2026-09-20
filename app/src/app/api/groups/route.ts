import { prisma } from "@/lib/prisma";

export async function GET() {
  const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });
  return Response.json(groups.map((g) => ({ id: g.id, name: g.name })));
}
