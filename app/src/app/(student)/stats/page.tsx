"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type AttemptStat = {
  attemptId: string;
  testTitle: string;
  finishedAt: string;
  totalScore: number;
  maxScore: number;
  percent: number;
  sections: { sectionId: string; title: string; score: number; maxScore: number; percent: number; finished: boolean }[];
};

type StatsData = {
  attempts: AttemptStat[];
  sectionAverages: { title: string; averagePercent: number }[];
};

export default function StatsPage() {
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const email = sessionStorage.getItem("ort_student_email");
    if (!email) return;

    fetch(`/api/student/stats?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Не удалось загрузить статистику"));
  }, []);

  if (error) {
    return <p className="rounded-lg bg-white px-4 py-3 text-red-600 shadow-sm ring-1 ring-slate-200">{error}</p>;
  }

  if (!data) {
    return <p className="text-slate-500">Загрузка...</p>;
  }

  const lineData = data.attempts.map((a) => ({
    name: new Date(a.finishedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
    Балл: a.percent,
  }));

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Моя статистика</h1>
      <p className="mt-1 text-sm text-slate-500">Прогресс по всем пройденным тестам</p>

      {data.attempts.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white px-4 py-6 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
          Вы ещё не завершили ни одного теста
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-900">Общий балл по попыткам (%)</div>
            <div className="mt-3" style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid stroke="#E4DFD0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#65697E" }} axisLine={{ stroke: "#E4DFD0" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#65697E" }} axisLine={{ stroke: "#E4DFD0" }} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Балл" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: "#CE9A3E" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-medium text-slate-900">Средний результат по разделам (%)</div>
            <div className="mt-3" style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={data.sectionAverages.map((s) => ({ name: s.title, Балл: s.averagePercent }))}>
                  <CartesianGrid stroke="#E4DFD0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#65697E" }} axisLine={{ stroke: "#E4DFD0" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#65697E" }} axisLine={{ stroke: "#E4DFD0" }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="Балл" fill="#CE9A3E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {data.attempts
              .slice()
              .reverse()
              .map((a) => {
                const isOpen = expandedId === a.attemptId;
                return (
                  <div key={a.attemptId} className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                    <button
                      onClick={() => setExpandedId(isOpen ? null : a.attemptId)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div>
                        <span className="font-medium text-slate-900">{a.testTitle}</span>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(a.finishedAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                          {a.totalScore} / {a.maxScore} ({a.percent}%)
                        </span>
                        <svg
                          className={`h-4 w-4 flex-none text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="flex flex-col gap-2 border-t border-slate-100 p-4 pt-3">
                        {a.sections.map((s) => (
                          <button
                            key={s.sectionId}
                            disabled={!s.finished}
                            onClick={() => router.push(`/attempt/${a.attemptId}/section/${s.sectionId}/review`)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                              s.finished
                                ? "cursor-pointer bg-slate-50 hover:bg-emerald-50"
                                : "cursor-default bg-slate-50 opacity-60"
                            }`}
                          >
                            <span className="text-slate-700">{s.title}</span>
                            <span className="flex items-center gap-2">
                              <span className="font-medium text-slate-600">
                                {s.finished ? `${s.score} / ${s.maxScore} (${s.percent}%)` : "не завершено"}
                              </span>
                              {s.finished && (
                                <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
