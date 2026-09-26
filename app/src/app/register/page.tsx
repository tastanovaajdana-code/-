"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandScene } from "@/components/BrandScene";

export default function RegisterPage() {
  const router = useRouter();
  const [fio, setFio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then(setGroups)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fio.trim() || !email.trim() || !password || !groupId) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fio: fio.trim(), email: email.trim(), password, groupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
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
        <div className="p-8">
          <h1 className="text-2xl font-semibold text-slate-900">Регистрация</h1>
          <p className="mt-1 text-sm text-slate-500">Создайте аккаунт, чтобы проходить тесты и видеть свой прогресс</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">ФИО</label>
              <input
                type="text"
                value={fio}
                onChange={(e) => setFio(e.target.value)}
                placeholder="Баатырбекова Айдана Баатырбековна"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
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
                placeholder="Не короче 6 символов"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Группа</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="mt-1 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="">Выберите группу</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:shadow-md hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Создаём аккаунт..." : "Зарегистрироваться"}
            </button>
          </form>

          <Link href="/" className="mt-4 block text-center text-sm font-medium text-emerald-600 hover:underline">
            Уже есть аккаунт? Войти
          </Link>
        </div>
      </div>
    </BrandScene>
  );
}
