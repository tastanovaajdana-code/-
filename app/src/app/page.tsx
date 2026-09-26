"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandScene } from "@/components/BrandScene";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Введите почту и пароль");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка входа");
      router.push("/tests");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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
          <p className="mt-1 text-sm text-slate-500">Войдите в свой аккаунт, чтобы начать тестирование</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Электронная почта</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:shadow-md hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Входим..." : "Войти"}
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

          <Link
            href="/register"
            className="mt-4 block text-center text-sm font-medium text-emerald-600 hover:underline"
          >
            Нет аккаунта? Зарегистрироваться
          </Link>

          <a
            href="/admin/login"
            className="mt-4 block text-center text-xs text-slate-400 transition hover:text-emerald-600"
          >
            Вход для администратора
          </a>
        </div>
      </div>
    </BrandScene>
  );
}
