"use client";

import React, { useState } from "react";
import { Layers, HelpCircle, Lightbulb, Clock, BarChart2, CheckCircle2, Star, Sparkles } from "lucide-react";
import { StudyDeck, Flashcard, MasteryStatus } from "@/types/study";
import { FlashcardDeck } from "./FlashcardDeck";
import { QuizView } from "./QuizView";
import { KeyTakeaways } from "./KeyTakeaways";
import { RefinementBar } from "./RefinementBar";

interface ResultViewProps {
  deck: StudyDeck;
  onUpdateDeck: (updatedDeck: StudyDeck) => void;
  onRefine: (instruction: string) => void;
  isRefining: boolean;
}

export function ResultView({
  deck,
  onUpdateDeck,
  onRefine,
  isRefining,
}: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<"flashcards" | "quiz" | "takeaways">("flashcards");

  const handleUpdateCardStatus = (cardId: string, status: MasteryStatus) => {
    const updatedCards = deck.cards.map((c) =>
      c.id === cardId ? { ...c, masteryStatus: status } : c
    );
    onUpdateDeck({ ...deck, cards: updatedCards });
  };

  const handleToggleStar = (cardId: string) => {
    const updatedCards = deck.cards.map((c) =>
      c.id === cardId ? { ...c, isStarred: !c.isStarred } : c
    );
    onUpdateDeck({ ...deck, cards: updatedCards });
  };

  const masteredCount = deck.cards.filter((c) => c.masteryStatus === "mastered").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Deck Header & Meta */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              {deck.topic}
            </span>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400 capitalize">
              {deck.difficultyLevel} Level
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <span>~{deck.estimatedMinutes} mins study</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{masteredCount}/{deck.cards.length} Mastered</span>
            </span>
          </div>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
          {deck.title}
        </h1>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-3xl">
          {deck.summary}
        </p>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "flashcards"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>3D Flashcards ({deck.cards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "quiz"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Interactive Quiz ({deck.quiz.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("takeaways")}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "takeaways"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Key Takeaways & Cheat Sheet ({deck.keyTakeaways.length})</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      <div className="min-h-[400px]">
        {activeTab === "flashcards" && (
          <FlashcardDeck
            cards={deck.cards}
            onUpdateCardStatus={handleUpdateCardStatus}
            onToggleStar={handleToggleStar}
          />
        )}

        {activeTab === "quiz" && <QuizView questions={deck.quiz} />}

        {activeTab === "takeaways" && (
          <KeyTakeaways
            takeaways={deck.keyTakeaways}
            summary={deck.summary}
            topic={deck.topic}
          />
        )}
      </div>

      {/* Refinement Loop Component */}
      <div className="pt-6 border-t border-slate-800">
        <RefinementBar onRefine={onRefine} isRefining={isRefining} />
      </div>
    </div>
  );
}
