"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Group = { id: string; name: string };
type Test = { id: string; title: string };
type Homework = {
  id: string;
  title: string;
  type: "test" | "text";
  groupId: string;
  groupName: string;
  testId: string | null;
  testTitle: string | null;
  textBody: string | null;
  dueDate: string | null;
  order: number;
};

const emptyForm = { title: "", type: "test" as "test" | "text", groupId: "", testId: "", textBody: "", dueDate: "", order: "0" };

export default function AdminHomeworkPage() {
  const router = useRouter();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/homework").then((r) => r.json()).then(setHomework);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/groups").then((r) => r.json()).then(setGroups);
    fetch("/api/admin/tests")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTests(Array.isArray(data) ? data.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title })) : []));
  }, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role === "curator") router.replace("/admin/dashboard");
      });
  }, [router]);

  async function addHomework(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.groupId) {
      setError("Укажите название и группу");
      return;
    }
    if (form.type === "test" && !form.testId) {
      setError("Выберите тест");
      return;
    }
    if (form.type === "text" && !form.textBody.trim()) {
      setError("Укажите текст задания");
      return;
    }
    const res = await fetch("/api/admin/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        type: form.type,
        groupId: form.groupId,
        testId: form.type === "test" ? form.testId : null,
        textBody: form.type === "text" ? form.textBody.trim() : null,
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

  async function removeHomework(id: string) {
    if (!confirm("Удалить домашнее задание?")) return;
    await fetch(`/api/admin/homework/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Домашние задания</h1>
          <p className="text-sm text-slate-500">Тестовые или текстовые задания для групп учеников</p>
        </div>
      </div>

      <form onSubmit={addHomework} className="mt-5 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Название (например «Домашнее задание №4»)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <select
            value={form.groupId}
            onChange={(e) => setForm({ ...form, groupId: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">Выберите группу</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "test" | "text" })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="test">Тест</option>
            <option value="text">Текстовое задание</option>
          </select>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {form.type === "test" ? (
          <select
            value={form.testId}
            onChange={(e) => setForm({ ...form, testId: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">Выберите тест</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        ) : (
          <textarea
            value={form.textBody}
            onChange={(e) => setForm({ ...form, textBody: e.target.value })}
            placeholder="Текст задания (например «Прочитать параграф 5, решить №1-10 в тетради»)"
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
            Добавить задание
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {homework.map((h) => (
          <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{h.title}</p>
              <p className="truncate text-xs text-slate-400">
                {h.groupName} · {h.type === "test" ? `Тест: ${h.testTitle}` : h.textBody}
                {h.dueDate ? ` · до ${new Date(h.dueDate).toLocaleDateString("ru-RU")}` : ""}
              </p>
            </div>
            <button onClick={() => removeHomework(h.id)} className="flex-none text-sm font-medium text-red-600 hover:underline">
              Удалить
            </button>
          </div>
        ))}
        {homework.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
            Домашних заданий пока нет
          </p>
        )}
      </div>
    </div>
  );
}
