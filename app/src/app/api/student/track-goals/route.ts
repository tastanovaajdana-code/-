import { prisma } from "@/lib/prisma";

async function currentScore(email: string, track: "ort" | "manas") {
  const attempt = await prisma.attempt.findFirst({
    where: { studentEmail: email, finishedAt: { not: null }, test: { track } },
    orderBy: { finishedAt: "desc" },
  });
  return attempt?.totalScore ?? null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });

  const goals = await prisma.trackGoal.findMany({ where: { email } });
  const goalByTrack = new Map(goals.map((g) => [g.track, g]));

  const [ortScore, manasScore] = await Promise.all([currentScore(email, "ort"), currentScore(email, "manas")]);

  function shape(track: "ort" | "manas", score: number | null) {
    const g = goalByTrack.get(track);
    return {
      targetScore: g?.targetScore ?? null,
      targetDate: g?.targetDate ?? null,
      universityId: g?.universityId ?? null,
      programId: g?.programId ?? null,
      currentScore: score,
    };
  }

  return Response.json({ ort: shape("ort", ortScore), manas: shape("manas", manasScore) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const track = body.track === "manas" ? "manas" : body.track === "ort" ? "ort" : null;
  if (!email) return Response.json({ error: "Укажите email" }, { status: 400 });
  if (!track) return Response.json({ error: "Неверный трек" }, { status: 400 });

  const targetScore = body.targetScore !== undefined && body.targetScore !== null && body.targetScore !== "" ? Number(body.targetScore) : null;
  const targetDate = body.targetDate ? new Date(body.targetDate) : null;
  const universityId = body.universityId ? String(body.universityId).trim() : null;
  const programId = body.programId ? String(body.programId).trim() : null;

  const existing = await prisma.trackGoal.findUnique({ where: { email_track: { email, track } } });
  const goal = existing
    ? await prisma.trackGoal.update({
        where: { id: existing.id },
        data: { targetScore, targetDate, universityId, programId },
      })
    : await prisma.trackGoal.create({
        data: { email, track, targetScore, targetDate, universityId, programId },
      });

  return Response.json(goal);
}
