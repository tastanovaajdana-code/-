"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Question = {
  id: string;
  text: string;
  type: "single" | "multiple" | "text";
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionE: string | null;
  imageUrl: string | null;
  passage: { id: string; title: string | null; text: string | null; imageUrl: string | null } | null;
};

type SectionData = {
  finished: boolean;
  sectionTitle: string;
  timeLimitMinutes?: number;
  startedAt?: string;
  existingAnswers?: Record<string, string>;
  questions?: Question[];
};

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function SectionQuizPage() {
  const params = useParams<{ attemptId: string; sectionId: string }>();
  const router = useRouter();

  const [data, setData] = useState<SectionData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);
  const [studentFio, setStudentFio] = useState("");
  const [showPassage, setShowPassage] = useState(true);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await fetch(
        `/api/attempts/${params.attemptId}/sections/${params.sectionId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        }
      );
      router.push(`/attempt/${params.attemptId}`);
    } catch {
      setError("Не удалось отправить ответы");
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [answers, params.attemptId, params.sectionId, router]);

  useEffect(() => {
    setStudentFio(sessionStorage.getItem("ort_student_fio") ?? "");
    fetch(`/api/attempts/${params.attemptId}/sections/${params.sectionId}`)
      .then((res) => res.json())
      .then((result: SectionData) => {
        if (result.finished) {
          router.replace(`/attempt/${params.attemptId}`);
          return;
        }
        setData(result);
        setAnswers(result.existingAnswers ?? {});
        if (result.startedAt && result.timeLimitMinutes) {
          const deadline = new Date(result.startedAt).getTime() + result.timeLimitMinutes * 60000;
          setRemainingSeconds(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
        }
      });
  }, [params.attemptId, params.sectionId, router]);

  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      submit();
      return;
    }
    const timer = setTimeout(() => setRemainingSeconds((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(timer);
  }, [remainingSeconds, submit]);

  const currentPassageId = data?.questions?.[currentIndex]?.passage?.id ?? null;
  useEffect(() => {
    setShowPassage(true);
  }, [currentPassageId]);

  if (!data || !data.questions) {
    return <main className="flex flex-1 items-center justify-center text-white">Загрузка...</main>;
  }

  const questions = data.questions;
  const isUrgent = remainingSeconds !== null && remainingSeconds <= 60;
  const answeredCount = questions.filter((q) => (answers[q.id] ?? "").length > 0).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);
  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleFlag(questionId: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  function goNext() {
    if (isLast) {
      submit();
    } else {
      setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-3xl animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.push(`/attempt/${params.attemptId}`)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-white/90 transition hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Вернуться к разделам
          </button>
          {studentFio && (
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">
                {studentFio.trim().charAt(0).toUpperCase()}
              </span>
              {studentFio.split(" ")[0]}
            </span>
          )}
        </div>

        <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-sm">
          <svg
            aria-hidden
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-y-0 right-0 -z-0 h-full w-1/2 opacity-30"
          >
            <polygon points="0,200 0,120 60,60 120,130 190,40 260,120 330,70 400,110 400,200" fill="white" opacity={0.5} />
            <polygon points="0,200 0,150 90,100 180,160 270,90 360,150 400,130 400,200" fill="white" opacity={0.3} />
          </svg>
          <div className="relative">
            <h1 className="text-xl font-semibold">Ты готов?</h1>
            <p className="mt-1 max-w-md text-sm text-emerald-50/90">
              Каждый правильный ответ — это шаг ближе к твоей большой цели!
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium ring-1 ring-white/25">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Уверен(а) в отличном результате!
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Осталось времени
            </span>
            {remainingSeconds !== null && (
              <span
                className={`font-mono text-lg font-semibold ${isUrgent ? "animate-pulse text-red-600" : "text-emerald-700"}`}
              >
                {formatTime(remainingSeconds)}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-400">
              {answeredCount}/{questions.length}
            </span>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Вопросы</h2>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
            {questions.map((q, i) => {
              const answered = (answers[q.id] ?? "").length > 0;
              const isFlagged = flagged.has(q.id);
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                    isCurrent
                      ? "bg-emerald-600 text-white shadow-sm"
                      : answered
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  } ${isFlagged && !isCurrent ? "ring-2 ring-amber-400" : ""}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-600" /> Ответ дан
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-slate-200" /> Ответ не дан
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-white ring-2 ring-amber-400" /> Отмечено
            </span>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-white px-3 py-2 text-sm text-red-600 shadow-sm">{error}</p>
        )}

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              Вопрос {currentIndex + 1} / {questions.length}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 7h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {data.sectionTitle}
            </span>
          </div>

          {question.passage && (
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/60">
              <button
                type="button"
                onClick={() => setShowPassage((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-sky-700"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s4.332.477 5.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {question.passage.title || "Текст для чтения"}
                </span>
                <svg
                  className={`h-4 w-4 flex-none transition-transform ${showPassage ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPassage && (
                <div className="border-t border-sky-200 px-3 py-3">
                  {question.passage.imageUrl && (
                    <div className="mb-3 max-h-[70vh] overflow-y-auto rounded-lg ring-1 ring-slate-200">
                      <img src={question.passage.imageUrl} alt="" className="w-full" />
                    </div>
                  )}
                  {question.passage.text && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                      {question.passage.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-base font-medium text-slate-900">{question.text}</p>

          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt=""
              className="mt-3 max-h-80 w-full rounded-lg object-contain ring-1 ring-slate-200"
            />
          )}

          {question.type === "text" ? (
            <input
              type="text"
              value={answers[question.id] ?? ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Введите ответ"
            />
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {(["A", "B", "C", "D", "E"] as const).map((letter) => {
                const optionKey = `option${letter}` as keyof Question;
                const optionText = question[optionKey];
                if (!optionText) return null;
                const value = `option_${letter.toLowerCase()}`;
                const checked =
                  question.type === "multiple"
                    ? (answers[question.id] ?? "").split(",").includes(value)
                    : answers[question.id] === value;

                return (
                  <label
                    key={letter}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                      checked
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                        checked ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                      }`}
                    >
                      {checked && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <input
                      type={question.type === "multiple" ? "checkbox" : "radio"}
                      name={question.id}
                      checked={checked}
                      className="sr-only"
                      onChange={() => {
                        if (question.type === "multiple") {
                          const current = new Set(
                            (answers[question.id] ?? "").split(",").filter(Boolean)
                          );
                          if (current.has(value)) current.delete(value);
                          else current.add(value);
                          setAnswer(question.id, Array.from(current).join(","));
                        } else {
                          setAnswer(question.id, value);
                        }
                      }}
                    />
                    <span className="font-medium">{letter})</span>
                    <span>{optionText as string}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              onClick={() => toggleFlag(question.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                flagged.has(question.id) ? "text-amber-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <svg
                className="h-4 w-4"
                fill={flagged.has(question.id) ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a1 1 0 01.8 1.6L15 9l2.8 4.4A1 1 0 0117 15H7a2 2 0 00-2 2V5z" />
              </svg>
              Отметить
            </button>
            <button
              onClick={goNext}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:shadow-md hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-60"
            >
              {isLast ? (submitting ? "Отправка..." : "Завершить раздел") : "Следующий вопрос"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
