import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseAndValidateResult } from "@/lib/validateResult";
import { DEMO_PRESETS } from "@/lib/demoData";

const SYSTEM_PROMPT = `You are an expert educational curriculum designer and interactive study tool generator.
Given notes, topics, or study material from the user, create an engaging, highly structured study set.

You MUST respond with a single, valid JSON object matching this exact TypeScript structure:
{
  "title": "string (A concise, engaging title for the study set)",
  "topic": "string (Short topic category, e.g. React Architecture, Photosynthesis, World War II)",
  "summary": "string (2-3 sentence overview of what is covered)",
  "difficultyLevel": "beginner" | "intermediate" | "advanced",
  "cards": [
    {
      "id": "string (e.g. card-1)",
      "question": "string (Direct, testable concept or question)",
      "answer": "string (Clear, comprehensive, and accurate explanation)",
      "hint": "string (Optional helpful recall hint)",
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "quiz": [
    {
      "id": "string (e.g. quiz-1)",
      "question": "string (Multiple choice question testing deep understanding)",
      "options": ["string (Option A)", "string (Option B)", "string (Option C)", "string (Option D)"],
      "correctIndex": number (0, 1, 2, or 3 representing the correct index in options),
      "explanation": "string (Detailed explanation of why the correct option is right and others are wrong)"
    }
  ],
  "keyTakeaways": [
    "string (Essential bullet point 1)",
    "string (Essential bullet point 2)",
    "string (Essential bullet point 3)"
  ]
}

STRICT RULES:
1. Return ONLY the JSON object. Do not include markdown code block formatting (like \`\`\`json), do not include any introductory or concluding text.
2. Provide at least 4-8 high quality flashcards and 3-6 multiple choice quiz questions.
3. Ensure all options in the quiz are realistic and plausible distractors.
4. Set "correctIndex" accurately within bounds (0 to options.length - 1).`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "A text prompt or study notes are required.",
          errorType: "wrong_shape",
        },
        { status: 400 }
      );
    }

    const { prompt, level } = body;
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // If no API key is set, check if prompt matches a preset or generate a smart simulation
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY configured. Providing simulated smart response based on input.");
      
      // Match against presets if relevant keywords exist
      const lower = prompt.toLowerCase();
      const matchedPreset = DEMO_PRESETS.find(
        (p) =>
          lower.includes(p.name.toLowerCase()) ||
          lower.includes(p.deck.topic.toLowerCase()) ||
          lower.includes("react") && p.id === "react-internals" ||
          (lower.includes("perf") || lower.includes("vital")) && p.id === "web-perf" ||
          (lower.includes("system") || lower.includes("design") || lower.includes("cache")) && p.id === "system-design"
      );

      if (matchedPreset) {
        return NextResponse.json({
          success: true,
          data: {
            ...matchedPreset.deck,
            id: `deck-${Date.now()}`,
            createdAt: Date.now(),
            sourceText: prompt,
          },
          modelUsed: "demo-simulator (Set GEMINI_API_KEY for live LLM)",
        });
      }

      // Generate a structured dynamic fallback based on the user's input
      const dynamicDeck = {
        title: prompt.length > 40 ? `${prompt.slice(0, 40)}... Study Set` : `${prompt} Essentials`,
        topic: prompt.slice(0, 30),
        summary: `Interactive study cards and diagnostic quiz generated for: "${prompt.slice(0, 100)}"`,
        difficultyLevel: level || "intermediate",
        cards: [
          {
            id: `card-sim-1`,
            question: `What are the core fundamentals of ${prompt.slice(0, 30)}?`,
            answer: `The foundational aspects revolve around understanding core principles, component relationships, and execution flow.`,
            hint: "Focus on primary definitions and concepts.",
            difficulty: "easy",
          },
          {
            id: `card-sim-2`,
            question: `How do edge cases and common pitfalls affect ${prompt.slice(0, 30)}?`,
            answer: `Pitfalls typically occur when assumptions break, concurrency isn't handled, or boundaries are exceeded.`,
            hint: "Consider error handling and scale.",
            difficulty: "medium",
          },
          {
            id: `card-sim-3`,
            question: `What are the best practices for optimizing ${prompt.slice(0, 30)}?`,
            answer: `Best practices include modularity, defensive error checking, caching frequent lookups, and rigorous testing.`,
            hint: "Think about maintainability and performance.",
            difficulty: "hard",
          },
        ],
        quiz: [
          {
            id: `quiz-sim-1`,
            question: `Which statement regarding ${prompt.slice(0, 30)} is most accurate?`,
            options: [
              "It requires careful validation and adherence to fundamental rules",
              "It operates without any constraints or state changes",
              "It has been deprecated across all modern environments",
              "It should only ever be used in single-threaded environments",
            ],
            correctIndex: 0,
            explanation: "Core concepts always require structured validation and adherence to system constraints.",
          },
          {
            id: `quiz-sim-2`,
            question: `When debugging an issue with ${prompt.slice(0, 30)}, what should be your first diagnostic step?`,
            options: [
              "Inspect state transitions, verify input parameters, and check edge cases",
              "Immediately delete the entire configuration",
              "Ignore all warning logs and retry continuously",
              "Restart the server without reviewing logs",
            ],
            correctIndex: 0,
            explanation: "Methodical debugging requires checking inputs, state changes, and error logs first.",
          },
        ],
        keyTakeaways: [
          `Mastering ${prompt.slice(0, 30)} requires understanding key primitives and failure handling.`,
          "Defensive architecture prevents silent bugs and cascade failures.",
          "Add GEMINI_API_KEY to .env.local to enable live model inference on any arbitrary text.",
        ],
      };

      const validated = parseAndValidateResult(JSON.stringify(dynamicDeck), prompt.slice(0, 30));
      return NextResponse.json({
        success: true,
        data: validated.data,
        modelUsed: "built-in-generator (Demo Mode: add GEMINI_API_KEY in .env.local for live LLM)",
      });
    }

    // Call live Google Gemini API
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.8-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
        systemInstruction: SYSTEM_PROMPT,
      });

      const userPrompt = `Target Level: ${level || "intermediate"}\n\nStudy Material / Topic:\n${prompt}`;
      const result = await generateWithRetry(model, userPrompt);
      const responseText = result.response.text();

      const validation = parseAndValidateResult(responseText, prompt.slice(0, 30));

      if (!validation.success || !validation.data) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error || "The AI generated malformed data that could not be parsed.",
            errorType: validation.errorType || "malformed_json",
            details: validation.details || responseText.slice(0, 400),
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...validation.data,
          sourceText: prompt,
        },
        modelUsed: "gemini-3.8-flash",
      });
    } catch (apiErr: any) {
      console.error("Gemini API Error:", apiErr);
      const status = apiErr?.status || 500;
      const isRateLimit =
        status === 429 ||
        status === 503 ||
        apiErr?.message?.includes("quota") ||
        apiErr?.message?.includes("RESOURCE_EXHAUSTED") ||
        apiErr?.message?.includes("high demand");
      const isAuthError = status === 400 || status === 401 || status === 403 || apiErr?.message?.includes("API_KEY_INVALID");

      return NextResponse.json(
        {
          success: false,
          error: status === 503 || apiErr?.message?.includes("high demand")
            ? "Gemini is temporarily unavailable because the provider is experiencing high demand. Please try again shortly."
            : isRateLimit
            ? "Gemini API rate limit reached. Please wait a moment before trying again."
            : isAuthError
            ? "Invalid or unauthorized GEMINI_API_KEY. Please check your .env.local file."
            : `AI Generation failed: ${apiErr?.message || "Unknown upstream provider error"}`,
          errorType: status === 503 || apiErr?.message?.includes("high demand")
            ? "provider_busy"
            : isRateLimit
            ? "rate_limited"
            : isAuthError
            ? "api_key_missing"
            : "network_error",
          details: apiErr?.message,
        },
        { status: status >= 400 && status < 600 ? status : 500 }
      );
    }
  } catch (err: any) {
    console.error("Unexpected Server Error in /api/generate:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error while processing study tool generation.",
        errorType: "network_error",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}

async function generateWithRetry(model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>, prompt: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let timeoutId: ReturnType<typeof setTimeout>;
    try {
      return await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(Object.assign(new Error("The AI provider timed out."), { status: 504 })),
            35000
          );
        }),
      ]);
    } catch (error: any) {
      const status = error?.status;
      const temporaryFailure = status === 429 || status === 503 || error?.message?.includes("high demand");
      if (!temporaryFailure || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, [2000, 5000, 10000][attempt]));
    } finally {
      clearTimeout(timeoutId!);
    }
  }
  throw new Error("The AI provider did not return a response.");
}
