"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  testId: string;
  testTitle: string;
  totalScore: number;
  finished: boolean;
  sections: SectionResult[];
};

function tierMessage(pct: number): string {
  if (pct >= 85) return "Отличный результат!";
  if (pct >= 60) return "Хороший результат!";
  if (pct >= 35) return "Есть куда расти";
  return "Стоит повторить материал";
}

function ScoreRing({ percent }: { percent: number }) {
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-[140px] w-[140px] items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-ring"
          style={
            {
              "--ring-full": circumference,
              "--ring-offset": offset,
            } as React.CSSProperties
          }
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-900">{percent}%</span>
        <span className="text-xs text-slate-400">правильных</span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();
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
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="rounded-lg bg-white px-4 py-3 text-red-600 shadow-sm">{error}</p>
      </main>
    );
  }
  if (!data) {
    return <main className="flex flex-1 items-center justify-center text-white">Загрузка...</main>;
  }

  const totalCorrect = data.sections.reduce((sum, s) => sum + s.correctCount, 0);
  const totalQuestions = data.sections.reduce((sum, s) => sum + s.totalQuestions, 0);
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-white">Результаты тестирования</h1>
        <p className="mt-1 text-sm text-emerald-50/80">
          {data.studentFio} · Группа {data.group} · {data.testTitle}
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:flex-row sm:justify-around sm:text-left">
          <ScoreRing percent={overallPct} />
          <div>
            <p className="text-lg font-semibold text-emerald-600">{tierMessage(overallPct)}</p>
            <p className="mt-1 text-sm text-slate-500">
              Правильно отвечено на {totalCorrect} из {totalQuestions} вопросов
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {data.sections.map((section) => {
            const pct =
              section.totalQuestions > 0
                ? Math.round((section.correctCount / section.totalQuestions) * 100)
                : 0;
            return (
              <button
                key={section.id}
                type="button"
                disabled={!section.finished}
                onClick={() => router.push(`/attempt/${params.attemptId}/section/${section.id}/review`)}
                className={`rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition ${
                  section.finished ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300" : "cursor-default opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-slate-900">{section.title}</h2>
                    <p className="text-sm text-slate-500">
                      Правильных ответов: {section.correctCount} из {section.totalQuestions}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {section.score} балл(ов)
                    </span>
                    {section.finished && (
                      <svg className="h-4 w-4 flex-none text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {section.finished && (
                  <p className="mt-2 text-xs font-medium text-emerald-600">Посмотреть разбор ответов →</p>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 p-5 text-white shadow-sm shadow-emerald-600/30">
          <span className="text-lg font-medium">Итоговый балл</span>
          <span className="text-3xl font-bold">{data.totalScore}</span>
        </div>

        {data.finished && (
          <button
            onClick={() => router.push(`/tests/${data.testId}/rating`)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12M15.5 8.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"
              />
            </svg>
            Посмотреть рейтинг по этому тесту
          </button>
        )}
      </div>
    </main>
  );
}
