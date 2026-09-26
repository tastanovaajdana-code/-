const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function createTestFromRows({ title, description, sectionsData, rows }) {
  const existingTest = await prisma.test.findFirst({ where: { title } });
  if (existingTest) {
    console.log(`Тест "${title}" уже существует, пропускаем сидирование`);
    return;
  }

  const test = await prisma.test.create({
    data: { title, description, isActive: true },
  });

  const sectionByTitle = new Map();
  for (let i = 0; i < sectionsData.length; i++) {
    const s = sectionsData[i];
    const section = await prisma.section.create({
      data: { testId: test.id, title: s.title, order: i, timeLimitMinutes: s.timeLimitMinutes, maxScore: s.maxScore },
    });
    sectionByTitle.set(s.title, section);
  }

  const orderBySection = new Map();
  const questionsData = [];
  for (const row of rows) {
    const section = sectionByTitle.get(row.section);
    if (!section) {
      console.warn(`Раздел "${row.section}" не найден в тесте "${title}", пропускаем вопрос`);
      continue;
    }
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

  console.log(`Тест "${title}" с ${sectionsData.length} разделами и ${questionsData.length} вопросами создан`);
}

async function createOrExtendTestFromRows({ title, description, sectionsData, rows }) {
  let test = await prisma.test.findFirst({ where: { title } });
  const sectionByTitle = new Map();

  if (!test) {
    test = await prisma.test.create({ data: { title, description, isActive: true } });
    for (let i = 0; i < sectionsData.length; i++) {
      const s = sectionsData[i];
      const section = await prisma.section.create({
        data: { testId: test.id, title: s.title, order: i, timeLimitMinutes: s.timeLimitMinutes, maxScore: s.maxScore },
      });
      sectionByTitle.set(s.title, section);
    }
  } else {
    const existingSections = await prisma.section.findMany({ where: { testId: test.id } });
    for (const es of existingSections) sectionByTitle.set(es.title, es);
    for (let i = 0; i < sectionsData.length; i++) {
      const s = sectionsData[i];
      const existing = sectionByTitle.get(s.title);
      if (existing) {
        const updated = await prisma.section.update({
          where: { id: existing.id },
          data: { timeLimitMinutes: s.timeLimitMinutes, maxScore: s.maxScore },
        });
        sectionByTitle.set(s.title, updated);
      } else {
        const section = await prisma.section.create({
          data: { testId: test.id, title: s.title, order: existingSections.length + i, timeLimitMinutes: s.timeLimitMinutes, maxScore: s.maxScore },
        });
        sectionByTitle.set(s.title, section);
      }
    }
  }

  const orderBySection = new Map();
  for (const section of sectionByTitle.values()) {
    const count = await prisma.question.count({ where: { sectionId: section.id } });
    orderBySection.set(section.id, count);
  }

  let added = 0;
  for (const row of rows) {
    const section = sectionByTitle.get(row.section);
    if (!section) {
      console.warn(`Раздел "${row.section}" не найден в тесте "${title}", пропускаем вопрос`);
      continue;
    }
    const alreadyExists = await prisma.question.findFirst({
      where: { sectionId: section.id, text: row.question_text },
    });
    if (alreadyExists) continue;

    const order = orderBySection.get(section.id) ?? 0;
    orderBySection.set(section.id, order + 1);

    await prisma.question.create({
      data: {
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
      },
    });
    added++;
  }

  console.log(`Тест "${title}": добавлено ${added} новых вопросов`);
}

async function createTestIfMissing({ title, description, sectionsData, questionBank }) {
  const existingTest = await prisma.test.findFirst({ where: { title } });
  if (existingTest) {
    console.log(`Тест "${title}" уже существует, пропускаем сидирование`);
    return;
  }

  const test = await prisma.test.create({
    data: { title, description, isActive: true },
  });

  for (let i = 0; i < sectionsData.length; i++) {
    const s = sectionsData[i];
    const section = await prisma.section.create({
      data: { testId: test.id, title: s.title, order: i, timeLimitMinutes: s.timeLimitMinutes, maxScore: s.maxScore },
    });

    const questions = questionBank[s.title] || [];
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

  console.log(`Тест "${title}" с ${sectionsData.length} разделами и вопросами создан`);
}

async function main() {
  const adminLogin = process.env.SEED_ADMIN_LOGIN || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { login: adminLogin },
    update: {},
    create: { login: adminLogin, passwordHash },
  });
  console.log(`Админ создан: логин "${adminLogin}", пароль "${adminPassword}"`);

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

  const ortSubjects = ["Математика", "Аналогия", "Окуу жана тушунуу", "Грамматика"];
  const manasSubjects = ["Математика", "Кыргыз тили", "Физика", "Химия", "Биология", "Кыргыз адабияты", "География", "Тарых"];
  for (const [i, name] of ortSubjects.entries()) {
    await prisma.subject.upsert({ where: { track_name: { track: "ort", name } }, update: {}, create: { track: "ort", name, order: i } });
  }
  for (const [i, name] of manasSubjects.entries()) {
    await prisma.subject.upsert({ where: { track_name: { track: "manas", name } }, update: {}, create: { track: "manas", name, order: i } });
  }

  await createTestIfMissing({
    title: "ОРТ — пробный тест №1",
    description: "Тренировочное тестирование по 4 разделам ОРТ",
    sectionsData: [
      { title: "Аналогии", timeLimitMinutes: 20, maxScore: 25 },
      { title: "Математика", timeLimitMinutes: 30, maxScore: 25 },
      { title: "Чтение и понимание текста", timeLimitMinutes: 25, maxScore: 25 },
      { title: "Грамотность письма", timeLimitMinutes: 20, maxScore: 25 },
    ],
    questionBank: {
      "Аналогии": [
        { text: "Птица : Гнездо = Человек : ?", optionA: "Машина", optionB: "Дом", optionC: "Дерево", optionD: "Улица", correct: "option_b" },
        { text: "Учитель : Школа = Врач : ?", optionA: "Больница", optionB: "Магазин", optionC: "Театр", optionD: "Стадион", correct: "option_a" },
        { text: "Холод : Снег = Жара : ?", optionA: "Дождь", optionB: "Ветер", optionC: "Зной", optionD: "Туман", correct: "option_c" },
      ],
      "Математика": [
        { text: "Чему равно 12 × 8?", optionA: "86", optionB: "96", optionC: "106", optionD: "76", correct: "option_b" },
        { text: "Найдите значение x: 3x + 5 = 20", optionA: "5", optionB: "6", optionC: "4", optionD: "7", correct: "option_a" },
        { text: "Площадь квадрата со стороной 6 см равна", optionA: "24 см²", optionB: "36 см²", optionC: "12 см²", optionD: "30 см²", correct: "option_b" },
      ],
      "Чтение и понимание текста": [
        { text: "Главная мысль текста обычно выражена в", optionA: "заголовке", optionB: "первом предложении", optionC: "выводе", optionD: "зависит от текста", correct: "option_d" },
        { text: "Синоним слова \"быстро\"", optionA: "медленно", optionB: "стремительно", optionC: "тихо", optionD: "громко", correct: "option_b" },
      ],
      "Грамотность письма": [
        { text: "Укажите правильное написание", optionA: "не смотря на", optionB: "несмотря на", optionC: "не-смотря на", optionD: "нес мотря на", correct: "option_b" },
        { text: "В каком слове пропущена буква \"о\": пр...грамма", optionA: "а", optionB: "о", optionC: "е", optionD: "и", correct: "option_b" },
      ],
    },
  });

  await createTestIfMissing({
    title: "ОРТ — пробный тест №2",
    description: "Второе тренировочное тестирование по 4 разделам ОРТ",
    sectionsData: [
      { title: "Аналогии", timeLimitMinutes: 20, maxScore: 25 },
      { title: "Математика", timeLimitMinutes: 30, maxScore: 25 },
      { title: "Чтение и понимание текста", timeLimitMinutes: 25, maxScore: 25 },
      { title: "Грамотность письма", timeLimitMinutes: 20, maxScore: 25 },
    ],
    questionBank: {
      "Аналогии": [
        { text: "Рыба : Вода = Птица : ?", optionA: "Гнездо", optionB: "Воздух", optionC: "Дерево", optionD: "Земля", correct: "option_b" },
        { text: "Книга : Читатель = Фильм : ?", optionA: "Режиссёр", optionB: "Актёр", optionC: "Зритель", optionD: "Сценарий", correct: "option_c" },
        { text: "Огонь : Тепло = Лёд : ?", optionA: "Холод", optionB: "Вода", optionC: "Снег", optionD: "Пар", correct: "option_a" },
      ],
      "Математика": [
        { text: "Чему равно 15 × 6?", optionA: "80", optionB: "90", optionC: "85", optionD: "95", correct: "option_b" },
        { text: "Найдите значение x: 4x − 7 = 21", optionA: "6", optionB: "7", optionC: "8", optionD: "9", correct: "option_b" },
        { text: "Периметр прямоугольника со сторонами 5 и 8 см равен", optionA: "26 см", optionB: "40 см", optionC: "13 см", optionD: "30 см", correct: "option_a" },
      ],
      "Чтение и понимание текста": [
        { text: "Абзац — это", optionA: "отдельное слово", optionB: "часть текста с единой мыслью", optionC: "заголовок текста", optionD: "знак пунктуации", correct: "option_b" },
        { text: "Антоним слова \"светлый\"", optionA: "яркий", optionB: "тёмный", optionC: "прозрачный", optionD: "цветной", correct: "option_b" },
      ],
      "Грамотность письма": [
        { text: "Укажите правильное написание", optionA: "чтобы", optionB: "что бы", optionC: "что-бы", optionD: "чтоб ы", correct: "option_a" },
        { text: "В каком слове пропущена буква \"и\": д...ректор", optionA: "е", optionB: "и", optionC: "я", optionD: "а", correct: "option_b" },
      ],
    },
  });

  const tsoomo4Rows = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "tsoomo4.json"), "utf-8")
  );
  await createTestFromRows({
    title: "ЦООМО — тест №4",
    description: "Полный пробный тест ЦООМО (Математика, Аналогия, Чтение, Грамматика)",
    sectionsData: [
      { title: "Математика", timeLimitMinutes: 90, maxScore: 50 },
      { title: "Аналогия", timeLimitMinutes: 30, maxScore: 63 },
      { title: "Чтение", timeLimitMinutes: 60, maxScore: 63 },
      { title: "Грамматика", timeLimitMinutes: 35, maxScore: 50 },
    ],
    rows: tsoomo4Rows,
  });

  const tochkaARows = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "tochkaA.json"), "utf-8")
  );
  await createOrExtendTestFromRows({
    title: "Точка А",
    description: "Пробный тест «Точка А» (Математика)",
    sectionsData: [{ title: "Математика", timeLimitMinutes: 90, maxScore: 63.75 }],
    rows: tochkaARows,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
