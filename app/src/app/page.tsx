"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-150 rounded-3xl bg-white/20 blur-2xl" />
            <div className="rounded-3xl bg-white p-2.5 shadow-xl">
              <Image
                src="/logo.jpg"
                alt="Логотип"
                width={96}
                height={96}
                className="rounded-2xl"
                priority
              />
            </div>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/30 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Онлайн-тестирование
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-slate-900">ОРТ Тестирование</h1>
            <p className="mt-1 text-sm text-slate-500">
              Введите ваши данные, чтобы начать тестирование
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">ФИО</label>
                <input
                  type="text"
                  value={fio}
                  onChange={(e) => setFio(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Группа</label>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="11-А"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/30 active:scale-[0.98]"
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
      </div>
    </main>
  );
}
