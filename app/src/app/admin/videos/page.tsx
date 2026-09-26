"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Video = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  subject: string | null;
  durationMinutes: number | null;
  order: number;
  isActive: boolean;
};

const emptyForm = { title: "", url: "", description: "", subject: "", durationMinutes: "", order: "0" };

export default function AdminVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  function load() {
    fetch("/api/admin/videos").then((r) => r.json()).then(setVideos);
  }

  useEffect(load, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.role === "curator") router.replace("/admin/dashboard");
      });
  }, [router]);

  async function addVideo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.url.trim()) {
      setError("Укажите название и ссылку");
      return;
    }
    const res = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim() || null,
        subject: form.subject.trim() || null,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
        order: Number(form.order) || 0,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Ошибка");
      return;
    }
    setForm(emptyForm);
    load();
  }

  function startEdit(video: Video) {
    setEditingId(video.id);
    setEditForm({
      title: video.title,
      url: video.url,
      description: video.description ?? "",
      subject: video.subject ?? "",
      durationMinutes: video.durationMinutes ? String(video.durationMinutes) : "",
      order: String(video.order),
    });
  }

  async function saveEdit(videoId: string) {
    setError("");
    const res = await fetch(`/api/admin/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title.trim(),
        url: editForm.url.trim(),
        description: editForm.description.trim() || null,
        subject: editForm.subject.trim() || null,
        durationMinutes: editForm.durationMinutes ? Number(editForm.durationMinutes) : null,
        order: Number(editForm.order) || 0,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Не удалось сохранить");
      return;
    }
    setEditingId(null);
    load();
  }

  async function toggleActive(video: Video) {
    await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !video.isActive }),
    });
    load();
  }

  async function removeVideo(videoId: string) {
    if (!confirm("Удалить видеоурок?")) return;
    await fetch(`/api/admin/videos/${videoId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-sm">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Видеоуроки</h1>
          <p className="text-sm text-slate-500">Ссылки на видео (YouTube, Vimeo), которые видят ученики</p>
        </div>
      </div>

      <form onSubmit={addVideo} className="mt-5 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Название (например «Проценты и пропорции»)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <input
            type="text"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="Ссылка на YouTube/Vimeo"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Тема (например «Математика»)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <input
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            placeholder="Длительность, минут"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Описание (необязательно)"
          rows={2}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
            placeholder="Порядок"
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          />
          <button className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Добавить видео
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {videos.map((video) => (
          <div key={video.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            {editingId === video.id ? (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <input
                    type="text"
                    value={editForm.url}
                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <input
                    type="number"
                    value={editForm.durationMinutes}
                    onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editForm.order}
                    onChange={(e) => setEditForm({ ...editForm, order: e.target.value })}
                    className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button
                    onClick={() => saveEdit(video.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{video.title}</p>
                    {!video.isActive && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Скрыт</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {[video.subject, video.durationMinutes ? `${video.durationMinutes} мин` : null, video.url]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3 text-sm">
                  <button onClick={() => startEdit(video)} className="font-medium text-emerald-600 hover:underline">
                    Изменить
                  </button>
                  <button onClick={() => toggleActive(video)} className="font-medium text-slate-500 hover:underline">
                    {video.isActive ? "Скрыть" : "Показать"}
                  </button>
                  <button onClick={() => removeVideo(video.id)} className="font-medium text-red-600 hover:underline">
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {videos.length === 0 && (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
            Видеоуроков пока нет
          </p>
        )}
      </div>
    </div>
  );
}
