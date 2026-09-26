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

  const passageCounts = new Map<string, number>();
  for (const section of sections) {
    passageCounts.set(section.id, await prisma.passage.count({ where: { sectionId: section.id } }));
  }
  // key: `${sectionId}::${passageTitle.toLowerCase()}`
  const passageByKey = new Map<string, string>();

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
      const validKeys = ["option_a", "option_b", "option_c", "option_d", "option_e"];
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

    let passageId: string | null = null;
    const passageTitle = row.passage_title?.trim();
    if (passageTitle) {
      const key = `${section.id}::${passageTitle.toLowerCase()}`;
      const existingId = passageByKey.get(key);
      if (existingId) {
        passageId = existingId;
      } else {
        const passageOrder = passageCounts.get(section.id) ?? 0;
        passageCounts.set(section.id, passageOrder + 1);
        const passage = await prisma.passage.create({
          data: {
            sectionId: section.id,
            title: passageTitle,
            text: row.passage_text || null,
            imageUrl: row.passage_image_url || null,
            order: passageOrder,
          },
        });
        passageByKey.set(key, passage.id);
        passageId = passage.id;
      }
    }

    await prisma.question.create({
      data: {
        sectionId: section.id,
        passageId,
        text: row.question_text,
        type: row.type,
        optionA: row.option_a || null,
        optionB: row.option_b || null,
        optionC: row.option_c || null,
        optionD: row.option_d || null,
        optionE: row.option_e || null,
        correctAnswer: row.correct_answer,
        points: row.points ?? 1,
        order,
        imageUrl: row.image_url || null,
        explanation: row.explanation || null,
      },
    });
    createdCount += 1;
  }

  return Response.json({ createdCount, errors });
}
