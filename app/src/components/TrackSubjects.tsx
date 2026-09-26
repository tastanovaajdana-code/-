"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Subject = {
  id: string;
  name: string;
  lessonsTotal: number;
  lessonsWatched: number;
  practiceRemaining: number;
};

export function TrackSubjects({ track, basePath }: { track: "ort" | "manas"; basePath: string }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  useEffect(() => {
    const email = sessionStorage.getItem("ort_student_email") || "";
    fetch(`/api/subjects?track=${track}&email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then(setSubjects);
  }, [track]);

  if (subjects === null) {
    return <p className="text-slate-500">Загрузка...</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {subjects.map((s) => (
        <div key={s.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-medium text-slate-900">{s.name}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {s.lessonsWatched} из {s.lessonsTotal} уроков
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
              style={{ width: `${s.lessonsTotal > 0 ? Math.round((s.lessonsWatched / s.lessonsTotal) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {s.practiceRemaining > 0 ? `${s.practiceRemaining} задания к выполнению` : "Все задания выполнены"}
          </p>
          <button
            onClick={() => router.push(`${basePath}/${s.id}`)}
            className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            Открыть предмет
          </button>
        </div>
      ))}
      {subjects.length === 0 && (
        <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 sm:col-span-2">
          Предметы пока не добавлены
        </p>
      )}
    </div>
  );
}
