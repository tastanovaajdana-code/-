"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TestSummary = {
  id: string;
  title: string;
  description: string | null;
  sectionsCount: number;
};

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestSummary[] | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    const fio = sessionStorage.getItem("ort_student_fio");
    const group = sessionStorage.getItem("ort_student_group");
    if (!fio || !group) {
      router.replace("/");
      return;
    }

    fetch("/api/tests")
      .then((res) => res.json())
      .then((data: TestSummary[]) => setTests(data))
      .catch(() => setError("Не удалось загрузить список тестов"));
  }, [router]);

  async function startTest(testId: string) {
    setStarting(testId);
    setError("");
    try {
      const fio = sessionStorage.getItem("ort_student_fio");
      const group = sessionStorage.getItem("ort_student_group");
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fio, group, testId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      router.push(`/attempt/${data.attemptId}`);
    } catch (e) {
      setError((e as Error).message);
      setStarting(null);
    }
  }

  if (tests === null) {
    return <main className="flex flex-1 items-center justify-center">Загрузка...</main>;
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-slate-900">Выберите тест</h1>
        <p className="mt-1 text-sm text-slate-500">Доступные тестирования для вашей группы</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {tests.length === 0 && (
          <p className="mt-6 text-slate-500">Нет доступных тестов. Обратитесь к администратору.</p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {tests.map((test) => (
            <button
              key={test.id}
              onClick={() => startTest(test.id)}
              disabled={starting !== null}
              className="group flex items-center gap-4 rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-emerald-300 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-600/30 transition group-hover:scale-105">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-medium text-slate-900">{test.title}</h2>
                {test.description && (
                  <p className="mt-1 text-sm text-slate-500">{test.description}</p>
                )}
                <p className="mt-2 text-xs text-slate-400">{test.sectionsCount} раздел(ов)</p>
                {starting === test.id && (
                  <p className="mt-2 text-xs font-medium text-emerald-600">Начинаем тестирование...</p>
                )}
              </div>
              <svg
                className="h-5 w-5 flex-none text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
