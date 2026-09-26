"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Admin = {
  id: string;
  login: string;
  role: "admin" | "curator";
  createdAt: string;
};

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "curator">("curator");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/admins")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAdmins);
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        setMyId(data.id ?? null);
        if (data.role === "curator") router.replace("/admin/dashboard");
      });
  }

  useEffect(load, []);

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!login.trim() || !password) return;
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: login.trim(), password, role }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }
    setLogin("");
    setPassword("");
    setRole("curator");
    load();
  }

  async function changeRole(admin: Admin, newRole: "admin" | "curator") {
    setError("");
    const res = await fetch(`/api/admin/admins/${admin.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Ошибка");
      return;
    }
    load();
  }

  async function removeAdmin(admin: Admin) {
    if (!confirm(`Удалить учётную запись «${admin.login}»?`)) return;
    setError("");
    const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не удалось удалить");
      return;
    }
    load();
  }

  const roleLabel: Record<string, string> = { admin: "Администратор", curator: "Куратор" };
  const roleBadge: Record<string, string> = {
    admin: "bg-emerald-100 text-emerald-700",
    curator: "bg-sky-100 text-sky-700",
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM5 20a7 7 0 0114 0"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Пользователи</h1>
          <p className="text-sm text-slate-500">
            Администраторы (полный доступ) и кураторы (только просмотр результатов)
          </p>
        </div>
      </div>

      <form
        onSubmit={addAdmin}
        className="mt-5 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      >
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="Логин"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль (мин. 6 символов)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "curator")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="curator">Куратор</option>
          <option value="admin">Администратор</option>
        </select>
        <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">
                {admin.login}
                {admin.id === myId && <span className="ml-2 text-xs text-slate-400">(это вы)</span>}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(admin.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${roleBadge[admin.role]}`}>
              {roleLabel[admin.role]}
            </span>
            <select
              value={admin.role}
              onChange={(e) => changeRole(admin, e.target.value as "admin" | "curator")}
              disabled={admin.id === myId}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none transition focus:border-emerald-500 disabled:opacity-40"
            >
              <option value="curator">Куратор</option>
              <option value="admin">Администратор</option>
            </select>
            <button
              onClick={() => removeAdmin(admin)}
              disabled={admin.id === myId}
              className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
              title="Удалить"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
