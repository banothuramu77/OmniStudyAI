# OmniStudy AI � AI-Powered Interactive Study & Quiz Studio

> **Flam Frontend Internship Assignment**  
> An interactive, structured-data React application that turns free-form text and lecture notes into interactive 3D flashcards, self-grading diagnostic quizzes with **"Re-test Wrong Answers"** mode, key takeaway cheat sheets, and an interactive refinement loop.

---

## ?? Live Features & Core Functionality

- ?? **Strictly Structured Data (Not a Chatbot)**: Requests, validates, and parses strict JSON schemas. Never prints raw model prose.
- ?? **3D Interactive Flashcard Deck**:
  - CSS 3D perspective flip animation with smooth transitions.
  - Mastery status tracking (`Mastered` / `Needs Practice` / `Unseen`).
  - Star & bookmark favorite cards.
  - Audio pronunciation via Web Speech API (`speechSynthesis`).
  - Keyboard navigation: <kbd>Space</kbd> to flip, <kbd>?</kbd> and <kbd>?</kbd> to navigate.
  - Dynamic filters: *All Cards*, *Needs Practice*, *Mastered*, and *Starred*.
  - Shuffle deck order.
- ?? **Diagnostic Quiz with "Re-test Wrong Answers"**:
  - Instant visual feedback on option selection (green/red indicators with icons).
  - Detailed explanation accordion for every question.
  - Score summary card with celebration confetti.
  - **"Re-test Wrong Answers" Mode**: Isolates only incorrect questions for a targeted retry loop.
- ?? **Key Takeaways & Cheat Sheet**:
  - Executive summary + core mental models with a one-click "Copy to Clipboard" button.
- ?? **Refinement Loop (Stretch Goal)**:
  - Follow-up prompt input (e.g. *"Add 3 harder cards about memory leaks"*, *"Focus on real-world interview scenarios"*) that updates the active deck without resetting state.
- ?? **Session Persistence & Export**:
  - Automatic saving to `localStorage`.
  - Saved sessions drawer to reload or delete past decks.
  - Export study sets as Markdown (`.md`) or Raw Structured JSON (`.json`).
- ? **Zero-Config Instant Demo Mode**:
  - 3 pre-validated flagship decks (*React Hooks & Fiber Architecture*, *Core Web Vitals*, *System Design & Scalability*) for instant exploration without needing an API key.

---

## ??? Defensive AI Output Handling (Failure Modes)

Handling model unpredictability and network failures is the core focus of this implementation:

| Failure Mode | How OmniStudy AI Handles It |
|---|---|
| **Malformed JSON** | `extractJsonString()` strips markdown fences (\`\`\`json); `parseRawJson()` cleans unescaped control characters before parsing. If unrecoverable, routes to `ErrorState` with a diagnostic banner and retry trigger. |
| **Wrong Structural Shape** | `validateAndNormalizeStudyDeck()` verifies root object structure, confirms arrays exist, validates question/answer strings, and clamps quiz `correctIndex` within bounds. |
| **Empty Response** | Detected immediately in the validation layer and categorized as `empty_response` with user-friendly retry guidance. |
| **Slow Response / Hang** | 35-second `AbortController` timeout enforces termination with a `timeout` error state, while `LoadingState` displays animated progressive milestone steps. |
| **Stale Responses / Race Conditions** | Tracks an incremental `requestIdRef.current` and cancels in-flight `AbortController` instances when a new query begins. Slower delayed requests can never overwrite newer state. |
| **Missing API Key / Rate Limits** | Catches upstream HTTP 429/401 errors on the server proxy and gracefully suggests instant fallback presets or demo mode. |

---

## ??? Architecture & Project Structure

```
flam-frontend-assignment/
+-- src/
�   +-- app/
�   �   +-- api/
�   �   �   +-- generate/route.ts   # Server-side proxy: calls Gemini API, holds key safely
�   �   �   +-- refine/route.ts     # Refinement endpoint: updates active deck JSON
�   �   +-- globals.css             # Tailwind & 3D CSS perspective utilities
�   �   +-- layout.tsx              # Root HTML & dark mode metadata
�   �   +-- page.tsx                # Main state controller & race condition prevention
�   +-- components/
�   �   +-- Header.tsx              # Brand, theme toggle, export dropdown, history trigger
�   �   +-- PromptInput.tsx         # Free-form input, preset pills, depth selector
�   �   +-- ResultView.tsx          # Tab coordinator (Flashcards, Quiz, Takeaways)
�   �   +-- FlashcardDeck.tsx       # 3D flip card, mastery filters, TTS audio, keyboard nav
�   �   +-- QuizView.tsx            # Multi-choice quiz, explanations, re-test wrong answers
�   �   +-- KeyTakeaways.tsx        # Summary cheat sheet with clipboard export
�   �   +-- RefinementBar.tsx       # Follow-up interactive refinement loop
�   �   +-- SessionHistory.tsx      # Saved decks drawer modal
�   �   +-- LoadingState.tsx        # Multi-step progress animation
�   �   +-- ErrorState.tsx          # Diagnostic error boundary with retry triggers
�   +-- lib/
�   �   +-- api.ts                  # Client fetch wrapper with AbortController & timeouts
�   �   +-- validateResult.ts       # Multi-layer defensive JSON validation & repair
�   �   +-- demoData.ts             # High-quality offline demo presets
�   �   +-- storage.ts              # LocalStorage session manager & file export
�   �   +-- utils.ts                # Class merging utility
�   +-- types/
�       +-- study.ts                # Strict TypeScript interfaces
+-- tests/
�   +-- test-defensive-validation.mjs # Standalone Node.js validation test suite
+-- .env.example
+-- README.md
+-- package.json
```

---

## ?? Quick Start Guide

### Prerequisites
- Node.js 18.17+ or 20+
- npm (or yarn / pnpm)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for live LLM)
Create a `.env.local` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> *Note:* You can obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/). If omitted, the app automatically runs in **Built-in Offline / Demo Mode** with full interactivity!

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To build and start the production server in one command:
```bash
npm start
```

### 4. Run Automated Validation Tests
```bash
npm test
```

---

## ?? AI Usage Disclosure

In accordance with assignment guidelines, here is an honest summary of how AI tools were utilized:
- **Architecture Planning**: Formulating schema boundaries, validation edge cases, and Next.js backend proxy structure.
- **Component Drafting & Types**: Accelerating boilerplate creation for Tailwind classes, Lucide icon imports, and TypeScript interfaces.
- **Defensive Error Testing**: Generating adversarial JSON test vectors (unclosed brackets, markdown code fences, out-of-bounds quiz indexes) for validation testing.
- **Independent Verification**: All component logic, React hooks state transitions, race condition safeguards (`requestIdRef` + `AbortController`), and 3D CSS flip animations were manually audited, compiled, and verified.

---

## ? Time Spent Breakdown

| Phase | Description | Time Spent |
|---|---|---|
| **Phase 1: Architecture & Schema Design** | Planning strict data shapes, backend proxy, and validation boundaries | ~1.0 hr |
| **Phase 2: Defensive Parsing & Error Layer** | Implementing `validateResult.ts`, timeout guards, and test suites | ~1.5 hrs |
| **Phase 3: Interactive UI & Component Build** | 3D Flashcards, Quiz with re-testing, Refinement bar, Audio TTS | ~2.5 hrs |
| **Phase 4: Persistence, Polish & Responsiveness** | LocalStorage history, export features, mobile audit, dark mode | ~1.0 hr |
| **Phase 5: Build Verification & Documentation** | Production compilation, comprehensive README, test execution | ~0.5 hr |
| **Total** | | **~6.5 hrs** |

---

## ?? Known Limitations & Future Roadmap

1. **Token Limits on Huge Notes**: Pasting 10,000+ words in a single prompt can exceed context length. A chunking & map-reduce pipeline would allow multi-chapter book synthesis.
2. **Spaced Repetition Algorithm**: Currently tracks basic mastery (*Mastered* vs *Needs Practice*); adding the SM-2 / Anki spaced-repetition algorithm with scheduled review dates would be a great next step.
3. **Voice Input**: Adding speech-to-text input would allow users to record spoken lecture notes directly.
