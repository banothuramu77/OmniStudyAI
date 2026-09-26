import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseAndValidateResult } from "@/lib/validateResult";

const REFINE_SYSTEM_PROMPT = `You are an AI study assistant refinement engine.
You will be provided with an EXISTING StudyDeck JSON and a USER REFINEMENT INSTRUCTION (e.g. "Add 3 harder cards about async bugs", "Make questions more beginner friendly", "Add a card about memory leaks").

You MUST modify or expand the existing StudyDeck and return the entire updated JSON object matching the exact schema:
{
  "title": "string",
  "topic": "string",
  "summary": "string",
  "difficultyLevel": "beginner" | "intermediate" | "advanced",
  "cards": [
    {
      "id": "string",
      "question": "string",
      "answer": "string",
      "hint": "string",
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "quiz": [
    {
      "id": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": number,
      "explanation": "string"
    }
  ],
  "keyTakeaways": ["string", "string"]
}

STRICT RULES:
1. Return ONLY the updated JSON object. No markdown fences, no explanatory text.
2. Preserve existing valuable cards/quiz items while incorporating the requested changes.
3. Ensure all options are realistic and correctIndex is within bounds.`;

export async function POST(req: NextRequest) {
  let fallbackDeck: any = null;
  let fallbackInstruction = "";

  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.currentDeck || typeof body.instruction !== "string" || !body.instruction.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Current deck and a refinement instruction are required.",
          errorType: "wrong_shape",
        },
        { status: 400 }
      );
    }

    const { currentDeck, instruction } = body;
    fallbackDeck = currentDeck;
    fallbackInstruction = instruction;
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      // Smart simulation for refinement in demo mode
      const updatedCards = [...(currentDeck.cards || [])];
      updatedCards.push({
        id: `card-refine-${Date.now()}`,
        question: `[Refined] ${instruction} - Key Concept`,
        answer: `This card was added via the interactive refinement loop to address: "${instruction}".`,
        hint: "Added from refinement prompt.",
        difficulty: "medium",
        masteryStatus: "unseen",
      });

      const updatedTakeaways = [...(currentDeck.keyTakeaways || []), `Refined focus: ${instruction}`];

      return NextResponse.json({
        success: true,
        data: {
          ...currentDeck,
          cards: updatedCards,
          keyTakeaways: updatedTakeaways,
          updatedAt: Date.now(),
        },
        modelUsed: "demo-simulator",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      systemInstruction: REFINE_SYSTEM_PROMPT,
    });

    const userPrompt = `EXISTING DECK:\n${JSON.stringify(currentDeck, null, 2)}\n\nUSER INSTRUCTION:\n${instruction}`;
    const result = await generateWithRetry(model, userPrompt);
    const responseText = result.response.text();

    const validation = parseAndValidateResult(responseText, currentDeck.topic);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || "The model returned invalid JSON during refinement.",
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
        id: currentDeck.id,
        createdAt: currentDeck.createdAt || Date.now(),
        updatedAt: Date.now(),
      },
      modelUsed: "gemini-3.8-flash",
    });
  } catch (err: any) {
    console.error("Refine API error:", err);
    const temporaryProviderFailure =
      err?.status === 429 || err?.status === 503 || err?.message?.includes("high demand");

    if (temporaryProviderFailure) {
      return NextResponse.json({
        success: true,
        data: createFallbackRefinement(fallbackDeck, fallbackInstruction),
        modelUsed: "local-refinement-fallback (Gemini temporarily busy)",
        warning: "Gemini was temporarily busy, so a local refinement was applied.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Refinement failed: ${err?.message || "Internal server error"}`,
        errorType: err?.status === 503 ? "provider_busy" : err?.status === 429 ? "rate_limited" : "network_error",
        details: err?.message,
      },
      { status: err?.status >= 400 && err?.status < 600 ? err.status : 500 }
    );
  }
}

function createFallbackRefinement(currentDeck: any, instruction: string) {
  return {
    ...currentDeck,
    cards: [
      ...(Array.isArray(currentDeck.cards) ? currentDeck.cards : []),
      {
        id: `card-refine-fallback-${Date.now()}`,
        question: `[Refined] What is the key idea behind ${instruction}?`,
        answer: `Review the existing study material and focus on the requested refinement: ${instruction}.`,
        hint: "Connect the new instruction to the deck's core concepts.",
        difficulty: "medium",
        masteryStatus: "unseen",
        isStarred: false,
      },
    ],
    keyTakeaways: [
      ...(Array.isArray(currentDeck.keyTakeaways) ? currentDeck.keyTakeaways : []),
      `Refined focus: ${instruction}`,
    ],
    updatedAt: Date.now(),
  };
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
