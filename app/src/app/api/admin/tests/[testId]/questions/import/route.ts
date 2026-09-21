import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { parseQuestionsFile } from "@/lib/importQuestions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return Response.json({ error: "Не авторизован" }, { status: 401 });

  const { testId } = await params;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Файл не найден" }, { status: 400 });
  }

  const sections = await prisma.section.findMany({ where: { testId } });
  const sectionByTitle = new Map(
    sections.map((s) => [s.title.trim().toLowerCase(), s])
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors } = parseQuestionsFile(buffer, file.name);

  const sectionCounts = new Map<string, number>();
  for (const section of sections) {
    sectionCounts.set(section.id, await prisma.question.count({ where: { sectionId: section.id } }));
  }

  let createdCount = 0;
  const availableSectionNames = sections.map((s) => s.title).join(", ");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const section = sectionByTitle.get(row.section.trim().toLowerCase());
    if (!section) {
      errors.push(
        `Строка ${i + 2}: раздел "${row.section}" не найден в этом тесте. Доступные разделы: ${availableSectionNames || "нет"}`
      );
      continue;
    }

    if (row.type === "single" || row.type === "multiple") {
      const validKeys = ["option_a", "option_b", "option_c", "option_d"];
      const answerKeys = row.correct_answer.split(",").map((s) => s.trim());
      const invalid = answerKeys.filter((k) => !validKeys.includes(k));
      if (invalid.length > 0) {
        errors.push(
          `Строка ${i + 2}: правильный ответ должен быть одним из option_a..option_d (получено: ${row.correct_answer})`
        );
        continue;
      }
    }

    const order = sectionCounts.get(section.id) ?? 0;
    sectionCounts.set(section.id, order + 1);

    await prisma.question.create({
      data: {
        sectionId: section.id,
        text: row.question_text,
        type: row.type,
        optionA: row.option_a || null,
        optionB: row.option_b || null,
        optionC: row.option_c || null,
        optionD: row.option_d || null,
        correctAnswer: row.correct_answer,
        points: row.points ?? 1,
        order,
        imageUrl: row.image_url || null,
      },
    });
    createdCount += 1;
  }

  return Response.json({ createdCount, errors });
}
