"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Program = { id: string; name: string; order: number };
type University = { id: string; name: string; order: number; programs: Program[] };

export default function AdminUniversitiesPage() {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [programName, setProgramName] = useState("");

  function load() {
    fetch("/api/admin/universities").then((r) => r.json()).then(setUniversities);
  }

  useEffect(load, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role === "curator") router.replace("/admin/dashboard");
      });
  }, [router]);

  async function addUniversity(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    const res = await fetch("/api/admin/universities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }
    setName("");
    load();
  }

  async function removeUniversity(id: string) {
    if (!confirm("Удалить университет вместе со всеми направлениями?")) return;
    await fetch(`/api/admin/universities/${id}`, { method: "DELETE" });
    load();
  }

  async function addProgram(universityId: string) {
    setError("");
    if (!programName.trim()) return;
    const res = await fetch(`/api/admin/universities/${universityId}/programs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: programName.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }
    setProgramName("");
    load();
  }

  async function removeProgram(id: string) {
    if (!confirm("Удалить направление?")) return;
    await fetch(`/api/admin/programs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-9.42L12 14z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Университеты и направления</h1>
          <p className="text-sm text-slate-500">Каталог для выбора цели ученика в разделе «Мои цели»</p>
        </div>
      </div>

      <form onSubmit={addUniversity} className="mt-5 flex gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название университета"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {universities.map((u) => {
          const isOpen = expandedId === u.id;
          return (
            <div key={u.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.programs.length} направлени(й)</p>
                </div>
                <div className="flex flex-none items-center gap-3 text-sm">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : u.id)}
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    {isOpen ? "Свернуть" : "Направления"}
                  </button>
                  <button onClick={() => removeUniversity(u.id)} className="font-medium text-red-600 hover:underline">
                    Удалить
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                  {u.programs.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-700">{p.name}</span>
                      <button onClick={() => removeProgram(p.id)} className="text-xs font-medium text-red-600 hover:underline">
                        Удалить
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={programName}
                      onChange={(e) => setProgramName(e.target.value)}
                      placeholder="Название направления (например «Информатика»)"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    />
                    <button
                      onClick={() => addProgram(u.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {universities.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
            Университетов пока нет
          </p>
        )}
      </div>
    </div>
  );
}
