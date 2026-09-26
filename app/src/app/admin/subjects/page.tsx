"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Subject = { id: string; track: string; name: string; order: number; lessonsCount: number };

export default function AdminSubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [track, setTrack] = useState<"ort" | "manas">("ort");
  const [name, setName] = useState("");
  const [order, setOrder] = useState("0");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/subjects").then((r) => r.json()).then(setSubjects);
  }

  useEffect(load, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role === "curator") router.replace("/admin/dashboard");
      });
  }, [router]);

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track, name: name.trim(), order: Number(order) || 0 }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }
    setName("");
    load();
  }

  async function removeSubject(id: string) {
    if (!confirm("Удалить предмет вместе со всеми его уроками?")) return;
    await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
    load();
  }

  const visible = subjects.filter((s) => s.track === track);

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s4.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Предметы</h1>
          <p className="text-sm text-slate-500">Предметы и уроки по трекам ОРТ и Манас</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={() => setTrack("ort")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            track === "ort" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
          }`}
        >
          ОРТ
        </button>
        <button
          onClick={() => setTrack("manas")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            track === "manas" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
          }`}
        >
          Манас
        </button>
      </div>

      <form onSubmit={addSubject} className="mt-4 flex gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название предмета (например «Физика»)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          placeholder="Порядок"
          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
          >
            <button
              onClick={() => router.push(`/admin/subjects/${s.id}`)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-400">{s.lessonsCount} урок(ов)</p>
            </button>
            <div className="flex flex-none items-center gap-3 text-sm">
              <button onClick={() => router.push(`/admin/subjects/${s.id}`)} className="font-medium text-emerald-600 hover:underline">
                Открыть
              </button>
              <button onClick={() => removeSubject(s.id)} className="font-medium text-red-600 hover:underline">
                Удалить
              </button>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 sm:col-span-2">
            Предметов в этом треке пока нет
          </p>
        )}
      </div>
    </div>
  );
}
