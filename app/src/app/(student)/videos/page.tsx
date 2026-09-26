"use client";

import { useEffect, useState } from "react";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";

type Video = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  subject: string | null;
  durationMinutes: number | null;
  watched: boolean;
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  function load(emailValue: string) {
    fetch(`/api/videos?email=${encodeURIComponent(emailValue)}`)
      .then((res) => res.json())
      .then(setVideos);
  }

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("ort_student_email") || "";
    setEmail(storedEmail);
    load(storedEmail);
  }, []);

  async function markWatched(videoId: string) {
    if (!email) return;
    await fetch(`/api/videos/${videoId}/watch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    load(email);
  }

  if (videos === null) {
    return <p className="text-slate-500">Загрузка...</p>;
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Видеоуроки</h1>
      <p className="mt-1 text-sm text-slate-500">Короткие видео по темам ОРТ</p>

      {videos.length === 0 ? (
        <div className="mt-6 rounded-xl bg-white px-4 py-8 text-center text-slate-400 shadow-sm ring-1 ring-slate-200">
          Видеоуроков пока нет
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {videos.map((video) => {
            const embedUrl = getVideoEmbedUrl(video.url);
            const isOpen = openId === video.id;
            return (
              <div key={video.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium text-slate-900">{video.title}</h2>
                      {video.watched && (
                        <span className="flex-none rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Просмотрено
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {[video.subject, video.durationMinutes ? `${video.durationMinutes} минут` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {video.description && <p className="mt-1 text-sm text-slate-500">{video.description}</p>}
                  </div>
                  <button
                    onClick={() => setOpenId(isOpen ? null : video.id)}
                    className="flex-none rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    {isOpen ? "Свернуть" : "Смотреть"}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4">
                    {embedUrl ? (
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
                        <iframe
                          src={embedUrl}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-emerald-600 hover:underline"
                      >
                        Открыть видео по ссылке →
                      </a>
                    )}
                    {!video.watched && (
                      <button
                        onClick={() => markWatched(video.id)}
                        className="mt-3 text-sm font-medium text-emerald-600 hover:underline"
                      >
                        Отметить как просмотренное
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
