import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const url = new URL(request.url);
  const groupId = url.searchParams.get("groupId") || undefined;
  const testId = url.searchParams.get("testId") || undefined;

  const attempts = await prisma.attempt.findMany({
    where: { groupId: groupId || undefined, testId: testId || undefined },
    orderBy: { totalScore: "desc" },
    include: {
      group: true,
      test: { include: { sections: { orderBy: { order: "asc" } } } },
      sectionResults: true,
    },
  });

  const maxSections = Math.max(0, ...attempts.map((a) => a.test.sections.length));
  const sectionTitles = attempts[0]?.test.sections.map((s) => s.title) ?? [];

  const header = [
    "ФИО",
    "Электронная почта",
    "Группа",
    "Тест",
    ...Array.from({ length: maxSections }, (_, i) => sectionTitles[i] ?? `Раздел ${i + 1}`),
    "Итоговый балл",
    "Дата прохождения",
  ];

  const rows = attempts.map((attempt) => {
    const resultsBySection = new Map(attempt.sectionResults.map((r) => [r.sectionId, r]));
    const sectionScores = attempt.test.sections.map((s) => resultsBySection.get(s.id)?.score ?? 0);
    return [
      attempt.studentFio,
      attempt.studentEmail ?? "",
      attempt.group.name,
      attempt.test.title,
      ...sectionScores.map(String),
      String(attempt.totalScore),
      attempt.finishedAt ? new Date(attempt.finishedAt).toLocaleString("ru-RU") : "",
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(";"))
    .join("\n");

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ort-results.csv",
    },
  });
}
