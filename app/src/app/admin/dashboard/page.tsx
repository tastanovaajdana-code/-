"use client";

import { useEffect, useState } from "react";

type Group = { id: string; name: string };
type Test = { id: string; title: string };

type AttemptRow = {
  id: string;
  studentFio: string;
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Статистика прохождений</h1>
        <a
          href={exportHref}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Экспорт в CSV
        </a>
      </div>

      <div className="mt-4 flex gap-3">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Все тесты</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ФИО</th>
              <th className="px-4 py-3 font-medium">Группа</th>
              <th className="px-4 py-3 font-medium">Тест</th>
              <th className="px-4 py-3 font-medium">Разделы</th>
              <th className="px-4 py-3 font-medium">Итог</th>
              <th className="px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attempts?.map((attempt) => (
              <tr key={attempt.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{attempt.studentFio}</td>
                <td className="px-4 py-3 text-slate-600">{attempt.groupName}</td>
                <td className="px-4 py-3 text-slate-600">{attempt.testTitle}</td>
                <td className="px-4 py-3 text-slate-600">
                  {attempt.sections
                    .map((s) => `${s.title}: ${s.finished ? s.score : "—"}`)
                    .join(" · ")}
                </td>
                <td className="px-4 py-3 font-semibold text-indigo-600">{attempt.totalScore}</td>
                <td className="px-4 py-3 text-slate-500">
                  {attempt.finishedAt ? new Date(attempt.finishedAt).toLocaleString("ru-RU") : "не завершено"}
                </td>
              </tr>
            ))}
            {attempts?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
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
