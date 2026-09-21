"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type SectionResult = {
  id: string;
  title: string;
  correctCount: number;
  totalQuestions: number;
  score: number;
  finished: boolean;
};

type ResultsData = {
  studentFio: string;
  group: string;
  testTitle: string;
  totalScore: number;
  finished: boolean;
  sections: SectionResult[];
};

export default function ResultsPage() {
  const params = useParams<{ attemptId: string }>();
  const [data, setData] = useState<ResultsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/attempts/${params.attemptId}/results`)
      .then((res) => res.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else setData(result);
      });
  }, [params.attemptId]);

  if (error) {
    return <main className="flex flex-1 items-center justify-center text-red-600">{error}</main>;
  }
  if (!data) {
    return <main className="flex flex-1 items-center justify-center">Загрузка...</main>;
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">Результаты тестирования</h1>
        <p className="mt-1 text-sm text-slate-500">
          {data.studentFio} · Группа {data.group} · {data.testTitle}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {data.sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div>
                <h2 className="font-medium text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-500">
                  Правильных ответов: {section.correctCount} из {section.totalQuestions}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                {section.score} балл(ов)
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-600 p-5 text-white shadow-sm">
          <span className="text-lg font-medium">Итоговый балл</span>
          <span className="text-2xl font-bold">{data.totalScore}</span>
        </div>
      </div>
    </main>
  );
}
