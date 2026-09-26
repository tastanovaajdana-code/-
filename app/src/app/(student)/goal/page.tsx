"use client";

import { useEffect, useState } from "react";

type Program = { id: string; name: string };
type Uni = { id: string; name: string; programs: Program[] };

type TrackGoalData = {
  targetScore: number | null;
  targetDate: string | null;
  universityId: string | null;
  programId: string | null;
  currentScore: number | null;
};

type TrackForm = {
  targetScore: string;
  targetDate: string;
  universityId: string;
  programId: string;
};

const emptyForm: TrackForm = { targetScore: "", targetDate: "", universityId: "", programId: "" };

export default function GoalPage() {
  const [universities, setUniversities] = useState<Uni[]>([]);
  const [ortCurrent, setOrtCurrent] = useState<number | null>(null);
  const [manasCurrent, setManasCurrent] = useState<number | null>(null);
  const [ortForm, setOrtForm] = useState<TrackForm>(emptyForm);
  const [manasForm, setManasForm] = useState<TrackForm>(emptyForm);
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const studentEmail = sessionStorage.getItem("ort_student_email") || "";
    setEmail(studentEmail);

    fetch("/api/universities").then((r) => r.json()).then(setUniversities);

    fetch(`/api/student/track-goals?email=${encodeURIComponent(studentEmail)}`)
      .then((r) => r.json())
      .then((data: { ort: TrackGoalData; manas: TrackGoalData }) => {
        setOrtCurrent(data.ort.currentScore);
        setManasCurrent(data.manas.currentScore);
        setOrtForm({
          targetScore: data.ort.targetScore !== null ? String(data.ort.targetScore) : "",
          targetDate: data.ort.targetDate ? data.ort.targetDate.slice(0, 10) : "",
          universityId: data.ort.universityId ?? "",
          programId: data.ort.programId ?? "",
        });
        setManasForm({
          targetScore: data.manas.targetScore !== null ? String(data.manas.targetScore) : "",
          targetDate: data.manas.targetDate ? data.manas.targetDate.slice(0, 10) : "",
          universityId: data.manas.universityId ?? "",
          programId: data.manas.programId ?? "",
        });
      });

    fetch(`/api/student/weekly-plan?email=${encodeURIComponent(studentEmail)}`)
      .then((r) => r.json())
      .then((data) => setHoursPerWeek(data.hoursPerWeek !== null ? String(data.hoursPerWeek) : ""));
  }, []);

  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      for (const [track, form] of [
        ["ort", ortForm],
        ["manas", manasForm],
      ] as const) {
        await fetch("/api/student/track-goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            track,
            targetScore: form.targetScore || null,
            targetDate: form.targetDate || null,
            universityId: form.universityId || null,
            programId: form.programId || null,
          }),
        });
      }
      if (hoursPerWeek) {
        const res = await fetch("/api/student/weekly-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, hoursPerWeek: Number(hoursPerWeek) }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Ошибка");
        }
      }
      setMessage("Цели сохранены");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function trackCard(
    tag: string,
    form: TrackForm,
    setForm: (f: TrackForm) => void,
    currentScore: number | null
  ) {
    const selectedUni = universities.find((u) => u.id === form.universityId);
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{tag}</span>

        <label className="mt-4 block text-sm font-medium text-slate-700">Желаемый балл</label>
        <input
          type="number"
          value={form.targetScore}
          onChange={(e) => setForm({ ...form, targetScore: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />

        <label className="mt-4 block text-sm font-medium text-slate-700">Мой срок подготовки</label>
        <input
          type="date"
          value={form.targetDate}
          onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />

        <label className="mt-4 block text-sm font-medium text-slate-700">Желаемый университет</label>
        <select
          value={form.universityId}
          onChange={(e) => setForm({ ...form, universityId: e.target.value, programId: "" })}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="">Не выбран</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        <label className="mt-4 block text-sm font-medium text-slate-700">Направление</label>
        <select
          value={form.programId}
          onChange={(e) => setForm({ ...form, programId: e.target.value })}
          disabled={!selectedUni}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
        >
          <option value="">Не выбрано</option>
          {selectedUni?.programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <p className="mt-4 text-sm text-slate-500">
          Текущий балл: {currentScore !== null ? <span className="font-semibold text-emerald-700">{currentScore}</span> : "нет сопоставимой оценки"}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Мои цели</h1>
      <p className="mt-1 text-sm text-slate-500">Две цели по экзаменам и общий план нагрузки</p>

      <form onSubmit={saveAll}>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {trackCard("ОРТ", ortForm, setOrtForm, ortCurrent)}
          {trackCard("Манас", manasForm, setManasForm, manasCurrent)}
        </div>

        <div className="mt-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-medium text-slate-900">Недельная нагрузка</h2>
          <label className="mt-3 block text-sm font-medium text-slate-700">Часов на оба направления</label>
          <input
            type="number"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:shadow-md disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить цели"}
          </button>
        </div>
      </form>
    </div>
  );
}
