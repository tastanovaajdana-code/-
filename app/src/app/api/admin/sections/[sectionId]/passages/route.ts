import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const session = await requireFullAdmin();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { sectionId } = await params;
  const body = await request.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" && body.imageUrl ? body.imageUrl : null;

  if (!title && !text && !imageUrl) {
    return Response.json({ error: "Добавьте текст, заголовок или изображение" }, { status: 400 });
  }

  const count = await prisma.passage.count({ where: { sectionId } });

  const passage = await prisma.passage.create({
    data: {
      sectionId,
      title: title || null,
      text: text || null,
      imageUrl,
      order: count,
    },
  });

  return Response.json({ id: passage.id });
}
