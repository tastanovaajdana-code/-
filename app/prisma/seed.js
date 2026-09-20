const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

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

  const groupNames = ["11-А", "11-Б", "11-В"];
  for (const name of groupNames) {
    await prisma.group.upsert({ where: { name }, update: {}, create: { name } });
  }

  const existingTest = await prisma.test.findFirst({ where: { title: "ОРТ — пробный тест №1" } });
  if (existingTest) {
    console.log("Пробный тест уже существует, пропускаем сидирование вопросов");
    return;
  }

  const test = await prisma.test.create({
    data: {
      title: "ОРТ — пробный тест №1",
      description: "Тренировочное тестирование по 4 разделам ОРТ",
      isActive: true,
    },
  });

  const sectionsData = [
    { title: "Аналогии", timeLimitMinutes: 20, maxScore: 25 },
    { title: "Математика", timeLimitMinutes: 30, maxScore: 25 },
    { title: "Чтение и понимание текста", timeLimitMinutes: 25, maxScore: 25 },
    { title: "Грамотность письма", timeLimitMinutes: 20, maxScore: 25 },
  ];

  const questionBank = {
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
  };

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

  console.log("Пробный тест с 4 разделами и вопросами создан");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
