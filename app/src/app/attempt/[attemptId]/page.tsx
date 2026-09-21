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

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">{attempt.test.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {attempt.studentFio} · Группа {attempt.group.name}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {attempt.sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div>
                <h2 className="font-medium text-slate-900">{section.title}</h2>
                <p className="text-xs text-slate-500">
                  {section.questionCount} вопрос(ов) · {section.timeLimitMinutes} мин
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[section.status]}`}>
                  {statusLabel[section.status]}
                </span>
                <button
                  onClick={() => router.push(`/attempt/${attempt.id}/section/${section.id}`)}
                  disabled={section.status === "done"}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {section.status === "done" ? "Готово" : section.status === "in_progress" ? "Продолжить" : "Начать"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {allDone && (
          <button
            onClick={() => router.push(`/attempt/${attempt.id}/results`)}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Посмотреть результаты
          </button>
        )}
      </div>
    </main>
  );
}
