"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Test = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  sections: { id: string; title: string; questionCount: number }[];
};

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role === "curator") router.replace("/admin/dashboard");
      });
  }, [router]);

  function load() {
    fetch("/api/admin/tests").then((r) => (r.ok ? r.json() : [])).then(setTests);
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
    setError("");
    const res = await fetch(`/api/admin/tests/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не удалось удалить тест");
      return;
    }
    load();
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Тесты</h1>
          <p className="text-sm text-slate-500">Создавайте тесты и управляйте разделами и вопросами</p>
        </div>
      </div>

      <form
        onSubmit={createTest}
        className="mt-5 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название теста"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Описание (необязательно)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <button className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Создать тест
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {tests.map((test) => {
          const questionCount = test.sections.reduce((sum, s) => sum + s.questionCount, 0);
          return (
            <div
              key={test.id}
              className="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
            >
              <Link
                href={`/admin/tests/${test.id}`}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm transition group-hover:scale-105"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/tests/${test.id}`} className="font-medium text-slate-900 hover:text-emerald-600">
                  {test.title}
                </Link>
                <p className="text-xs text-slate-400">
                  {test.sections.length} раздел(ов) · {questionCount} вопросов
                </p>
              </div>
              <div className="flex flex-none items-center gap-2">
                <button
                  onClick={() => toggleActive(test)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                    test.isActive
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${test.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {test.isActive ? "Активен" : "Отключён"}
                </button>
                <button
                  onClick={() => removeTest(test.id)}
                  className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                  title="Удалить тест"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
        {tests.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="mt-3 text-sm text-slate-500">Тестов пока нет — создайте первый выше</p>
          </div>
        )}
      </div>
    </div>
  );
}
