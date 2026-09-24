"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ReviewQuestion = {
  id: string;
  text: string;
  type: "single" | "multiple" | "text";
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  optionE: string | null;
  imageUrl: string | null;
  correctAnswer: string;
  explanation: string | null;
  points: number;
  givenAnswer: string;
  isCorrect: boolean;
};

type ReviewData = {
  sectionTitle: string;
  correctCount: number;
  totalQuestions: number;
  score: number;
  questions: ReviewQuestion[];
};

function splitSet(value: string): Set<string> {
  return new Set(
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export default function SectionReviewPage() {
  const params = useParams<{ attemptId: string; sectionId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/attempts/${params.attemptId}/sections/${params.sectionId}/review`)
      .then((res) => res.json())
      .then((result) => {
        if (result.error) setError(result.error);
        else setData(result);
      });
  }, [params.attemptId, params.sectionId]);

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="rounded-xl bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push(`/attempt/${params.attemptId}/results`)}
            className="mt-3 text-sm text-emerald-600 hover:underline"
          >
            ← Вернуться к результатам
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="flex flex-1 items-center justify-center text-white">Загрузка...</main>;
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <button
          onClick={() => router.push(`/attempt/${params.attemptId}/results`)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-white/90 transition hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Вернуться к результатам
        </button>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div>
            <h1 className="font-medium text-slate-900">{data.sectionTitle}</h1>
            <p className="text-sm text-slate-500">
              Правильных ответов: {data.correctCount} из {data.totalQuestions}
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
            {data.score} балл(ов)
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {data.questions.map((question, index) => {
            const correctSet = splitSet(question.correctAnswer);
            const givenSet = splitSet(question.givenAnswer);
            const answered = givenSet.size > 0;

            return (
              <div
                key={question.id}
                className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${
                  question.isCorrect ? "ring-emerald-200" : "ring-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                      question.isCorrect ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {question.isCorrect ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {index + 1}. {question.text}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{question.points} балл(ов)</p>
                  </div>
                </div>

                {question.imageUrl && (
                  <img
                    src={question.imageUrl}
                    alt=""
                    className="mt-3 max-h-80 w-full rounded-lg object-contain ring-1 ring-slate-200"
                  />
                )}

                {question.type === "text" ? (
                  <div className="mt-3 flex flex-col gap-2 pl-9 text-sm">
                    <div className={`rounded-lg border px-3 py-2 ${
                      question.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"
                    }`}>
                      <span className="text-xs text-slate-500">Ваш ответ: </span>
                      {answered ? question.givenAnswer : <span className="italic text-slate-400">не отвечено</span>}
                    </div>
                    {!question.isCorrect && (
                      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2">
                        <span className="text-xs text-slate-500">Правильный ответ: </span>
                        {question.correctAnswer.replaceAll("|", " / ")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 pl-9">
                    {(["A", "B", "C", "D", "E"] as const).map((letter) => {
                      const optionKey = `option${letter}` as keyof ReviewQuestion;
                      const optionText = question[optionKey];
                      if (!optionText) return null;
                      const value = `option_${letter.toLowerCase()}`;
                      const isCorrectOption = correctSet.has(value);
                      const isGivenOption = givenSet.has(value);

                      let style = "border-slate-200";
                      if (isCorrectOption) style = "border-emerald-400 bg-emerald-50 text-emerald-900";
                      else if (isGivenOption) style = "border-red-400 bg-red-50 text-red-900";

                      return (
                        <div key={letter} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${style}`}>
                          <span
                            className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                              isCorrectOption
                                ? "border-emerald-600 bg-emerald-600"
                                : isGivenOption
                                ? "border-red-500 bg-red-500"
                                : "border-slate-300"
                            }`}
                          >
                            {(isCorrectOption || isGivenOption) && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="font-medium">{letter})</span>
                          <span>{optionText as string}</span>
                          {isGivenOption && !isCorrectOption && (
                            <span className="ml-auto text-xs font-medium text-red-500">ваш ответ</span>
                          )}
                          {isCorrectOption && (
                            <span className="ml-auto text-xs font-medium text-emerald-600">правильно</span>
                          )}
                        </div>
                      );
                    })}
                    {!answered && (
                      <p className="text-xs italic text-slate-400">Вы не ответили на этот вопрос</p>
                    )}
                  </div>
                )}

                {question.explanation && (
                  <div className="mt-3 ml-9 flex gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
                    <svg className="mt-0.5 h-4 w-4 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{question.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
