import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const groupName = (url.searchParams.get("group") || "").trim();
  if (!groupName) return Response.json({ error: "Укажите группу" }, { status: 400 });

  const group = await prisma.group.findUnique({ where: { name: groupName }, include: { curator: true } });
  if (!group || !group.curator) {
    return Response.json({ curator: null });
  }

  return Response.json({
    curator: {
      displayName: group.curator.displayName ?? group.curator.login,
      contact: group.curator.contact,
    },
  });
}
