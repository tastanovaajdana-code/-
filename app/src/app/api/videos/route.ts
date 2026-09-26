import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();

  const videos = await prisma.videoLesson.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { watches: { where: { studentEmail: email } } },
  });

  return Response.json(
    videos.map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      description: v.description,
      subject: v.subject,
      durationMinutes: v.durationMinutes,
      watched: v.watches.length > 0,
    }))
  );
}
