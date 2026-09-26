import { prisma } from "@/lib/prisma";

export async function GET() {
  const universities = await prisma.university.findMany({
    orderBy: { order: "asc" },
    include: { programs: { orderBy: { order: "asc" } } },
  });

  return Response.json(
    universities.map((u) => ({
      id: u.id,
      name: u.name,
      programs: u.programs.map((p) => ({ id: p.id, name: p.name })),
    }))
  );
}
