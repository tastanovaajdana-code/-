"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type HomeworkItem = {
  id: string;
  title: string;
  type: "test" | "text";
  dueDate: string | null;
  completed: boolean;
  testId?: string | null;
  testTitle?: string | null;
  attemptId?: string | null;
  textBody?: string | null;
};

export default function HomeworkPage() {
  const router = useRouter();
  const [items, setItems] = useState<HomeworkItem[] | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  function load() {
    const email = sessionStorage.getItem("ort_student_email") || "";
    const group = sessionStorage.getItem("ort_student_group") || "";
    fetch(`/api/homework?group=${encodeURIComponent(group)}&email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setItems)
      .catch(() => setError("Не удалось загрузить домашние задания"));
  }

  useEffect(load, []);

  async function startTestHomework(item: HomeworkItem) {
    if (item.attemptId) {
      router.push(`/attempt/${item.attemptId}`);
      return;
    }
    setStarting(item.id);
    setError("");
    try {
      const fio = sessionStorage.getItem("ort_student_fio");
      const email = sessionStorage.getItem("ort_student_email");
      const group = sessionStorage.getItem("ort_student_group");
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fio, email, group, testId: item.testId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      router.push(`/attempt/${data.attemptId}`);
    } catch (e) {
      setError((e as Error).message);
      setStarting(null);
    }
  }

  async function markComplete(homeworkId: string) {
    const email = sessionStorage.getItem("ort_student_email") || "";
    await fetch(`/api/homework/${homeworkId}/complete`, {
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

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Домашние задания</h1>
      <p className="mt-1 text-sm text-slate-500">Задания для вашей группы</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white px-4 py-8 text-center text-slate-400 shadow-sm ring-1 ring-slate-200">
          Домашних заданий пока нет
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium text-slate-900">{item.title}</h2>
                    {item.completed && (
                      <span className="flex-none rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Выполнено
                      </span>
                    )}
                  </div>
                  {item.type === "test" && item.testTitle && (
                    <p className="mt-0.5 text-xs text-slate-400">Тест: {item.testTitle}</p>
                  )}
                  {item.type === "text" && item.textBody && (
                    <p className="mt-1 text-sm text-slate-600">{item.textBody}</p>
                  )}
                  {item.dueDate && (
                    <p className="mt-1 text-xs text-slate-400">
                      Срок: {new Date(item.dueDate).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                </div>

                {item.type === "test" ? (
                  <button
                    onClick={() => startTestHomework(item)}
                    disabled={starting !== null || item.completed}
                    className="flex-none rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {item.completed ? "Завершено" : item.attemptId ? "Продолжить" : "Начать"}
                  </button>
                ) : (
                  !item.completed && (
                    <button
                      onClick={() => markComplete(item.id)}
                      className="flex-none rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      Отметить выполненным
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
