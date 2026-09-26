"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type HomeworkItem = {
  lessonId: string;
  title: string;
  track: "ort" | "manas";
  subjectName: string;
  practiceType: "test" | "text";
  practiceTestId: string | null;
  dueDate: string | null;
  status: "not_started" | "in_progress" | "done";
  attemptId: string | null;
};

const statusLabel: Record<HomeworkItem["status"], string> = {
  not_started: "Не начато",
  in_progress: "В процессе",
  done: "Выполнено",
};
const statusColor: Record<HomeworkItem["status"], string> = {
  not_started: "bg-slate-100 text-slate-500",
  in_progress: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

export default function HomeworkPage() {
  const router = useRouter();
  const [items, setItems] = useState<HomeworkItem[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"all" | "ort" | "manas">("all");
  const [starting, setStarting] = useState<string | null>(null);

  function load() {
    const email = sessionStorage.getItem("ort_student_email") || "";
    fetch(`/api/homework?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setError("Не удалось загрузить домашние задания"));
  }

  useEffect(load, []);

  async function startTestPractice(item: HomeworkItem) {
    if (item.attemptId) {
      router.push(`/attempt/${item.attemptId}`);
      return;
    }
    setStarting(item.lessonId);
    setError("");
    try {
      const fio = sessionStorage.getItem("ort_student_fio");
      const email = sessionStorage.getItem("ort_student_email");
      const group = sessionStorage.getItem("ort_student_group");
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fio, email, group, testId: item.practiceTestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      router.push(`/attempt/${data.attemptId}`);
    } catch (e) {
      setError((e as Error).message);
      setStarting(null);
    }
  }

  async function markDone(lessonId: string) {
    const email = sessionStorage.getItem("ort_student_email") || "";
    await fetch(`/api/lessons/${lessonId}/practice-complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    load();
  }

  if (error) {
    return <p className="rounded-lg bg-white px-4 py-3 text-red-600 shadow-sm ring-1 ring-slate-200">{error}</p>;
  }
  if (items === null) {
    return <p className="text-slate-500">Загрузка...</p>;
  }

  const visible = items.filter((i) => tab === "all" || i.track === tab);

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Домашние задания</h1>
      <p className="mt-1 text-sm text-slate-500">Задания по обоим направлениям в одном месте</p>

      <div className="mt-5 flex gap-2">
        {(["all", "ort", "manas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t ? "bg-emerald-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {t === "all" ? "Все" : t === "ort" ? "ОРТ" : "Манас"}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {visible.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Заданий пока нет</p>
        ) : (
          visible.map((item, i) => (
            <div
              key={item.lessonId}
              className={`flex items-center justify-between gap-3 px-5 py-4 ${i > 0 ? "border-t border-slate-100" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {item.track === "ort" ? "ОРТ" : "Манас"} · {item.subjectName}
                </span>
                <p className="mt-1 font-medium text-slate-900">{item.title}</p>
                {item.dueDate && (
                  <p className="text-xs text-slate-400">До {new Date(item.dueDate).toLocaleDateString("ru-RU")}</p>
                )}
              </div>
              <div className="flex flex-none flex-col items-end gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[item.status]}`}>
                  {statusLabel[item.status]}
                </span>
                {item.practiceType === "test" ? (
                  <button
                    onClick={() => startTestPractice(item)}
                    disabled={starting !== null || item.status === "done"}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {item.status === "done" ? "Открыть" : item.status === "in_progress" ? "Продолжить" : "Начать"}
                  </button>
                ) : (
                  item.status !== "done" && (
                    <button
                      onClick={() => markDone(item.lessonId)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      Отметить
                    </button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
