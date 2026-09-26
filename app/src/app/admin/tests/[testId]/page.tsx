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
  optionE: string | null;
  correctAnswer: string;
  points: number;
  order: number;
  imageUrl: string | null;
  explanation: string | null;
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
  optionE: "",
  correctAnswer: "",
  points: "1",
  imageUrl: "",
  explanation: "",
};

const MAX_IMAGE_DIMENSION = 1200;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas не поддерживается"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const typeBadge: Record<string, string> = {
  single: "bg-sky-100 text-sky-700",
  multiple: "bg-violet-100 text-violet-700",
  text: "bg-amber-100 text-amber-700",
};

const typeLabel: Record<string, string> = {
  single: "один ответ",
  multiple: "несколько",
  text: "текст",
};

export default function AdminTestDetailPage() {
  const params = useParams<{ testId: string }>();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [newSection, setNewSection] = useState({ title: "", timeLimitMinutes: "30", maxScore: "" });
  const [questionForms, setQuestionForms] = useState<Record<string, typeof emptyQuestionForm>>({});
  const [importResult, setImportResult] = useState<{ createdCount: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [imageError, setImageError] = useState<Record<string, string>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyQuestionForm);
  const [editImageError, setEditImageError] = useState("");
  const [deleteError, setDeleteError] = useState("");
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
    setDeleteError("");
    const res = await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error || "Не удалось удалить раздел");
      return;
    }
    load();
  }

  function getForm(sectionId: string) {
    return questionForms[sectionId] ?? emptyQuestionForm;
  }

  async function handleQuestionImage(sectionId: string, file: File | undefined) {
    if (!file) return;
    setImageError((prev) => ({ ...prev, [sectionId]: "" }));
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError((prev) => ({ ...prev, [sectionId]: "Файл слишком большой (макс. 2 МБ)" }));
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setQuestionForms((prev) => ({ ...prev, [sectionId]: { ...getForm(sectionId), imageUrl: dataUrl } }));
    } catch {
      setImageError((prev) => ({ ...prev, [sectionId]: "Не удалось обработать изображение" }));
    }
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
        optionE: form.optionE || null,
        correctAnswer: form.correctAnswer.trim(),
        points: Number(form.points) || 1,
        imageUrl: form.imageUrl || null,
        explanation: form.explanation.trim() || null,
      }),
    });
    setQuestionForms((prev) => ({ ...prev, [sectionId]: emptyQuestionForm }));
    load();
  }

  async function removeQuestion(id: string) {
    setDeleteError("");
    const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error || "Не удалось удалить вопрос");
      return;
    }
    load();
  }

  function startEdit(question: Question) {
    setEditingQuestionId(question.id);
    setEditImageError("");
    setEditForm({
      text: question.text,
      type: question.type,
      optionA: question.optionA ?? "",
      optionB: question.optionB ?? "",
      optionC: question.optionC ?? "",
      optionD: question.optionD ?? "",
      optionE: question.optionE ?? "",
      correctAnswer: question.correctAnswer,
      points: String(question.points),
      imageUrl: question.imageUrl ?? "",
      explanation: question.explanation ?? "",
    });
  }

  function cancelEdit() {
    setEditingQuestionId(null);
    setEditForm(emptyQuestionForm);
    setEditImageError("");
  }

  async function handleEditImage(file: File | undefined) {
    if (!file) return;
    setEditImageError("");
    if (file.size > MAX_IMAGE_BYTES) {
      setEditImageError("Файл слишком большой (макс. 2 МБ)");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setEditForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch {
      setEditImageError("Не удалось обработать изображение");
    }
  }

  async function saveEdit(questionId: string) {
    if (!editForm.text.trim() || !editForm.correctAnswer.trim()) return;
    await fetch(`/api/admin/questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: editForm.text.trim(),
        type: editForm.type,
        optionA: editForm.optionA || null,
        optionB: editForm.optionB || null,
        optionC: editForm.optionC || null,
        optionD: editForm.optionD || null,
        optionE: editForm.optionE || null,
        correctAnswer: editForm.correctAnswer.trim(),
        points: Number(editForm.points) || 1,
        imageUrl: editForm.imageUrl || null,
        explanation: editForm.explanation.trim() || null,
      }),
    });
    cancelEdit();
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
    return <p className="text-slate-500">Загрузка...</p>;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{test.title}</h1>
          {test.description && <p className="text-sm text-slate-500">{test.description}</p>}
        </div>
      </div>

      {deleteError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-200">
          {deleteError}
        </p>
      )}

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <h2 className="font-medium text-slate-900">Загрузить вопросы файлом</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Поддерживаются .xlsx, .csv, .json. Колонки: section, question_text, type
          (single/multiple/text), option_a..option_e, correct_answer (например option_b или
          option_a,option_c), points, explanation (необязательно). Значение колонки &quot;section&quot;
          должно совпадать с названием одного из разделов ниже.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-3">
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.json" className="text-sm" />
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {importing ? (
              "Загружаем..."
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Импортировать
              </>
            )}
          </button>
        </div>
        {importResult && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm">
            <p className="font-medium text-emerald-700">Добавлено вопросов: {importResult.createdCount}</p>
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
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <h2 className="font-medium text-slate-900">Добавить раздел</h2>
        </div>
        <form onSubmit={addSection} className="mt-3 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Название раздела"
            value={newSection.title}
            onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <input
            type="number"
            placeholder="Время, мин"
            value={newSection.timeLimitMinutes}
            onChange={(e) => setNewSection({ ...newSection, timeLimitMinutes: e.target.value })}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <input
            type="number"
            placeholder="Макс. балл"
            value={newSection.maxScore}
            onChange={(e) => setNewSection({ ...newSection, maxScore: e.target.value })}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
            Добавить
          </button>
        </form>
      </section>

      <div className="mt-6 flex flex-col gap-6">
        {test.sections.map((section, sIndex) => (
          <section key={section.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                  {sIndex + 1}
                </span>
                <h2 className="font-medium text-slate-900">{section.title}</h2>
              </div>
              <button
                onClick={() => removeSection(section.id)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 transition hover:bg-red-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Удалить раздел
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  Время (мин):
                  <input
                    type="number"
                    defaultValue={section.timeLimitMinutes}
                    onBlur={(e) => updateSection(section, { timeLimitMinutes: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
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
                    className="w-32 rounded-lg border border-slate-300 px-2 py-1 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </label>
                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {section.questions.length} вопрос(ов)
                </span>
              </div>

              {(() => {
                const sumPoints = section.questions.reduce((sum, q) => sum + q.points, 0);
                return (
                  <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
                    Сумма баллов вопросов: <span className="font-semibold">{sumPoints}</span>
                    {section.maxScore != null ? (
                      <>
                        {" "}
                        → пересчитывается пропорционально в макс.{" "}
                        <span className="font-semibold">{section.maxScore}</span> балл(ов) раздела
                        {sumPoints === 0 && " (добавьте вопросы, чтобы расчёт заработал)"}
                      </>
                    ) : (
                      <> — балл раздела равен этой сумме (макс. балл не задан)</>
                    )}
                  </p>
                );
              })()}

              <div className="mt-4 flex flex-col gap-2">
                {section.questions.map((question, index) =>
                  editingQuestionId === question.id ? (
                    <div key={question.id} className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Текст вопроса"
                          value={editForm.text}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, text: e.target.value }))}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editForm.type}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                          >
                            <option value="single">Один верный ответ</option>
                            <option value="multiple">Несколько верных</option>
                            <option value="text">Текстовый ответ</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Балл"
                            value={editForm.points}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, points: e.target.value }))}
                            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </div>
                        {editForm.type !== "text" && (
                          <div className="grid grid-cols-2 gap-2">
                            {(["optionA", "optionB", "optionC", "optionD", "optionE"] as const).map((key) => (
                              <input
                                key={key}
                                type="text"
                                placeholder={`Вариант ${key.slice(-1)}`}
                                value={editForm[key]}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                              />
                            ))}
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder={
                            editForm.type === "text"
                              ? "Правильный ответ (текст)"
                              : "Правильный ответ, напр. option_b или option_a,option_c"
                          }
                          value={editForm.correctAnswer}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, correctAnswer: e.target.value }))}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Фото к вопросу
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleEditImage(e.target.files?.[0])}
                            />
                          </label>
                          {editForm.imageUrl && (
                            <div className="flex items-center gap-2">
                              <img src={editForm.imageUrl} alt="" className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200" />
                              <button
                                type="button"
                                onClick={() => setEditForm((prev) => ({ ...prev, imageUrl: "" }))}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Убрать фото
                              </button>
                            </div>
                          )}
                        </div>
                        {editImageError && <p className="text-xs text-red-600">{editImageError}</p>}
                        <textarea
                          placeholder="Объяснение правильного ответа (необязательно)"
                          value={editForm.explanation}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, explanation: e.target.value }))}
                          rows={2}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(question.id)}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={question.id}
                      className="group flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5 transition hover:border-emerald-100 hover:bg-emerald-50/30"
                    >
                      <div className="text-sm">
                        <p className="font-medium text-slate-800">
                          {index + 1}. {question.text}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${typeBadge[question.type] ?? "bg-slate-100 text-slate-600"}`}>
                            {typeLabel[question.type] ?? question.type}
                          </span>
                          <span>Ответ: {question.correctAnswer}</span>
                          <span>· Балл: {question.points}</span>
                          {question.explanation && (
                            <span className="flex items-center gap-0.5 text-emerald-600" title={question.explanation}>
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              объяснение
                            </span>
                          )}
                        </div>
                      </div>
                      {question.imageUrl && (
                        <img
                          src={question.imageUrl}
                          alt=""
                          className="h-12 w-12 flex-none rounded-lg object-cover ring-1 ring-slate-200"
                        />
                      )}
                      <div className="flex flex-none items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => startEdit(question)}
                          className="rounded-lg p-1 text-slate-300 hover:bg-emerald-50 hover:text-emerald-600"
                          title="Редактировать вопрос"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="rounded-lg p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                          title="Удалить вопрос"
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
                    </div>
                  )
                )}
                {section.questions.length === 0 && (
                  <p className="rounded-lg bg-slate-50 px-3 py-3 text-center text-sm text-slate-400">
                    В этом разделе пока нет вопросов
                  </p>
                )}
              </div>

              <details className="mt-4 rounded-lg border border-slate-100">
                <summary className="cursor-pointer select-none rounded-lg px-3 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50">
                  + Добавить вопрос вручную
                </summary>
                <div className="flex flex-col gap-2 border-t border-slate-100 p-3">
                  <input
                    type="text"
                    placeholder="Текст вопроса"
                    value={getForm(section.id).text}
                    onChange={(e) =>
                      setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), text: e.target.value } }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <div className="flex gap-2">
                    <select
                      value={getForm(section.id).type}
                      onChange={(e) =>
                        setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), type: e.target.value } }))
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
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
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  {getForm(section.id).type !== "text" && (
                    <div className="grid grid-cols-2 gap-2">
                      {(["optionA", "optionB", "optionC", "optionD", "optionE"] as const).map((key) => (
                        <input
                          key={key}
                          type="text"
                          placeholder={`Вариант ${key.slice(-1)}`}
                          value={getForm(section.id)[key]}
                          onChange={(e) =>
                            setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), [key]: e.target.value } }))
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
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
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Фото к вопросу
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleQuestionImage(section.id, e.target.files?.[0])}
                      />
                    </label>
                    {getForm(section.id).imageUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={getForm(section.id).imageUrl}
                          alt=""
                          className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), imageUrl: "" } }))
                          }
                          className="text-xs text-red-600 hover:underline"
                        >
                          Убрать фото
                        </button>
                      </div>
                    )}
                  </div>
                  {imageError[section.id] && (
                    <p className="text-xs text-red-600">{imageError[section.id]}</p>
                  )}
                  <textarea
                    placeholder="Объяснение правильного ответа (необязательно) — покажется ученику после сдачи теста в разборе ответов"
                    value={getForm(section.id).explanation}
                    onChange={(e) =>
                      setQuestionForms((prev) => ({ ...prev, [section.id]: { ...getForm(section.id), explanation: e.target.value } }))
                    }
                    rows={2}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button
                    onClick={() => addQuestion(section.id)}
                    className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    Добавить вопрос
                  </button>
                </div>
              </details>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
