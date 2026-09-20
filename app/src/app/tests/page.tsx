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
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">Выберите тест</h1>
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
              className="rounded-xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-400 disabled:opacity-60"
            >
              <h2 className="text-lg font-medium text-slate-900">{test.title}</h2>
              {test.description && (
                <p className="mt-1 text-sm text-slate-500">{test.description}</p>
              )}
              <p className="mt-2 text-xs text-slate-400">{test.sectionsCount} раздел(ов)</p>
              {starting === test.id && (
                <p className="mt-2 text-xs text-indigo-600">Начинаем тестирование...</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
