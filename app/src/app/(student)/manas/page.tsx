import { TrackSubjects } from "@/components/TrackSubjects";

export default function ManasPage() {
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-slate-900">Подготовка к Манасу</h1>
      <p className="mt-1 text-sm text-slate-500">8 предметов · уроки, практика и домашние задания</p>
      <TrackSubjects track="manas" basePath="/manas" />
    </div>
  );
}
