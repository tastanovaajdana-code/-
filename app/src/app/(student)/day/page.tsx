"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TrackSummary = {
  totalLessons: number;
  watchedLessons: number;
  nextItem: {
    subjectId: string;
    subjectName: string;
    lessonTitle: string;
    durationMinutes: number | null;
    dueDate: string | null;
    kind: "video" | "practice";
  } | null;
};

type DayData = { ort: TrackSummary; manas: TrackSummary };

export default function DayPage() {
  const router = useRouter();
  const [data, setData] = useState<DayData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("ort_student_email") || "";
    fetch(`/api/student/day?email=${encodeURIComponent(email)}`)
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

  const todayItems = [
    data.ort.nextItem && { ...data.ort.nextItem, track: "ort" as const },
    data.manas.nextItem && { ...data.manas.nextItem, track: "manas" as const },
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));

  const totalMinutes = todayItems.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0);

  function trackCard(summary: TrackSummary, label: string, tag: string, basePath: string) {
    const percent = summary.totalLessons > 0 ? Math.round((summary.watchedLessons / summary.totalLessons) * 100) : 0;
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{tag}</span>
        <h2 className="mt-3 text-lg font-semibold text-slate-900">
          {summary.nextItem ? `Продолжи подготовку` : label}
        </h2>
        {summary.nextItem && (
          <p className="mt-1 text-sm text-slate-500">
            {summary.nextItem.subjectName} · {summary.nextItem.lessonTitle}
          </p>
        )}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {summary.watchedLessons} из {summary.totalLessons} уроков пройдено
        </p>
        <button
          onClick={() => router.push(summary.nextItem ? `${basePath}/${summary.nextItem.subjectId}` : basePath)}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          {summary.nextItem ? "Продолжить урок" : "Открыть предметы"}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Твой учебный день</h1>
      <p className="mt-1 text-sm text-slate-500">ОРТ и Манас — один план подготовки</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {trackCard(data.ort, "Подготовка к ОРТ", "ОРТ / ЖРТ", "/ort")}
        {trackCard(data.manas, "Экзамен Манаса", "Экзамен Манаса", "/manas")}
      </div>

      {todayItems.length > 0 && (
        <div className="mt-4 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-sm font-medium text-slate-900">
              Сегодня {totalMinutes > 0 && `· около ${totalMinutes} минут`}
            </p>
          </div>
          {todayItems.map((item, i) => (
            <div
              key={`${item.track}-${item.subjectId}`}
              className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t border-slate-100" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {item.track === "ort" ? "ОРТ" : "Манас"}
                </span>
                <p className="mt-1 font-medium text-slate-900">
                  {item.subjectName}: {item.kind === "video" ? "видеоурок и практика" : "домашнее задание"}
                </p>
                <p className="text-xs text-slate-400">
                  {[
                    item.durationMinutes ? `${item.durationMinutes} минут` : null,
                    item.dueDate ? `до ${new Date(item.dueDate).toLocaleDateString("ru-RU")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                onClick={() => router.push(item.track === "ort" ? `/ort/${item.subjectId}` : `/manas/${item.subjectId}`)}
                className="flex-none rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                {item.kind === "video" ? "К уроку" : "Открыть"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
