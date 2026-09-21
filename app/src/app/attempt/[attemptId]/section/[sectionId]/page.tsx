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
    return <main className="flex flex-1 items-center justify-center">Загрузка...</main>;
  }

  const isUrgent = remainingSeconds !== null && remainingSeconds <= 60;

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="sticky top-4 z-10 mb-6 flex items-center justify-between rounded-xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200">
          <h1 className="font-medium text-slate-900">{data.sectionTitle}</h1>
          {remainingSeconds !== null && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-mono font-semibold ${
                isUrgent ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {formatTime(remainingSeconds)}
            </span>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="flex flex-col gap-4">
          {data.questions.map((question, index) => (
            <div key={question.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="font-medium text-slate-900">
                {index + 1}. {question.text}
              </p>

              {question.type === "text" ? (
                <input
                  type="text"
                  value={answers[question.id] ?? ""}
                  onChange={(e) => setAnswer(question.id, e.target.value)}
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Введите ответ"
                />
              ) : (
                <div className="mt-3 flex flex-col gap-2">
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
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <input
                          type={question.type === "multiple" ? "checkbox" : "radio"}
                          name={question.id}
                          checked={checked}
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
          ))}
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "Отправка..." : "Завершить раздел"}
        </button>
      </div>
    </main>
  );
}
