export type QuestionForScoring = {
  id: string;
  type: string; // "single" | "multiple" | "text"
  correctAnswer: string;
  points: number;
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isAnswerCorrect(
  question: QuestionForScoring,
  givenAnswer: string | undefined | null
): boolean {
  const given = (givenAnswer ?? "").trim();
  if (!given) return false;

  if (question.type === "multiple") {
    const correctSet = new Set(
      question.correctAnswer
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const givenSet = new Set(
      given
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    if (correctSet.size !== givenSet.size) return false;
    for (const item of correctSet) {
      if (!givenSet.has(item)) return false;
    }
    return true;
  }

  if (question.type === "text") {
    const acceptable = question.correctAnswer.split("|").map(normalizeText);
    return acceptable.includes(normalizeText(given));
  }

  // single choice
  return given.trim() === question.correctAnswer.trim();
}

export type SectionScoreResult = {
  correctCount: number;
  totalQuestions: number;
  score: number;
};

export function computeSectionScore(
  questions: QuestionForScoring[],
  answers: Map<string, string>,
  maxScore: number | null | undefined
): SectionScoreResult {
  let correctCount = 0;
  let earnedPoints = 0;
  let totalPoints = 0;

  for (const question of questions) {
    totalPoints += question.points;
    if (isAnswerCorrect(question, answers.get(question.id))) {
      correctCount += 1;
      earnedPoints += question.points;
    }
  }

  const score =
    maxScore != null && totalPoints > 0
      ? (earnedPoints / totalPoints) * maxScore
      : earnedPoints;

  return {
    correctCount,
    totalQuestions: questions.length,
    score: Math.round(score * 100) / 100,
  };
}
