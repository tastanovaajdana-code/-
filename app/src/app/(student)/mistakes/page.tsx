"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MistakeGroup = {
  attemptId: string;
  sectionId: string;
  testTitle: string;
  sectionTitle: string;
  finishedAt: string;
  incorrectCount: number;
  totalQuestions: number;
};

export default function MistakesPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<MistakeGroup[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("ort_student_email") || "";
    fetch(`/api/student/mistakes?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setGroups)
      .catch(() => setError("Не удалось загрузить ошибки"));
  }, []);

  if (error) {
    return <p className="rounded-lg bg-white px-4 py-3 text-red-600 shadow-sm ring-1 ring-slate-200">{error}</p>;
  }
  if (groups === null) {
    return <p className="text-slate-500">Загрузка...</p>;
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Работа над ошибками</h1>
      <p className="mt-1 text-sm text-slate-500">Все неправильные ответы в одном месте</p>

      <div className="mt-6 flex flex-col gap-3">
        {groups.length === 0 ? (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
            Ошибок пока нет — отличная работа!
          </p>
        ) : (
          groups.map((g) => (
            <button
              key={`${g.attemptId}-${g.sectionId}`}
              onClick={() => router.push(`/attempt/${g.attemptId}/section/${g.sectionId}/review`)}
              className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{g.sectionTitle}</p>
                <p className="text-xs text-slate-400">
                  {g.testTitle} · {new Date(g.finishedAt).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <span className="flex-none rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                {g.incorrectCount} из {g.totalQuestions} неверно
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
