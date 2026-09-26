export type MasteryStatus = "unseen" | "learning" | "mastered" | "review";

export type CardDifficulty = "easy" | "medium" | "hard";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  difficulty?: CardDifficulty;
  masteryStatus?: MasteryStatus;
  isStarred?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userSelected?: number;
}

export interface StudyDeck {
  id: string;
  title: string;
  topic: string;
  summary: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  cards: Flashcard[];
  quiz: QuizQuestion[];
  keyTakeaways: string[];
  createdAt: number;
  updatedAt?: number;
  sourceText?: string;
}

export type GenerationErrorType =
  | "network_error"
  | "api_key_missing"
  | "rate_limited"
  | "provider_busy"
  | "timeout"
  | "malformed_json"
  | "wrong_shape"
  | "empty_response"
  | "stale_request"
  | "unknown";

export interface ApiError {
  type: GenerationErrorType;
  message: string;
  details?: string;
  rawResponse?: string;
}

export interface GenerateRequestBody {
  prompt: string;
  level?: "beginner" | "intermediate" | "advanced";
  cardCount?: number;
  quizCount?: number;
}

export interface RefineRequestBody {
  currentDeck: StudyDeck;
  instruction: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: GenerationErrorType;
  details?: string;
  modelUsed?: string;
}
