# ОРТ Тестирование

Платформа для проведения тестирования по ОРТ (11 класс, Кыргызстан). Подробное
описание структуры и требований — в [`../docs/ORT-TEST-PLATFORM.md`](../docs/ORT-TEST-PLATFORM.md).

Стек: Next.js (App Router, TypeScript) + Prisma ORM + SQLite (для разработки) + Tailwind CSS.

## Запуск локально

```bash
npm install
cp .env.example .env      # при необходимости отредактируйте DATABASE_URL и ADMIN_SESSION_SECRET
npx prisma db push        # создаёт SQLite базу по схеме prisma/schema.prisma
npm run db:seed           # создаёт админа и пробный тест с 4 разделами
npm run dev                # http://localhost:3000
```

После сидирования доступен админ:

- Логин: `admin`
- Пароль: `admin123`

(задаются через переменные окружения `SEED_ADMIN_LOGIN` / `SEED_ADMIN_PASSWORD` при повторном запуске `npm run db:seed`).

## Структура

- `/` — форма ученика (ФИО + группа)
- `/tests` — выбор теста
- `/attempt/[attemptId]` — список разделов теста
- `/attempt/[attemptId]/section/[sectionId]` — прохождение раздела с таймером
- `/attempt/[attemptId]/results` — итоговая статистика ученика
- `/admin/login`, `/admin/dashboard`, `/admin/tests`, `/admin/groups` — панель администратора

## Импорт вопросов

В карточке теста в админке (`/admin/tests/[id]`) можно загрузить вопросы файлом `.xlsx`,
`.csv` или `.json` со столбцами:

```
section, question_text, type, option_a, option_b, option_c, option_d, correct_answer, points
```

- `type`: `single` | `multiple` | `text`
- `correct_answer`: `option_b` (один ответ), `option_a,option_c` (несколько) или произвольный текст
- `section` должен совпадать с названием существующего раздела теста
