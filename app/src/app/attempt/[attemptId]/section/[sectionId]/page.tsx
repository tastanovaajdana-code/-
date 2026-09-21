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
  imageUrl: string | null;
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
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function SectionQuizPage() {
  const params = useParams<{ attemptId: string; sectionId: string }>();
  const router = useRouter();

  const [data, setData] = useState<SectionData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);

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

  if (!data || !data.questions) {
    return <main className="flex flex-1 items-center justify-center text-white">Загрузка...</main>;
  }

  const isUrgent = remainingSeconds !== null && remainingSeconds <= 60;
  const answeredCount = data.questions.filter((q) => (answers[q.id] ?? "").length > 0).length;
  const progressPct = Math.round((answeredCount / data.questions.length) * 100);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="sticky top-4 z-10 mb-6 rounded-xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200 backdrop-blur">
          <div className="flex items-center justify-between">
            <h1 className="font-medium text-slate-900">{data.sectionTitle}</h1>
            {remainingSeconds !== null && (
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-semibold ${
                  isUrgent ? "animate-pulse bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
              {answeredCount}/{data.questions.length}
            </span>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-white px-3 py-2 text-sm text-red-600 shadow-sm">{error}</p>
        )}

        <div className="flex flex-col gap-4">
          {data.questions.map((question, index) => {
            const isAnswered = (answers[question.id] ?? "").length > 0;
            return (
              <div
                key={question.id}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                      isAnswered ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p className="font-medium text-slate-900">{question.text}</p>
                </div>

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
                    className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="Введите ответ"
                  />
                ) : (
                  <div className="mt-3 flex flex-col gap-2 pl-9">
                    {(["A", "B", "C", "D"] as const).map((letter) => {
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
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                            checked
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                              : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${
                              checked ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                            }`}
                          >
                            {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
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
                          <span>{optionText as string}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-emerald-600/30 transition hover:shadow-md hover:shadow-emerald-600/40 active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Отправка..." : "Завершить раздел"}
        </button>
      </div>
    </main>
  );
}
