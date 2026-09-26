"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; name: string };
type Goal = { subjectId: string | null; subjectName: string | null; targetPercent: number };

export default function GoalPage() {
  const [ortSubjects, setOrtSubjects] = useState<Subject[]>([]);
  const [manasSubjects, setManasSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<Map<string | null, number>>(new Map());
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const studentEmail = sessionStorage.getItem("ort_student_email") || "";
    setEmail(studentEmail);

    Promise.all([
      fetch(`/api/subjects?track=ort&email=${encodeURIComponent(studentEmail)}`).then((r) => r.json()),
      fetch(`/api/subjects?track=manas&email=${encodeURIComponent(studentEmail)}`).then((r) => r.json()),
      fetch(`/api/student/goal?email=${encodeURIComponent(studentEmail)}`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([ort, manas, goalList]: [Subject[], Subject[], Goal[]]) => {
      setOrtSubjects(ort);
      setManasSubjects(manas);
      const map = new Map<string | null, number>();
      const inputMap: Record<string, string> = {};
      for (const g of goalList) {
        map.set(g.subjectId, g.targetPercent);
        inputMap[g.subjectId ?? "overall"] = String(g.targetPercent);
      }
      setGoals(map);
      setInputs(inputMap);
    });
  }, []);

  async function save(subjectId: string | null) {
    setError("");
    setMessage("");
    const key = subjectId ?? "overall";
    const value = Number(inputs[key]);
    if (!Number.isFinite(value) || value < 1 || value > 100) {
      setError("Введите число от 1 до 100");
      return;
    }
    try {
      const res = await fetch("/api/student/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subjectId, targetPercent: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setGoals((prev) => new Map(prev).set(subjectId, data.targetPercent));
      setMessage("Цель сохранена");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function row(subjectId: string | null, label: string) {
    const key = subjectId ?? "overall";
    return (
      <div key={key} className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{label}</p>
          {goals.has(subjectId) && (
            <p className="text-xs text-slate-400">Текущая цель: {goals.get(subjectId)}%</p>
          )}
        </div>
        <input
          type="number"
          min={1}
          max={100}
          value={inputs[key] ?? ""}
          onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
          placeholder="%"
          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <button
          onClick={() => save(subjectId)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Сохранить
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Мои цели</h1>
      <p className="mt-1 text-sm text-slate-500">Общая цель и цель по каждому предмету</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}

      <div className="mt-6 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {row(null, "Общая цель")}
      </div>

      {ortSubjects.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-medium text-slate-500">ОРТ</h2>
          <div className="mt-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            {ortSubjects.map((s) => row(s.id, s.name))}
          </div>
        </>
      )}

      {manasSubjects.length > 0 && (
        <>
          <h2 className="mt-6 text-sm font-medium text-slate-500">Манас</h2>
          <div className="mt-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            {manasSubjects.map((s) => row(s.id, s.name))}
          </div>
        </>
      )}
    </div>
  );
}
