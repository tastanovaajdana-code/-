"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DayData = {
  goalPercent: number | null;
  lastPercent: number | null;
  weeklyPlan: { completed: number; total: number };
  nextVideo: { id: string; title: string; durationMinutes: number | null; watched: boolean } | null;
  nextHomework: { id: string; title: string; type: "test" | "text"; completed: boolean } | null;
  weakestSectionTitle: string | null;
  hasAttempts: boolean;
};

export default function DayPage() {
  const [data, setData] = useState<DayData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("ort_student_email") || "";
    const group = sessionStorage.getItem("ort_student_group") || "";
    if (!email) return;

    fetch(`/api/student/day?email=${encodeURIComponent(email)}&group=${encodeURIComponent(group)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Не удалось загрузить план на сегодня"));
  }, []);

  if (error) {
    return <p className="rounded-lg bg-white px-4 py-3 text-red-600 shadow-sm ring-1 ring-slate-200">{error}</p>;
  }

  if (!data) {
    return <p className="text-slate-500">Загрузка...</p>;
  }

  const planPercent = data.weeklyPlan.total > 0 ? Math.round((data.weeklyPlan.completed / data.weeklyPlan.total) * 100) : 0;

  const tasks: { key: string; title: string; subtitle: string; action: string; href: string }[] = [];
  if (data.nextVideo) {
    tasks.push({
      key: "video",
      title: data.nextVideo.title,
      subtitle: ["Видеоурок", data.nextVideo.durationMinutes ? `${data.nextVideo.durationMinutes} минут` : null].filter(Boolean).join(" · "),
      action: "Смотреть",
      href: "/videos",
    });
  }
  if (data.nextHomework) {
    tasks.push({
      key: "homework",
      title: data.nextHomework.title,
      subtitle: data.nextHomework.type === "test" ? "Домашний тест" : "Домашнее задание",
      action: "Открыть",
      href: "/homework",
    });
  }
  if (data.weakestSectionTitle) {
    tasks.push({
      key: "review",
      title: "Повтори ошибки",
      subtitle: data.weakestSectionTitle,
      action: "К практике",
      href: "/stats",
    });
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Твой план на сегодня</h1>
      <p className="mt-1 text-sm text-slate-500">Один урок, практика и работа над ошибками.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Недельный план</p>
          {data.weeklyPlan.total > 0 ? (
            <>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {data.weeklyPlan.completed} из {data.weeklyPlan.total}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
                  style={{ width: `${planPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">Учебных занятий выполнено</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Пока нет видеоуроков или заданий</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Точность</p>
          {data.hasAttempts || data.goalPercent ? (
            <>
              <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-slate-900">
                {data.lastPercent !== null ? `${data.lastPercent}%` : "—"}
                <span className="text-slate-300">→</span>
                {data.goalPercent !== null ? `${data.goalPercent}%` : "—"}
              </p>
              <p className="mt-2 text-xs text-slate-400">Последний тест → цель</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Пройдите тест и задайте цель</p>
          )}
          <Link href="/goal" className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline">
            {data.goalPercent !== null ? "Изменить цель" : "Задать цель"}
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {tasks.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">На сегодня всё выполнено 🎉</p>
        ) : (
          tasks.map((task, i) => (
            <div
              key={task.key}
              className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t border-slate-100" : ""}`}
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="text-sm text-slate-400">{task.subtitle}</p>
              </div>
              <Link
                href={task.href}
                className="flex-none rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                {task.action}
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
