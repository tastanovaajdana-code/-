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
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <Image
          src="/logo.jpg"
          alt="Логотип"
          width={56}
          height={56}
          className="mb-4 rounded-xl"
          priority
        />
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
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Группа</label>
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="11-А"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Начать тестирование
          </button>
        </form>

        <a
          href="/admin/login"
          className="mt-6 block text-center text-xs text-slate-400 hover:text-slate-600"
        >
          Вход для администратора
        </a>
      </div>
    </main>
  );
}
