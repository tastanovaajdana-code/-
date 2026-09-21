"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type SectionSummary = {
  id: string;
  title: string;
  order: number;
  timeLimitMinutes: number;
  questionCount: number;
  status: "not_started" | "in_progress" | "done";
  correctCount: number;
  totalQuestions: number;
  score: number;
};

type AttemptDetail = {
  id: string;
  studentFio: string;
  group: { name: string };
  test: { title: string; description: string | null };
  totalScore: number;
  finishedAt: string | null;
  sections: SectionSummary[];
};

const statusLabel: Record<SectionSummary["status"], string> = {
  not_started: "Не начат",
  in_progress: "В процессе",
  done: "Завершён",
};

const statusColor: Record<SectionSummary["status"], string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

function StatusIcon({ status }: { status: SectionSummary["status"] }) {
  if (status === "done") {
    return (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "in_progress") {
    return (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="8" strokeDasharray="2 3" />
    </svg>
  );
}

export default function AttemptOverviewPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/attempts/${params.attemptId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setAttempt(data);
      });
  }, [params.attemptId]);

  if (error) {
    return <main className="flex flex-1 items-center justify-center text-red-600">{error}</main>;
  }
  if (!attempt) {
    return <main className="flex flex-1 items-center justify-center">Загрузка...</main>;
  }

  const allDone = attempt.sections.every((s) => s.status === "done");
  const doneCount = attempt.sections.filter((s) => s.status === "done").length;
  const progressPct = Math.round((doneCount / attempt.sections.length) * 100);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-slate-900">{attempt.test.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {attempt.studentFio} · Группа {attempt.group.name}
        </p>

        <div className="mt-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Прогресс прохождения</span>
            <span className="text-emerald-600">
              {doneCount} из {attempt.sections.length}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {attempt.sections.map((section, index) => (
            <div
              key={section.id}
              className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-semibold ${
                  section.status === "done"
                    ? "bg-emerald-600 text-white"
                    : section.status === "in_progress"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {section.status === "done" ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-slate-900">{section.title}</h2>
                <p className="text-xs text-slate-500">
                  {section.questionCount} вопрос(ов) · {section.timeLimitMinutes} мин
                </p>
              </div>
              <span
                className={`hidden items-center gap-1 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${statusColor[section.status]}`}
              >
                <StatusIcon status={section.status} />
                {statusLabel[section.status]}
              </span>
              <button
                onClick={() => router.push(`/attempt/${attempt.id}/section/${section.id}`)}
                disabled={section.status === "done"}
                className="flex-none rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {section.status === "done" ? "Готово" : section.status === "in_progress" ? "Продолжить" : "Начать"}
              </button>
            </div>
          ))}
        </div>

        {allDone && (
          <button
            onClick={() => router.push(`/attempt/${attempt.id}/results`)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-emerald-600/30 transition hover:shadow-md hover:shadow-emerald-600/40 active:scale-[0.99]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14"
              />
            </svg>
            Посмотреть результаты
          </button>
        )}
      </div>
    </main>
  );
}
