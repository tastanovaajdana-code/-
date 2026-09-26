import { prisma } from "@/lib/prisma";

export async function GET() {
  const tests = await prisma.test.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { sections: { select: { id: true } } },
  });

  return Response.json(
    tests.map((test) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      track: test.track,
      sectionsCount: test.sections.length,
    }))
  );
}
