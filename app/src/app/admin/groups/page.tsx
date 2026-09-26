"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Group = { id: string; name: string; attemptsCount: number; curatorId: string | null; curatorName: string | null };
type AdminUserOption = { id: string; login: string; displayName: string | null };

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [admins, setAdmins] = useState<AdminUserOption[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/groups").then((r) => r.json()).then(setGroups);
    fetch("/api/admin/admins")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAdmins);
  }

  useEffect(load, []);

  async function assignCurator(groupId: string, curatorId: string) {
    await fetch(`/api/admin/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curatorId: curatorId || null }),
    });
    load();
  }

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role === "curator") router.replace("/admin/dashboard");
      });
  }, [router]);

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return;
    const res = await fetch("/api/admin/groups", {
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

  async function removeGroup(id: string) {
    if (!confirm("Удалить группу? Это также удалит связанные попытки.")) return;
    setError("");
    const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не удалось удалить группу");
      return;
    }
    load();
  }

  const palette = [
    "from-emerald-500 to-emerald-600",
    "from-sky-500 to-sky-600",
    "from-amber-500 to-amber-600",
    "from-violet-500 to-violet-600",
    "from-rose-500 to-rose-600",
    "from-teal-500 to-teal-600",
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M12 11a4 4 0 100-8 4 4 0 000 8z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Группы</h1>
          <p className="text-sm text-slate-500">Группы учеников, доступные при регистрации на тест</p>
        </div>
      </div>

      <form
        onSubmit={addGroup}
        className="mt-5 flex gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название группы (например Прогресс)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {groups.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M12 11a4 4 0 100-8 4 4 0 000 8z"
              />
            </svg>
          </div>
          <p className="mt-3 text-sm text-slate-500">Групп пока нет — добавьте первую выше</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, i) => (
            <div
              key={group.id}
              className="group flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
            >
              <div
                className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br text-white font-semibold shadow-sm ${palette[i % palette.length]}`}
              >
                {group.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{group.name}</p>
                <p className="text-xs text-slate-400">{group.attemptsCount} попыток</p>
                <select
                  value={group.curatorId ?? ""}
                  onChange={(e) => assignCurator(group.id, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                >
                  <option value="">Без куратора</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName || a.login}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => removeGroup(group.id)}
                className="flex-none rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                title="Удалить группу"
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
      )}
    </div>
  );
}
