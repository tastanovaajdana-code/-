"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandScene } from "@/components/BrandScene";

const GROUPS = ["Прогресс", "Грант", "ЖРТ"];

export default function StartPage() {
  const router = useRouter();
  const [fio, setFio] = useState("");
  const [group, setGroup] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fio.trim() || !group.trim()) {
      setError("Заполните ФИО и группу");
      return;
    }
    sessionStorage.setItem("ort_student_fio", fio.trim());
    sessionStorage.setItem("ort_student_group", group.trim());
    router.push("/tests");
  }

  return (
    <BrandScene>
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl shadow-emerald-950/10 ring-1 ring-slate-200">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="pointer-events-none absolute -right-3 -top-3 h-14 w-14 text-emerald-900/10"
          fill="none"
          stroke="currentColor"
        >
          <circle cx={50} cy={50} r={30} strokeWidth={1.5} />
          <circle cx={50} cy={50} r={16} strokeWidth={1.5} />
        </svg>
        <div className="p-8">
          <h1 className="text-2xl font-semibold text-slate-900">ОРТ Тестирование</h1>
          <p className="mt-1 text-sm text-slate-500">
            Введите ваши данные, чтобы начать тестирование
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">ФИО</label>
              <div className="relative mt-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  value={fio}
                  onChange={(e) => setFio(e.target.value)}
                  placeholder="Баатырбекова Айдана Баатырбековна"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Группа</label>
              <div className="relative mt-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-5.13a4 4 0 100-8 4 4 0 000 8zm6 3a4 4 0 10-8 0"
                  />
                </svg>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Выберите группу</option>
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:shadow-md hover:shadow-emerald-600/30 active:scale-[0.98]"
            >
              Начать тестирование
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>

          <a
            href="/admin/login"
            className="mt-6 block text-center text-xs text-slate-400 transition hover:text-emerald-600"
          >
            Вход для администратора
          </a>
        </div>
      </div>
    </BrandScene>
  );
}
