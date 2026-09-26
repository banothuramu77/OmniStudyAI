import { StudyDeck, Flashcard, QuizQuestion, GenerationErrorType } from "@/types/study";

export interface ValidationResult {
  success: boolean;
  data?: StudyDeck;
  error?: string;
  errorType?: GenerationErrorType;
  details?: string;
}

/**
 * Clean up raw LLM string output by removing markdown fences, leading/trailing whitespace, etc.
 */
export function extractJsonString(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let cleaned = raw.trim();

  // Strip markdown code blocks like ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
    cleaned = cleaned.trim();
  }

  // Look for first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Attempt to defensively parse and repair raw JSON strings
 */
export function parseRawJson(raw: string): { parsed: any; error?: string } {
  if (!raw || !raw.trim()) {
    return { parsed: null, error: "Empty response received from the model." };
  }

  const jsonStr = extractJsonString(raw);

  try {
    const parsed = JSON.parse(jsonStr);
    return { parsed };
  } catch (initialErr: any) {
    // Attempt basic fallback fixes: replace unescaped control characters
    try {
      const sanitized = jsonStr
        .replace(/[\u0000-\u001F]+/g, (match) => (match === "\n" || match === "\r" || match === "\t" ? match : ""));
      const parsed = JSON.parse(sanitized);
      return { parsed };
    } catch {
      return {
        parsed: null,
        error: `Malformed JSON: ${initialErr?.message || "Syntax error during parsing"}`,
      };
    }
  }
}

/**
 * Validates and normalizes raw parsed JSON into a strictly typed StudyDeck
 */
export function validateAndNormalizeStudyDeck(
  rawObj: any,
  fallbackTopic = "Generated Study Set"
): ValidationResult {
  if (!rawObj || typeof rawObj !== "object" || Array.isArray(rawObj)) {
    return {
      success: false,
      error: "Invalid root structure: Expected a JSON object with cards and quiz data.",
      errorType: "wrong_shape",
    };
  }

  // Check if it has at least cards or quiz
  const hasCards = Array.isArray(rawObj.cards) && rawObj.cards.length > 0;
  const hasQuiz = Array.isArray(rawObj.quiz) && rawObj.quiz.length > 0;

  if (!hasCards && !hasQuiz) {
    return {
      success: false,
      error: "Missing required content: The AI response contained neither valid flashcards nor quiz questions.",
      errorType: "wrong_shape",
      details: "Expected 'cards' array or 'quiz' array in the response.",
    };
  }

  // Normalize Flashcards
  const validCards: Flashcard[] = [];
  if (Array.isArray(rawObj.cards)) {
    rawObj.cards.forEach((card: any, idx: number) => {
      if (card && typeof card === "object") {
        const question = typeof card.question === "string" ? card.question.trim() : "";
        const answer = typeof card.answer === "string" ? card.answer.trim() : "";

        if (question && answer) {
          validCards.push({
            id: typeof card.id === "string" && card.id ? card.id : `card-${Date.now()}-${idx}`,
            question,
            answer,
            hint: typeof card.hint === "string" ? card.hint.trim() : undefined,
            difficulty: ["easy", "medium", "hard"].includes(card.difficulty) ? card.difficulty : "medium",
            masteryStatus: "unseen",
            isStarred: false,
          });
        }
      }
    });
  }

  // Normalize Quiz Questions
  const validQuiz: QuizQuestion[] = [];
  if (Array.isArray(rawObj.quiz)) {
    rawObj.quiz.forEach((item: any, idx: number) => {
      if (item && typeof item === "object") {
        const question = typeof item.question === "string" ? item.question.trim() : "";
        let options: string[] = [];

        if (Array.isArray(item.options)) {
          options = item.options
            .map((opt: any) => (typeof opt === "string" ? opt.trim() : String(opt || "")))
            .filter((opt: string) => opt.length > 0);
        }

        let correctIndex = typeof item.correctIndex === "number" ? Math.floor(item.correctIndex) : 0;
        if (correctIndex < 0 || correctIndex >= options.length) {
          correctIndex = 0;
        }

        const explanation =
          typeof item.explanation === "string" && item.explanation.trim()
            ? item.explanation.trim()
            : "No specific explanation provided.";

        // We require a question and at least 2 multiple choice options
        if (question && options.length >= 2) {
          validQuiz.push({
            id: typeof item.id === "string" && item.id ? item.id : `quiz-${Date.now()}-${idx}`,
            question,
            options,
            correctIndex,
            explanation,
          });
        }
      }
    });
  }

  // Ensure we still have at least cards or quiz after normalization
  if (validCards.length === 0 && validQuiz.length === 0) {
    return {
      success: false,
      error: "Parsed data was empty: flashcards and quiz questions lacked valid question/answer fields.",
      errorType: "empty_response",
    };
  }

  // Normalize Key Takeaways
  const keyTakeaways: string[] = [];
  if (Array.isArray(rawObj.keyTakeaways)) {
    rawObj.keyTakeaways.forEach((t: any) => {
      if (typeof t === "string" && t.trim()) {
        keyTakeaways.push(t.trim());
      }
    });
  }

  const topic =
    typeof rawObj.topic === "string" && rawObj.topic.trim() ? rawObj.topic.trim() : fallbackTopic;
  const title =
    typeof rawObj.title === "string" && rawObj.title.trim()
      ? rawObj.title.trim()
      : `${topic} Study Set`;
  const summary =
    typeof rawObj.summary === "string" && rawObj.summary.trim()
      ? rawObj.summary.trim()
      : `Comprehensive interactive study tool for ${topic}.`;

  const difficultyLevel = ["beginner", "intermediate", "advanced"].includes(rawObj.difficultyLevel)
    ? rawObj.difficultyLevel
    : "intermediate";

  const deck: StudyDeck = {
    id: `deck-${Date.now()}`,
    title,
    topic,
    summary,
    difficultyLevel,
    estimatedMinutes: Math.max(3, Math.ceil(validCards.length * 1.5 + validQuiz.length * 1)),
    cards: validCards,
    quiz: validQuiz,
    keyTakeaways,
    createdAt: Date.now(),
  };

  return {
    success: true,
    data: deck,
  };
}

/**
 * Full pipeline validation from raw LLM string to validated StudyDeck
 */
export function parseAndValidateResult(raw: string, fallbackTopic?: string): ValidationResult {
  if (!raw || !raw.trim()) {
    return {
      success: false,
      error: "Received an empty response from the AI model.",
      errorType: "empty_response",
    };
  }

  const { parsed, error } = parseRawJson(raw);
  if (error || !parsed) {
    return {
      success: false,
      error: error || "Failed to parse JSON response.",
      errorType: "malformed_json",
      details: raw.slice(0, 300),
    };
  }

  return validateAndNormalizeStudyDeck(parsed, fallbackTopic);
}
