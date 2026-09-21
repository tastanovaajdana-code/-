"use client";

import { useEffect, useState } from "react";

type Group = { id: string; name: string; attemptsCount: number };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/groups").then((r) => r.json()).then(setGroups);
  }

  useEffect(load, []);

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
    await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Группы</h1>

      <form onSubmit={addGroup} className="mt-4 flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название группы (например 11-А)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Добавить
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200"
          >
            <div>
              <span className="font-medium text-slate-900">{group.name}</span>
              <span className="ml-2 text-xs text-slate-400">{group.attemptsCount} попыток</span>
            </div>
            <button onClick={() => removeGroup(group.id)} className="text-sm text-red-600 hover:text-red-800">
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
