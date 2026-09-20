"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Question = {
  id: string;
  text: string;
  type: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string;
  points: number;
  order: number;
};

type Section = {
  id: string;
  title: string;
  order: number;
  timeLimitMinutes: number;
  maxScore: number | null;
  questions: Question[];
};

type TestDetail = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  sections: Section[];
};

const emptyQuestionForm = {
  text: "",
  type: "single",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
  points: "1",
};

export default function AdminTestDetailPage() {
  const params = useParams<{ testId: string }>();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [newSection, setNewSection] = useState({ title: "", timeLimitMinutes: "30", maxScore: "" });
  const [questionForms, setQuestionForms] = useState<Record<string, typeof emptyQuestionForm>>({});
  const [importResult, setImportResult] = useState<{ createdCount: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch(`/api/admin/tests/${params.testId}`)
      .then((r) => r.json())
      .then(setTest);
  }

  useEffect(load, [params.testId]);

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    if (!newSection.title.trim()) return;
    await fetch(`/api/admin/tests/${params.testId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newSection.title.trim(),
        timeLimitMinutes: Number(newSection.timeLimitMinutes) || 30,
        maxScore: newSection.maxScore ? Number(newSection.maxScore) : null,
      }),
    });
    setNewSection({ title: "", timeLimitMinutes: "30", maxScore: "" });
    load();
  }

  async function updateSection(section: Section, patch: Partial<Section>) {
    await fetch(`/api/admin/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function removeSection(id: string) {
    if (!confirm("Удалить раздел вместе с вопросами?")) return;
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    load();
  }

  function getForm(sectionId: string) {
    return questionForms[sectionId] ?? emptyQuestionForm;
  }

  async function addQuestion(sectionId: string) {
    const form = getForm(sectionId);
    if (!form.text.trim() || !form.correctAnswer.trim()) return;
    await fetch(`/api/admin/sections/${sectionId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: form.text.trim(),
        type: form.type,
        optionA: form.optionA || null,
        optionB: form.optionB || null,
        optionC: form.optionC || null,
        optionD: form.optionD || null,
        correctAnswer: form.correctAnswer.trim(),
        points: Number(form.points) || 1,
      }),
    });
    setQuestionForms((prev) => ({ ...prev, [sectionId]: emptyQuestionForm }));
    load();
  }

  async function removeQuestion(id: string) {
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    load();
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/admin/tests/${params.testId}/questions/import`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setImportResult(data);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  }

  if (!test) {
    return <p>Загрузка...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{test.title}</h1>
      {test.description && <p className="mt-1 text-sm text-slate-500">{test.description}</p>}

      <section className="mt-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-medium text-slate-900">Загрузить вопросы файлом</h2>
        <p className="mt-1 text-xs text-slate-500">
          Поддерживаются .xlsx, .csv, .json. Колонки: section, question_text, type
          (single/multiple/text), option_a..option_d, correct_answer (например option_b или
          option_a,option_c), points. Значение колонки &quot;section&quot; должно совпадать с
          названием одного из разделов ниже.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.json" className="text-sm" />
          <button
            onClick={handleImport}
            disabled={importing}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {importing ? "Загружаем..." : "Импортировать"}
          </button>
        </div>
        {importResult && (
          <div className="mt-3 text-sm">
            <p className="text-emerald-700">Добавлено вопросов: {importResult.createdCount}</p>
            {importResult.errors.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-red-600">
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-medium text-slate-900">Добавить раздел</h2>
        <form onSubmit={addSection} className="mt-3 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Название раздела"
            value={newSection.title}
            onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Время, мин"
            value={newSection.timeLimitMinutes}
            onChange={(e) => setNewSection({ ...newSection, timeLimitMinutes: e.target.value })}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Макс. балл"
            value={newSection.maxScore}
            onChange={(e) => setNewSection({ ...newSection, maxScore: e.target.value })}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Добавить
          </button>
        </form>
      </section>

      <div className="mt-6 flex flex-col gap-6">
        {test.sections.map((section) => (
          <section key={section.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-slate-900">{section.title}</h2>
              <button onClick={() => removeSection(section.id)} className="text-sm text-red-600 hover:text-red-800">
                Удалить раздел
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <label className="flex items-center gap-2">
                Время (мин):
                <input
                  type="number"
                  defaultValue={section.timeLimitMinutes}
                  onBlur={(e) => updateSection(section, { timeLimitMinutes: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                />
              </label>
              <label className="flex items-center gap-2">
                Макс. балл раздела:
                <input
                  type="number"
                  defaultValue={section.maxScore ?? ""}
                  placeholder="без ограничения"
                  onBlur={(e) =>
                    updateSection(section, {
                      maxScore: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="w-32 rounded-lg border border-slate-300 px-2 py-1"
                />
              </label>
              <span className="text-xs text-slate-400">{section.questions.length} вопрос(ов)</span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {section.questions.map((question, index) => (
                <div key={question.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <div className="text-sm">
                    <p className="font-medium text-slate-800">
                      {index + 1}. {question.text}
                    </p>
                    <p className="text-xs text-slate-400">
                      Тип: {question.type} · Правильный ответ: {question.correctAnswer} · Балл: {question.points}
                    </p>
                  </div>
                  <button onClick={() => removeQuestion(question.id)} className="text-xs text-red-600 hover:text-red-800">
                    Удалить
                  </button>
                </div>
              ))}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">Добавить вопрос вручную</summary>
              <div className="mt-3 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Текст вопроса"
                  value={getForm(section.id).text}
                  onChange={(e) =>
                    setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), text: e.target.value } }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <select
                    value={getForm(section.id).type}
                    onChange={(e) =>
                      setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), type: e.target.value } }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="single">Один верный ответ</option>
                    <option value="multiple">Несколько верных</option>
                    <option value="text">Текстовый ответ</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Балл"
                    value={getForm(section.id).points}
                    onChange={(e) =>
                      setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), points: e.target.value } }))
                    }
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                {getForm(section.id).type !== "text" && (
                  <div className="grid grid-cols-2 gap-2">
                    {(["optionA", "optionB", "optionC", "optionD"] as const).map((key) => (
                      <input
                        key={key}
                        type="text"
                        placeholder={`Вариант ${key.slice(-1)}`}
                        value={getForm(section.id)[key]}
                        onChange={(e) =>
                          setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), [key]: e.target.value } }))
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder={
                    getForm(section.id).type === "text"
                      ? "Правильный ответ (текст)"
                      : "Правильный ответ, напр. option_b или option_a,option_c"
                  }
                  value={getForm(section.id).correctAnswer}
                  onChange={(e) =>
                    setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), correctAnswer: e.target.value } }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => addQuestion(section.id)}
                  className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Добавить вопрос
                </button>
              </div>
            </details>
          </section>
        ))}
      </div>
    </div>
  );
}
