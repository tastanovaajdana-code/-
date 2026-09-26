import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import tsoomo4Rows from "../../../../../prisma/data/tsoomo4.json";

export const maxDuration = 60;

function htmlResponse(body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Настройка сайта ОРТ</title>
    <style>body{font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 20px;line-height:1.6;color:#1e293b}
    code{background:#f1f5f9;padding:2px 6px;border-radius:4px}
    .ok{color:#059669;font-weight:600}.err{color:#dc2626;font-weight:600}</style></head>
    <body>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

type SectionSeed = { title: string; timeLimitMinutes: number; maxScore: number };
type QuestionSeed = { text: string; optionA: string; optionB: string; optionC: string; optionD: string; correct: string };
type ImportRow = {
  section: string;
  question_text: string;
  type: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  option_e?: string | null;
  correct_answer: string;
  points?: number;
  image_url?: string | null;
};

async function createTestFromRows(
  title: string,
  description: string,
  sectionsData: SectionSeed[],
  rows: ImportRow[]
) {
  const existingTest = await prisma.test.findFirst({ where: { title } });
  if (existingTest) return;

  const test = await prisma.test.create({
    data: { title, description, isActive: true },
  });

  const sectionByTitle = new Map<string, { id: string }>();
  for (let i = 0; i < sectionsData.length; i++) {
    const s = sectionsData[i];
    const section = await prisma.section.create({
      data: { testId: test.id, title: s.title, order: i, timeLimitMinutes: s.timeLimitMinutes, maxScore: s.maxScore },
    });
    sectionByTitle.set(s.title, section);
  }

  const orderBySection = new Map<string, number>();
  const questionsData = [];
  for (const row of rows) {
    const section = sectionByTitle.get(row.section);
    if (!section) continue;
    const order = orderBySection.get(section.id) ?? 0;
    orderBySection.set(section.id, order + 1);

    questionsData.push({
      sectionId: section.id,
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
    });
  }

  await prisma.question.createMany({ data: questionsData });
}

async function createTestIfMissing(
  title: string,
  description: string,
  sectionsData: SectionSeed[],
  questionBank: Record<string, QuestionSeed[]>
) {
  const existingTest = await prisma.test.findFirst({ where: { title } });
  if (existingTest) return;

  const test = await prisma.test.create({
    data: { title, description, isActive: true },
  });

  for (let i = 0; i < sectionsData.length; i++) {
    const s = sectionsData[i];
    const section = await prisma.section.create({
      data: { testId: test.id, title: s.title, order: i, timeLimitMinutes: s.timeLimitMinutes, maxScore: s.maxScore },
    });

    const questions = questionBank[s.title] ?? [];
    for (let j = 0; j < questions.length; j++) {
      const q = questions[j];
      await prisma.question.create({
        data: {
          sectionId: section.id,
          text: q.text,
          type: "single",
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correct,
          points: 1,
          order: j,
        },
      });
    }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const expected = process.env.SEED_SECRET;

  if (!expected) {
    return htmlResponse(
      "<p class='err'>SEED_SECRET не настроен в переменных окружения проекта.</p>",
      500
    );
  }
  if (!key || key !== expected) {
    return htmlResponse("<p class='err'>Неверный ключ доступа.</p>", 401);
  }

  const adminLogin = process.env.SEED_ADMIN_LOGIN || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const passwordHash = await hashPassword(adminPassword);
  await prisma.adminUser.upsert({
    where: { login: adminLogin },
    update: {},
    create: { login: adminLogin, passwordHash },
  });

  const groupNames = [
    "Прогресс",
    "Грант",
    "ЖРТ",
    "Progress-1",
    "Progress-2",
    "Grant-1",
    "Grant-2",
    "Vip-1",
    "Standart-1",
    "Стандарт-2",
    "ЖРТ-1",
  ];
  for (const name of groupNames) {
    await prisma.group.upsert({ where: { name }, update: {}, create: { name } });
  }

  const sectionsData: SectionSeed[] = [
    { title: "Аналогии", timeLimitMinutes: 20, maxScore: 25 },
    { title: "Математика", timeLimitMinutes: 30, maxScore: 25 },
    { title: "Чтение и понимание текста", timeLimitMinutes: 25, maxScore: 25 },
    { title: "Грамотность письма", timeLimitMinutes: 20, maxScore: 25 },
  ];

  await createTestIfMissing(
    "ОРТ — пробный тест №1",
    "Тренировочное тестирование по 4 разделам ОРТ",
    sectionsData,
    {
      Аналогии: [
        { text: "Птица : Гнездо = Человек : ?", optionA: "Машина", optionB: "Дом", optionC: "Дерево", optionD: "Улица", correct: "option_b" },
        { text: "Учитель : Школа = Врач : ?", optionA: "Больница", optionB: "Магазин", optionC: "Театр", optionD: "Стадион", correct: "option_a" },
        { text: "Холод : Снег = Жара : ?", optionA: "Дождь", optionB: "Ветер", optionC: "Зной", optionD: "Туман", correct: "option_c" },
      ],
      Математика: [
        { text: "Чему равно 12 × 8?", optionA: "86", optionB: "96", optionC: "106", optionD: "76", correct: "option_b" },
        { text: "Найдите значение x: 3x + 5 = 20", optionA: "5", optionB: "6", optionC: "4", optionD: "7", correct: "option_a" },
        { text: "Площадь квадрата со стороной 6 см равна", optionA: "24 см²", optionB: "36 см²", optionC: "12 см²", optionD: "30 см²", correct: "option_b" },
      ],
      "Чтение и понимание текста": [
        { text: "Главная мысль текста обычно выражена в", optionA: "заголовке", optionB: "первом предложении", optionC: "выводе", optionD: "зависит от текста", correct: "option_d" },
        { text: 'Синоним слова "быстро"', optionA: "медленно", optionB: "стремительно", optionC: "тихо", optionD: "громко", correct: "option_b" },
      ],
      "Грамотность письма": [
        { text: "Укажите правильное написание", optionA: "не смотря на", optionB: "несмотря на", optionC: "не-смотря на", optionD: "нес мотря на", correct: "option_b" },
        { text: 'В каком слове пропущена буква "о": пр...грамма', optionA: "а", optionB: "о", optionC: "е", optionD: "и", correct: "option_b" },
      ],
    }
  );

  await createTestIfMissing(
    "ОРТ — пробный тест №2",
    "Второе тренировочное тестирование по 4 разделам ОРТ",
    sectionsData,
    {
      Аналогии: [
        { text: "Рыба : Вода = Птица : ?", optionA: "Гнездо", optionB: "Воздух", optionC: "Дерево", optionD: "Земля", correct: "option_b" },
        { text: "Книга : Читатель = Фильм : ?", optionA: "Режиссёр", optionB: "Актёр", optionC: "Зритель", optionD: "Сценарий", correct: "option_c" },
        { text: "Огонь : Тепло = Лёд : ?", optionA: "Холод", optionB: "Вода", optionC: "Снег", optionD: "Пар", correct: "option_a" },
      ],
      Математика: [
        { text: "Чему равно 15 × 6?", optionA: "80", optionB: "90", optionC: "85", optionD: "95", correct: "option_b" },
        { text: "Найдите значение x: 4x − 7 = 21", optionA: "6", optionB: "7", optionC: "8", optionD: "9", correct: "option_b" },
        { text: "Периметр прямоугольника со сторонами 5 и 8 см равен", optionA: "26 см", optionB: "40 см", optionC: "13 см", optionD: "30 см", correct: "option_a" },
      ],
      "Чтение и понимание текста": [
        { text: "Абзац — это", optionA: "отдельное слово", optionB: "часть текста с единой мыслью", optionC: "заголовок текста", optionD: "знак пунктуации", correct: "option_b" },
        { text: 'Антоним слова "светлый"', optionA: "яркий", optionB: "тёмный", optionC: "прозрачный", optionD: "цветной", correct: "option_b" },
      ],
      "Грамотность письма": [
        { text: "Укажите правильное написание", optionA: "чтобы", optionB: "что бы", optionC: "что-бы", optionD: "чтоб ы", correct: "option_a" },
        { text: 'В каком слове пропущена буква "и": д...ректор', optionA: "е", optionB: "и", optionC: "я", optionD: "а", correct: "option_b" },
      ],
    }
  );

  await createTestFromRows(
    "ЦООМО — тест №4",
    "Полный пробный тест ЦООМО (Математика, Аналогия, Чтение, Грамматика)",
    [
      { title: "Математика", timeLimitMinutes: 90, maxScore: 50 },
      { title: "Аналогия", timeLimitMinutes: 30, maxScore: 63 },
      { title: "Чтение", timeLimitMinutes: 60, maxScore: 63 },
      { title: "Грамматика", timeLimitMinutes: 35, maxScore: 50 },
    ],
    tsoomo4Rows as ImportRow[]
  );

  return htmlResponse(`
    <h1 class="ok">Готово!</h1>
    <p>Администратор и пробные тесты созданы (или уже существовали).</p>
    <p>Логин администратора: <code>${adminLogin}</code></p>
    <p>Пароль администратора: <code>${adminPassword}</code></p>
    <p>Теперь можно зайти на <code>/admin/login</code>, а ученики могут заходить на <code>/</code>.</p>
    <p style="margin-top:24px;color:#64748b;font-size:14px">Эту страницу можно закрыть — эта ссылка безопасна для повторного открытия, данные не задублируются.</p>
  `);
}
