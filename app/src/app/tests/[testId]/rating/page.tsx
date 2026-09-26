"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type RatingRow = {
  rank: number;
  studentFio: string;
  groupName: string;
  totalScore: number;
  isMe: boolean;
};

type RatingData = {
  testTitle: string;
  rows: RatingRow[];
};

export default function TestRatingPage() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const [data, setData] = useState<RatingData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("ort_student_email") || "";
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    fetch(`/api/tests/${params.testId}/rating${query}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Не удалось загрузить рейтинг"));
  }, [params.testId]);

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <p className="rounded-lg bg-white px-4 py-3 text-red-600 shadow-sm">{error}</p>
      </main>
    );
  }

  if (!data) {
    return <main className="flex flex-1 items-center justify-center text-white">Загрузка...</main>;
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-white/90 transition hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </button>

        <h1 className="mt-3 flex items-center gap-2 text-2xl font-semibold text-white">
          <svg className="h-6 w-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12M15.5 8.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"
            />
          </svg>
          Рейтинг: {data.testTitle}
        </h1>
        <p className="mt-1 text-sm text-emerald-50/80">По итоговому баллу среди всех, кто завершил тест</p>

        {data.rows.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white/10 px-4 py-6 text-center text-emerald-50 ring-1 ring-white/20">
            Пока никто не завершил этот тест
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-1.5">
            {data.rows.map((row) => (
              <div
                key={row.rank}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 ${
                  row.isMe ? "bg-amber-50 ring-2 ring-amber-400" : "bg-white ring-1 ring-slate-200"
                }`}
              >
                <div
                  className={`w-8 text-center text-lg font-semibold ${
                    row.rank <= 3 ? "text-amber-500" : "text-slate-400"
                  }`}
                >
                  {row.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {row.studentFio}
                    {row.isMe && <span className="ml-2 text-xs font-normal text-amber-600">(вы)</span>}
                  </p>
                  <p className="text-xs text-slate-400">{row.groupName}</p>
                </div>
                <div className="text-sm font-semibold text-emerald-700">{row.totalScore}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
