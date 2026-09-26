import { TrackSubjects } from "@/components/TrackSubjects";

export default function OrtPage() {
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Подготовка к ОРТ / ЖРТ</h1>
      <p className="mt-1 text-sm text-slate-500">Основной тест · выбери учебный раздел</p>
      <TrackSubjects track="ort" basePath="/ort" />
    </div>
  );
}
