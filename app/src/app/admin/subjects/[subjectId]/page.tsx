"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Subject = { id: string; track: string; name: string };
type Test = { id: string; title: string };
type Lesson = {
  id: string;
  title: string;
  videoUrl: string | null;
  description: string | null;
  durationMinutes: number | null;
  practiceType: "none" | "test" | "text";
  practiceTestId: string | null;
  practiceTestTitle: string | null;
  practiceText: string | null;
  dueDate: string | null;
  order: number;
  isActive: boolean;
};

const emptyForm = {
  title: "",
  videoUrl: "",
  description: "",
  durationMinutes: "",
  practiceType: "none" as "none" | "test" | "text",
  practiceTestId: "",
  practiceText: "",
  dueDate: "",
  order: "0",
};

export default function AdminSubjectLessonsPage() {
  const params = useParams<{ subjectId: string }>();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  function load() {
    fetch(`/api/admin/subjects/${params.subjectId}/lessons`).then((r) => r.json()).then(setLessons);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/subjects")
      .then((r) => r.json())
      .then((all: Subject[]) => setSubject(all.find((s) => s.id === params.subjectId) ?? null));
    fetch("/api/admin/tests")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTests(Array.isArray(data) ? data.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title })) : []));
  }, [params.subjectId]);

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Укажите название урока");
      return;
    }
    if (form.practiceType === "test" && !form.practiceTestId) {
      setError("Выберите тест для практики");
      return;
    }
    if (form.practiceType === "text" && !form.practiceText.trim()) {
      setError("Укажите текст практического задания");
      return;
    }
    const res = await fetch(`/api/admin/subjects/${params.subjectId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        videoUrl: form.videoUrl.trim() || null,
        description: form.description.trim() || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        practiceType: form.practiceType,
        practiceTestId: form.practiceType === "test" ? form.practiceTestId : null,
        practiceText: form.practiceType === "text" ? form.practiceText.trim() : null,
        dueDate: form.dueDate || null,
        order: Number(form.order) || 0,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id);
    setEditForm({
      title: lesson.title,
      videoUrl: lesson.videoUrl ?? "",
      description: lesson.description ?? "",
      durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : "",
      practiceType: lesson.practiceType,
      practiceTestId: lesson.practiceTestId ?? "",
      practiceText: lesson.practiceText ?? "",
      dueDate: lesson.dueDate ? lesson.dueDate.slice(0, 10) : "",
      order: String(lesson.order),
    });
  }

  async function saveEdit(lessonId: string) {
    setError("");
    const res = await fetch(`/api/admin/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title.trim(),
        videoUrl: editForm.videoUrl.trim() || null,
        description: editForm.description.trim() || null,
        durationMinutes: editForm.durationMinutes ? Number(editForm.durationMinutes) : null,
        practiceType: editForm.practiceType,
        practiceTestId: editForm.practiceType === "test" ? editForm.practiceTestId : null,
        practiceText: editForm.practiceType === "text" ? editForm.practiceText.trim() : null,
        dueDate: editForm.dueDate || null,
        order: Number(editForm.order) || 0,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Не удалось сохранить");
      return;
    }
    setEditingId(null);
    load();
  }

  async function toggleActive(lesson: Lesson) {
    await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !lesson.isActive }),
    });
    load();
  }

  async function removeLesson(lessonId: string) {
    if (!confirm("Удалить урок?")) return;
    await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={() => router.push("/admin/subjects")}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        К предметам
      </button>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{subject?.name ?? "Предмет"}</h1>
      <p className="text-sm text-slate-500">{subject?.track === "manas" ? "Манас" : "ОРТ"} · уроки этого предмета</p>

      <form onSubmit={addLesson} className="mt-5 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Название урока"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <input
            type="text"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            placeholder="Ссылка на видео (YouTube/Vimeo, необязательно)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <input
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            placeholder="Длительность, минут"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Описание (необязательно)"
          rows={2}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />

        <select
          value={form.practiceType}
          onChange={(e) => setForm({ ...form, practiceType: e.target.value as "none" | "test" | "text" })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="none">Без практики</option>
          <option value="test">Практика: тест</option>
          <option value="text">Практика: текстовое задание</option>
        </select>

        {form.practiceType === "test" && (
          <select
            value={form.practiceTestId}
            onChange={(e) => setForm({ ...form, practiceTestId: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">Выберите тест</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
        {form.practiceType === "text" && (
          <textarea
            value={form.practiceText}
            onChange={(e) => setForm({ ...form, practiceText: e.target.value })}
            placeholder="Текст практического задания"
            rows={2}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
        )}

        <div className="flex items-center gap-3">
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
            placeholder="Порядок"
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Добавить урок
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            {editingId === lesson.id ? (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <input
                    type="text"
                    value={editForm.videoUrl}
                    onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <input
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
                <select
                  value={editForm.practiceType}
                  onChange={(e) => setEditForm({ ...editForm, practiceType: e.target.value as "none" | "test" | "text" })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="none">Без практики</option>
                  <option value="test">Практика: тест</option>
                  <option value="text">Практика: текстовое задание</option>
                </select>
                {editForm.practiceType === "test" && (
                  <select
                    value={editForm.practiceTestId}
                    onChange={(e) => setEditForm({ ...editForm, practiceTestId: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="">Выберите тест</option>
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                )}
                {editForm.practiceType === "text" && (
                  <textarea
                    value={editForm.practiceText}
                    onChange={(e) => setEditForm({ ...editForm, practiceText: e.target.value })}
                    rows={2}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editForm.order}
                    onChange={(e) => setEditForm({ ...editForm, order: e.target.value })}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button onClick={() => saveEdit(lesson.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                    Сохранить
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{lesson.title}</p>
                    {!lesson.isActive && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Скрыт</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {[
                      lesson.durationMinutes ? `${lesson.durationMinutes} мин` : null,
                      lesson.practiceType === "test" ? `Практика: ${lesson.practiceTestTitle ?? "тест"}` : null,
                      lesson.practiceType === "text" ? "Практика: текст" : null,
                      lesson.dueDate ? `до ${new Date(lesson.dueDate).toLocaleDateString("ru-RU")}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3 text-sm">
                  <button onClick={() => startEdit(lesson)} className="font-medium text-emerald-600 hover:underline">
                    Изменить
                  </button>
                  <button onClick={() => toggleActive(lesson)} className="font-medium text-slate-500 hover:underline">
                    {lesson.isActive ? "Скрыть" : "Показать"}
                  </button>
                  <button onClick={() => removeLesson(lesson.id)} className="font-medium text-red-600 hover:underline">
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {lessons.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
            Уроков пока нет
          </p>
        )}
      </div>
    </div>
  );
}
