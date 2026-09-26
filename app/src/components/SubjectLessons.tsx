"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";

type Lesson = {
  id: string;
  title: string;
  videoUrl: string | null;
  description: string | null;
  durationMinutes: number | null;
  practiceType: "none" | "test" | "text";
  practiceTestId: string | null;
  practiceTestTitle: string | null;
  practiceText: string | null;
  dueDate: string | null;
  watched: boolean;
  practiceDone: boolean;
  attemptId: string | null;
};

type SubjectData = {
  subject: { id: string; name: string; track: string };
  lessons: Lesson[];
};

export function SubjectLessons({ subjectId, backHref }: { subjectId: string; backHref: string }) {
  const router = useRouter();
  const [data, setData] = useState<SubjectData | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  function load(emailValue: string) {
    fetch(`/api/subjects/${subjectId}?email=${encodeURIComponent(emailValue)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Не удалось загрузить предмет"));
  }

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("ort_student_email") || "";
    setEmail(storedEmail);
    load(storedEmail);
  }, [subjectId]);

  async function markWatched(lessonId: string) {
    if (!email) return;
    await fetch(`/api/lessons/${lessonId}/watch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    load(email);
  }

  async function markPracticeDone(lessonId: string) {
    if (!email) return;
    await fetch(`/api/lessons/${lessonId}/practice-complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    load(email);
  }

  async function startPracticeTest(lesson: Lesson) {
    if (lesson.attemptId) {
      router.push(`/attempt/${lesson.attemptId}`);
      return;
    }
    setStarting(lesson.id);
    try {
      const fio = sessionStorage.getItem("ort_student_fio");
      const studentEmail = sessionStorage.getItem("ort_student_email");
      const group = sessionStorage.getItem("ort_student_group");
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fio, email: studentEmail, group, testId: lesson.practiceTestId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Ошибка");
      router.push(`/attempt/${resData.attemptId}`);
    } catch (e) {
      setError((e as Error).message);
      setStarting(null);
    }
  }

  if (error) {
    return <p className="rounded-lg bg-white px-4 py-3 text-red-600 shadow-sm ring-1 ring-slate-200">{error}</p>;
  }

  if (!data) {
    return <p className="text-slate-500">Загрузка...</p>;
  }

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={() => router.push(backHref)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        К предметам
      </button>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{data.subject.name}</h1>
      <p className="text-sm text-slate-500">{data.lessons.length} урок(ов)</p>

      <div className="mt-6 flex flex-col gap-3">
        {data.lessons.map((lesson) => {
          const embedUrl = lesson.videoUrl ? getVideoEmbedUrl(lesson.videoUrl) : null;
          const isOpen = openId === lesson.id;
          return (
            <div key={lesson.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-slate-900">{lesson.title}</h2>
                    {lesson.watched && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Просмотрено</span>
                    )}
                    {lesson.practiceType !== "none" && lesson.practiceDone && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Практика выполнена</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {[
                      lesson.durationMinutes ? `${lesson.durationMinutes} минут` : null,
                      lesson.dueDate ? `до ${new Date(lesson.dueDate).toLocaleDateString("ru-RU")}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {lesson.description && <p className="mt-1 text-sm text-slate-500">{lesson.description}</p>}
                </div>
                <button
                  onClick={() => setOpenId(isOpen ? null : lesson.id)}
                  className="flex-none rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  {isOpen ? "Свернуть" : "Открыть"}
                </button>
              </div>

              {isOpen && (
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                  {lesson.videoUrl && (
                    <div>
                      {embedUrl ? (
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
                          <iframe
                            src={embedUrl}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:underline">
                          Открыть видео по ссылке →
                        </a>
                      )}
                      {!lesson.watched && (
                        <button onClick={() => markWatched(lesson.id)} className="mt-2 text-sm font-medium text-emerald-600 hover:underline">
                          Отметить как просмотренное
                        </button>
                      )}
                    </div>
                  )}

                  {lesson.practiceType === "test" && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-sm text-slate-700">Практика: {lesson.practiceTestTitle}</p>
                      <button
                        onClick={() => startPracticeTest(lesson)}
                        disabled={starting !== null || lesson.practiceDone}
                        className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {lesson.practiceDone ? "Завершено" : lesson.attemptId ? "Продолжить" : "Начать"}
                      </button>
                    </div>
                  )}
                  {lesson.practiceType === "text" && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-sm text-slate-700">{lesson.practiceText}</p>
                      {!lesson.practiceDone && (
                        <button
                          onClick={() => markPracticeDone(lesson.id)}
                          className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                        >
                          Отметить выполненным
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {data.lessons.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
            Уроков пока нет
          </p>
        )}
      </div>
    </div>
  );
}
