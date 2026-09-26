import { StudyDeck } from "@/types/study";

const STORAGE_KEY = "flam_study_decks_v1";
const RECENT_DECK_KEY = "flam_active_deck_id";

export function loadSavedDecks(): StudyDeck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read saved decks from localStorage:", err);
    return [];
  }
}

export function saveDeck(deck: StudyDeck): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSavedDecks();
    const index = existing.findIndex((d) => d.id === deck.id);
    let updated: StudyDeck[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...deck, updatedAt: Date.now() };
    } else {
      updated = [deck, ...existing];
    }
    // Limit to 20 most recent decks
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 20)));
    localStorage.setItem(RECENT_DECK_KEY, deck.id);
  } catch (err) {
    console.error("Failed to save deck to localStorage:", err);
  }
}

export function deleteDeck(deckId: string): StudyDeck[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = loadSavedDecks();
    const updated = existing.filter((d) => d.id !== deckId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to delete deck from localStorage:", err);
    return [];
  }
}

export function getActiveDeckId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(RECENT_DECK_KEY);
}

export function exportDeckAsJson(deck: StudyDeck): void {
  if (typeof window === "undefined") return;
  const jsonStr = JSON.stringify(deck, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${deck.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-study-deck.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDeckAsMarkdown(deck: StudyDeck): void {
  if (typeof window === "undefined") return;
  let md = `# ${deck.title}\n\n`;
  md += `**Topic:** ${deck.topic} | **Level:** ${deck.difficultyLevel} | **Est. Time:** ${deck.estimatedMinutes} mins\n\n`;
  md += `> ${deck.summary}\n\n---\n\n`;

  md += `## ?? Flashcards (${deck.cards.length})\n\n`;
  deck.cards.forEach((c, idx) => {
    md += `### Card ${idx + 1}: ${c.question}\n`;
    md += `**Answer:** ${c.answer}\n`;
    if (c.hint) md += `*Hint: ${c.hint}*\n`;
    md += `\n`;
  });

  md += `\n---\n\n## ?? Interactive Quiz (${deck.quiz.length} Questions)\n\n`;
  deck.quiz.forEach((q, idx) => {
    md += `### Q${idx + 1}: ${q.question}\n`;
    q.options.forEach((opt, optIdx) => {
      const isCorrect = optIdx === q.correctIndex ? "?" : "?";
      md += `- ${isCorrect} **${String.fromCharCode(65 + optIdx)}.** ${opt}\n`;
    });
    md += `\n*Explanation:* ${q.explanation}\n\n`;
  });

  md += `\n---\n\n## ?? Key Takeaways\n\n`;
  deck.keyTakeaways.forEach((t) => {
    md += `- ${t}\n`;
  });

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${deck.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-study-guide.md`;
  a.click();
  URL.revokeObjectURL(url);
}
