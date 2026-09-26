import { StudyDeck, GenerateRequestBody, RefineRequestBody, ApiResponse, GenerationErrorType } from "@/types/study";
import { parseAndValidateResult } from "./validateResult";

const TIMEOUT_MS = 35000; // 35 seconds max before timeout

/**
 * Custom API Error class with failure categorization
 */
export class StudyApiError extends Error {
  type: GenerationErrorType;
  details?: string;
  rawResponse?: string;

  constructor(message: string, type: GenerationErrorType = "unknown", details?: string, rawResponse?: string) {
    super(message);
    this.name = "StudyApiError";
    this.type = type;
    this.details = details;
    this.rawResponse = rawResponse;
  }
}

/**
 * Generate a new Study Deck via backend proxy
 */
export async function generateStudyDeck(
  params: GenerateRequestBody,
  signal?: AbortSignal
): Promise<StudyDeck> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, TIMEOUT_MS);

  // Combine external abort signal if provided
  const combinedSignal = signal
    ? createCombinedSignal([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    const data: ApiResponse<any> = await response.json().catch(() => ({
      success: false,
      error: "Server returned a non-JSON response.",
      errorType: "malformed_json" as GenerationErrorType,
    }));

    if (!response.ok || !data.success) {
      throw new StudyApiError(
        data.error || `Server responded with status ${response.status}`,
        data.errorType || "network_error",
        data.details
      );
    }

    // Defensive parsing & validation of data payload
    if (typeof data.data === "string") {
      const validated = parseAndValidateResult(data.data, params.prompt.slice(0, 30));
      if (!validated.success || !validated.data) {
        throw new StudyApiError(
          validated.error || "Failed to validate generated content shape.",
          validated.errorType || "wrong_shape",
          validated.details
        );
      }
      return validated.data;
    } else if (typeof data.data === "object" && data.data !== null) {
      // Validate the structured JSON object
      const { validateAndNormalizeStudyDeck } = await import("./validateResult");
      const validated = validateAndNormalizeStudyDeck(data.data, params.prompt.slice(0, 30));
      if (!validated.success || !validated.data) {
        throw new StudyApiError(
          validated.error || "Generated JSON does not match required schema.",
          validated.errorType || "wrong_shape",
          validated.details
        );
      }
      return validated.data;
    }

    throw new StudyApiError("Empty or missing data payload from server.", "empty_response");
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      if (timeoutController.signal.aborted) {
        throw new StudyApiError(
          "Request timed out. The AI model took longer than 35s to respond.",
          "timeout"
        );
      }
      throw new StudyApiError("Request was cancelled by a newer query.", "stale_request");
    }

    if (err instanceof StudyApiError) {
      throw err;
    }

    throw new StudyApiError(
      err.message || "Failed to connect to backend server.",
      "network_error"
    );
  }
}

/**
 * Refine an existing deck with follow-up instructions
 */
export async function refineStudyDeck(
  params: RefineRequestBody,
  signal?: AbortSignal
): Promise<StudyDeck> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, TIMEOUT_MS);

  const combinedSignal = signal
    ? createCombinedSignal([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch("/api/refine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    const data: ApiResponse<any> = await response.json().catch(() => ({
      success: false,
      error: "Server returned a non-JSON response.",
      errorType: "malformed_json" as GenerationErrorType,
    }));

    if (!response.ok || !data.success) {
      throw new StudyApiError(
        data.error || `Server responded with status ${response.status}`,
        data.errorType || "network_error",
        data.details
      );
    }

    if (typeof data.data === "string") {
      const validated = parseAndValidateResult(data.data, params.currentDeck.topic);
      if (!validated.success || !validated.data) {
        throw new StudyApiError(
          validated.error || "Failed to validate refined content shape.",
          validated.errorType || "wrong_shape",
          validated.details
        );
      }
      return validated.data;
    } else if (typeof data.data === "object" && data.data !== null) {
      const { validateAndNormalizeStudyDeck } = await import("./validateResult");
      const validated = validateAndNormalizeStudyDeck(data.data, params.currentDeck.topic);
      if (!validated.success || !validated.data) {
        throw new StudyApiError(
          validated.error || "Refined JSON does not match required schema.",
          validated.errorType || "wrong_shape",
          validated.details
        );
      }
      return validated.data;
    }

    throw new StudyApiError("Empty or missing data payload from server.", "empty_response");
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      if (timeoutController.signal.aborted) {
        throw new StudyApiError("Refinement request timed out.", "timeout");
      }
      throw new StudyApiError("Refinement was cancelled by a newer request.", "stale_request");
    }

    if (err instanceof StudyApiError) {
      throw err;
    }

    throw new StudyApiError(
      err.message || "Failed to refine study deck.",
      "network_error"
    );
  }
}

function createCombinedSignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort();
      return controller.signal;
    }
    sig.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}
