"use client";

import { useEffect, useState } from "react";

export default function GoalPage() {
  const [targetPercent, setTargetPercent] = useState<number | null>(null);
  const [input, setInput] = useState("80");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("ort_student_email");
    if (!email) return;

    fetch(`/api/student/goal?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { subjectId: string | null; targetPercent: number }[]) => {
        const overall = data.find((g) => g.subjectId === null);
        setTargetPercent(overall?.targetPercent ?? null);
        if (overall?.targetPercent) setInput(String(overall.targetPercent));
      })
      .catch(() => setError("Не удалось загрузить цель"));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const email = sessionStorage.getItem("ort_student_email");
    if (!email) return;

    const value = Number(input);
    if (!Number.isFinite(value) || value < 1 || value > 100) {
      setError("Введите число от 1 до 100");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/student/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, targetPercent: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setTargetPercent(data.targetPercent);
      setMessage("Цель сохранена");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Моя цель</h1>
      <p className="mt-1 text-sm text-slate-500">
        Задайте целевой процент правильных ответов — он будет виден на странице «Мой день»
      </p>

      <div className="mt-6 max-w-sm rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {targetPercent !== null && (
          <p className="mb-4 text-sm text-slate-500">
            Текущая цель: <span className="font-semibold text-emerald-700">{targetPercent}%</span>
          </p>
        )}

        <form onSubmit={save} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-700">Целевой результат, %</label>
          <input
            type="number"
            min={1}
            max={100}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:shadow-md disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить цель"}
          </button>
        </form>
      </div>
    </div>
  );
}
