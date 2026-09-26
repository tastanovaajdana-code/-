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
import { StudentNav } from "@/components/StudentNav";

type AttemptStat = {
  attemptId: string;
  testTitle: string;
  finishedAt: string;
  totalScore: number;
  maxScore: number;
  percent: number;
  sections: { title: string; score: number; maxScore: number; percent: number }[];
};

type StatsData = {
  attempts: AttemptStat[];
  sectionAverages: { title: string; averagePercent: number }[];
};

export default function StatsPage() {
  const router = useRouter();
  const [fio, setFio] = useState("");
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedFio = sessionStorage.getItem("ort_student_fio");
    const email = sessionStorage.getItem("ort_student_email");
    if (!storedFio || !email) {
      router.replace("/");
      return;
    }
    setFio(storedFio);

    fetch(`/api/student/stats?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Не удалось загрузить статистику"));
  }, [router]);

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

  const lineData = data.attempts.map((a) => ({
    name: new Date(a.finishedAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
    Балл: a.percent,
  }));

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <StudentNav fio={fio} />
      <div className="w-full max-w-2xl animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-white">Моя статистика</h1>
        <p className="mt-1 text-sm text-emerald-50/80">Прогресс по всем пройденным тестам</p>

        {data.attempts.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white/10 px-4 py-6 text-center text-emerald-50 ring-1 ring-white/20">
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
                .map((a) => (
                  <div key={a.attemptId} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{a.testTitle}</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {a.totalScore} / {a.maxScore} ({a.percent}%)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(a.finishedAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
