"use client";

import { useEffect, useState } from "react";

type Curator = { displayName: string; contact: string | null } | null;

export default function CuratorPage() {
  const [curator, setCurator] = useState<Curator>(null);
  const [loaded, setLoaded] = useState(false);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    const group = sessionStorage.getItem("ort_student_group") || "";
    setGroupName(group);
    fetch(`/api/curator?group=${encodeURIComponent(group)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setCurator(data.curator))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Куратор</h1>
      <p className="mt-1 text-sm text-slate-500">Контакты куратора вашей группы {groupName && `(${groupName})`}</p>

      <div className="mt-6 max-w-sm rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {!loaded ? (
          <p className="text-sm text-slate-400">Загрузка...</p>
        ) : curator ? (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-lg font-semibold text-white">
              {curator.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900">{curator.displayName}</p>
              {curator.contact && <p className="text-sm text-slate-500">{curator.contact}</p>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Куратор для вашей группы пока не назначен</p>
        )}
      </div>
    </div>
  );
}
