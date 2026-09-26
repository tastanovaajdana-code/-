"use client";

import { useParams } from "next/navigation";
import { SubjectLessons } from "@/components/SubjectLessons";

export default function OrtSubjectPage() {
  const params = useParams<{ subjectId: string }>();
  return <SubjectLessons subjectId={params.subjectId} backHref="/ort" />;
}
