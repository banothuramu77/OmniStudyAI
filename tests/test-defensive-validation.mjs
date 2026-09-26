import assert from "assert";

// Simple re-implementation of the pure extraction & validation logic to run in standalone Node test
function extractJsonString(raw) {
  if (!raw || typeof raw !== "string") return "";
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
    cleaned = cleaned.trim();
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function parseRawJson(raw) {
  if (!raw || !raw.trim()) {
    return { parsed: null, error: "Empty response received from the model." };
  }
  const jsonStr = extractJsonString(raw);
  try {
    const parsed = JSON.parse(jsonStr);
    return { parsed };
  } catch (initialErr) {
    try {
      const sanitized = jsonStr.replace(/[\u0000-\u001F]+/g, (match) =>
        match === "\n" || match === "\r" || match === "\t" ? match : ""
      );
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

function validateAndNormalizeStudyDeck(rawObj, fallbackTopic = "Generated Study Set") {
  if (!rawObj || typeof rawObj !== "object" || Array.isArray(rawObj)) {
    return { success: false, error: "Invalid root structure", errorType: "wrong_shape" };
  }

  const hasCards = Array.isArray(rawObj.cards) && rawObj.cards.length > 0;
  const hasQuiz = Array.isArray(rawObj.quiz) && rawObj.quiz.length > 0;

  if (!hasCards && !hasQuiz) {
    return { success: false, error: "Missing required content", errorType: "wrong_shape" };
  }

  const validCards = [];
  if (Array.isArray(rawObj.cards)) {
    rawObj.cards.forEach((card, idx) => {
      if (card && typeof card === "object") {
        const question = typeof card.question === "string" ? card.question.trim() : "";
        const answer = typeof card.answer === "string" ? card.answer.trim() : "";
        if (question && answer) {
          validCards.push({
            id: card.id || `card-${idx}`,
            question,
            answer,
            hint: card.hint || undefined,
            difficulty: ["easy", "medium", "hard"].includes(card.difficulty) ? card.difficulty : "medium",
            masteryStatus: "unseen",
            isStarred: false,
          });
        }
      }
    });
  }

  const validQuiz = [];
  if (Array.isArray(rawObj.quiz)) {
    rawObj.quiz.forEach((item, idx) => {
      if (item && typeof item === "object") {
        const question = typeof item.question === "string" ? item.question.trim() : "";
        let options = [];
        if (Array.isArray(item.options)) {
          options = item.options.map((o) => String(o).trim()).filter((o) => o.length > 0);
        }
        let correctIndex = typeof item.correctIndex === "number" ? Math.floor(item.correctIndex) : 0;
        if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0;

        if (question && options.length >= 2) {
          validQuiz.push({
            id: item.id || `quiz-${idx}`,
            question,
            options,
            correctIndex,
            explanation: item.explanation || "No explanation",
          });
        }
      }
    });
  }

  if (validCards.length === 0 && validQuiz.length === 0) {
    return { success: false, error: "Parsed data was empty", errorType: "empty_response" };
  }

  return {
    success: true,
    data: {
      id: "deck-test",
      title: rawObj.title || "Test Title",
      topic: rawObj.topic || fallbackTopic,
      summary: rawObj.summary || "Summary",
      difficultyLevel: rawObj.difficultyLevel || "intermediate",
      cards: validCards,
      quiz: validQuiz,
      keyTakeaways: rawObj.keyTakeaways || [],
    },
  };
}

console.log("Running Defensive Error Handling Test Suite...\n");

// TEST 1: Empty response
{
  const emptyRes = parseRawJson("");
  assert.strictEqual(emptyRes.parsed, null, "Should return null for empty string");
  console.log("? Test 1 Passed: Empty response handled gracefully without crashing.");
}

// TEST 2: Malformed JSON with trailing commas and unclosed braces
{
  const malformed = '{"cards": [{"question": "Q1", "answer": "A1"';
  const res = parseRawJson(malformed);
  assert.strictEqual(res.parsed, null);
  assert.ok(res.error.includes("Malformed JSON"));
  console.log("? Test 2 Passed: Malformed unclosed JSON detected and categorized.");
}

// TEST 3: Markdown fenced JSON (```json ... ```)
{
  const fenced = '```json\n{\n  "title": "React Deck",\n  "cards": [{"question": "What is state?", "answer": "State is data held in a component."}]\n}\n```';
  const res = parseRawJson(fenced);
  assert.ok(res.parsed !== null);
  const validated = validateAndNormalizeStudyDeck(res.parsed);
  assert.strictEqual(validated.success, true);
  assert.strictEqual(validated.data.cards.length, 1);
  console.log("? Test 3 Passed: Markdown code fences stripped and JSON parsed cleanly.");
}

// TEST 4: Wrong Shape (missing cards & quiz)
{
  const wrongShape = { someRandomKey: 123, author: "AI" };
  const res = validateAndNormalizeStudyDeck(wrongShape);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.errorType, "wrong_shape");
  console.log("? Test 4 Passed: Wrong root shape rejected with wrong_shape errorType.");
}

// TEST 5: Out of bounds correctIndex in Quiz
{
  const badQuiz = {
    cards: [],
    quiz: [
      {
        question: "What is 2+2?",
        options: ["3", "4"],
        correctIndex: 99, // Out of bounds!
        explanation: "2+2=4",
      },
    ],
  };
  const validated = validateAndNormalizeStudyDeck(badQuiz);
  assert.strictEqual(validated.success, true);
  assert.strictEqual(validated.data.quiz[0].correctIndex, 0, "Out of bounds correctIndex normalized to safe 0");
  console.log("? Test 5 Passed: Out-of-bounds quiz correctIndex safely clamped without crash.");
}

console.log("\n All 5 Defensive AI Output Handling Tests Passed Successfully!");
