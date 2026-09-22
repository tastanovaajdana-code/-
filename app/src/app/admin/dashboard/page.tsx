"use client";

import { useEffect, useState } from "react";

type Group = { id: string; name: string };
type Test = { id: string; title: string };

type AttemptRow = {
  id: string;
  studentFio: string;
  studentEmail: string | null;
  groupName: string;
  testTitle: string;
  startedAt: string;
  finishedAt: string | null;
  totalScore: number;
  sections: { title: string; score: number; correctCount: number; totalQuestions: number; finished: boolean }[];
};

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [groupId, setGroupId] = useState("");
  const [testId, setTestId] = useState("");
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/groups").then((r) => r.json()).then(setGroups);
    fetch("/api/admin/tests").then((r) => r.json()).then((data) => setTests(data.map((t: { id: string; title: string }) => ({ id: t.id, title: t.title }))));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams();
    if (groupId) query.set("groupId", groupId);
    if (testId) query.set("testId", testId);
    fetch(`/api/admin/attempts?${query.toString()}`)
      .then((r) => r.json())
      .then(setAttempts);
  }, [groupId, testId]);

  const exportHref = (() => {
    const query = new URLSearchParams();
    if (groupId) query.set("groupId", groupId);
    if (testId) query.set("testId", testId);
    return `/api/admin/attempts/export?${query.toString()}`;
  })();

  const totalAttempts = attempts?.length ?? 0;
  const finishedAttempts = attempts?.filter((a) => a.finishedAt).length ?? 0;
  const avgScore =
    finishedAttempts > 0
      ? Math.round(
          (attempts!.filter((a) => a.finishedAt).reduce((sum, a) => sum + a.totalScore, 0) /
            finishedAttempts) *
            10
        ) / 10
      : 0;

  const stats = [
    {
      label: "Всего попыток",
      value: totalAttempts,
      color: "bg-emerald-100 text-emerald-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm8 0a4 4 0 11-8 0 4 4 0 018 0z" />
      ),
    },
    {
      label: "Завершено",
      value: finishedAttempts,
      color: "bg-sky-100 text-sky-700",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    },
    {
      label: "Средний балл",
      value: avgScore,
      color: "bg-amber-100 text-amber-700",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      ),
    },
    {
      label: "Групп",
      value: groups.length,
      color: "bg-violet-100 text-violet-700",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M12 11a4 4 0 100-8 4 4 0 000 8z"
        />
      ),
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Статистика прохождений</h1>
            <p className="text-sm text-slate-500">Результаты учеников по всем тестам и группам</p>
          </div>
        </div>
        <a
          href={exportHref}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          Экспорт в CSV
        </a>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {stat.icon}
              </svg>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="">Все группы</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <select
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="">Все тесты</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:hidden">
        {attempts?.map((attempt) => (
          <div key={attempt.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{attempt.studentFio}</p>
                <p className="truncate text-xs text-slate-500">{attempt.studentEmail ?? "—"}</p>
              </div>
              <span className="flex-none rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-600">
                {attempt.totalScore}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {attempt.groupName} · {attempt.testTitle}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {attempt.sections.map((s) => `${s.title}: ${s.finished ? s.score : "—"}`).join(" · ")}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {attempt.finishedAt ? new Date(attempt.finishedAt).toLocaleString("ru-RU") : "не завершено"}
            </p>
          </div>
        ))}
        {attempts?.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
            Нет данных
          </p>
        )}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ФИО</th>
              <th className="px-4 py-3 font-medium">Почта</th>
              <th className="px-4 py-3 font-medium">Группа</th>
              <th className="px-4 py-3 font-medium">Тест</th>
              <th className="px-4 py-3 font-medium">Разделы</th>
              <th className="px-4 py-3 font-medium">Итог</th>
              <th className="px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attempts?.map((attempt) => (
              <tr key={attempt.id} className="transition hover:bg-emerald-50/40">
                <td className="px-4 py-3 font-medium text-slate-900">{attempt.studentFio}</td>
                <td className="px-4 py-3 text-slate-500">{attempt.studentEmail ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{attempt.groupName}</td>
                <td className="px-4 py-3 text-slate-600">{attempt.testTitle}</td>
                <td className="px-4 py-3 text-slate-600">
                  {attempt.sections
                    .map((s) => `${s.title}: ${s.finished ? s.score : "—"}`)
                    .join(" · ")}
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{attempt.totalScore}</td>
                <td className="px-4 py-3 text-slate-500">
                  {attempt.finishedAt ? new Date(attempt.finishedAt).toLocaleString("ru-RU") : "не завершено"}
                </td>
              </tr>
            ))}
            {attempts?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
