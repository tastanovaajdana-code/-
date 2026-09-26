"use client";

import { useParams } from "next/navigation";
import { SubjectLessons } from "@/components/SubjectLessons";

export default function ManasSubjectPage() {
  const params = useParams<{ subjectId: string }>();
  return <SubjectLessons subjectId={params.subjectId} backHref="/manas" />;
}
