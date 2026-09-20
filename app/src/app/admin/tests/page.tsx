"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Test = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  sections: { id: string; title: string; questionCount: number }[];
};

export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/tests").then((r) => r.json()).then(setTests);
  }

  useEffect(load, []);

  async function createTest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return;
    const res = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }
    setTitle("");
    setDescription("");
    load();
  }

  async function toggleActive(test: Test) {
    await fetch(`/api/admin/tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !test.isActive }),
    });
    load();
  }

  async function removeTest(id: string) {
    if (!confirm("Удалить тест вместе с разделами и вопросами?")) return;
    await fetch(`/api/admin/tests/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Тесты</h1>

      <form onSubmit={createTest} className="mt-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название теста"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Создать тест
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {tests.map((test) => (
          <div key={test.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/admin/tests/${test.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                  {test.title}
                </Link>
                <p className="text-xs text-slate-400">
                  {test.sections.length} раздел(ов) ·{" "}
                  {test.sections.reduce((sum, s) => sum + s.questionCount, 0)} вопросов
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(test)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    test.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {test.isActive ? "Активен" : "Отключён"}
                </button>
                <button onClick={() => removeTest(test.id)} className="text-sm text-red-600 hover:text-red-800">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
        {tests.length === 0 && <p className="text-slate-400">Тестов пока нет</p>}
      </div>
    </div>
  );
}
