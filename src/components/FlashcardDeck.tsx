"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  Volume2,
  Star,
  CheckCircle,
  Filter,
  Lightbulb,
} from "lucide-react";
import { Flashcard, MasteryStatus } from "@/types/study";

interface FlashcardDeckProps {
  cards: Flashcard[];
  onUpdateCardStatus: (cardId: string, status: MasteryStatus) => void;
  onToggleStar: (cardId: string) => void;
}

export function FlashcardDeck({
  cards,
  onUpdateCardStatus,
  onToggleStar,
}: FlashcardDeckProps) {
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<"all" | "learning" | "mastered" | "starred">("all");
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setDeck(cards);
  }, [cards]);

  const filteredCards = deck.filter((c) => {
    if (filter === "learning") return c.masteryStatus === "learning" || c.masteryStatus === "unseen";
    if (filter === "mastered") return c.masteryStatus === "mastered";
    if (filter === "starred") return c.isStarred;
    return true;
  });

  useEffect(() => {
    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(Math.max(0, filteredCards.length - 1));
    }
    setIsFlipped(false);
    setShowHint(false);
  }, [filter, filteredCards.length]);

  const currentCard = filteredCards[currentIndex];

  const handleNext = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev < filteredCards.length - 1 ? prev + 1 : 0));
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
  }, [filteredCards.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  const masteredCount = deck.filter((c) => c.masteryStatus === "mastered").length;
  const learningCount = deck.filter((c) => c.masteryStatus === "learning").length;
  const starredCount = deck.filter((c) => c.isStarred).length;

  if (deck.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
        <p>No flashcards generated in this deck.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:px-4">
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
          <span className="flex items-center text-slate-400 mr-1">
            <Filter className="h-3.5 w-3.5 mr-1" /> View:
          </span>
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              filter === "all" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All ({deck.length})
          </button>
          <button
            onClick={() => setFilter("learning")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              filter === "learning" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Needs Practice ({learningCount})
          </button>
          <button
            onClick={() => setFilter("mastered")}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              filter === "mastered" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Mastered ({masteredCount})
          </button>
          {starredCount > 0 && (
            <button
              onClick={() => setFilter("starred")}
              className={`flex items-center space-x-1 rounded-lg px-2.5 py-1 font-medium transition ${
                filter === "starred" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Star className="h-3 w-3 fill-current text-amber-400" />
              <span>Starred ({starredCount})</span>
            </button>
          )}
        </div>

        <button
          onClick={handleShuffle}
          className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          <Shuffle className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Shuffle</span>
        </button>
      </div>

      {filteredCards.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <p className="text-sm font-medium">No cards match the selected "{filter}" filter.</p>
          <button
            onClick={() => setFilter("all")}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white"
          >
            Show All Cards
          </button>
        </div>
      ) : (
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              Card <span className="font-bold text-white">{currentIndex + 1}</span> of {filteredCards.length}
            </span>
            <span className="hidden sm:inline text-slate-500">
              Space to flip, ? ? to navigate
            </span>
          </div>

          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
            />
          </div>

          <div
            className="perspective-1000 min-h-[320px] sm:min-h-[360px] w-full cursor-pointer select-none"
            onClick={handleFlip}
          >
            <div
              className={`relative h-full min-h-[320px] sm:min-h-[360px] w-full rounded-2xl border transition-all duration-500 transform-style-3d ${
                isFlipped ? "rotate-y-180 border-purple-500/40" : "border-indigo-500/30"
              } bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-xl`}
            >
              <div className="backface-hidden absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                      QUESTION
                    </span>
                    {currentCard.difficulty && (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 capitalize">
                        {currentCard.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => speakText(currentCard.question)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Read aloud"
                    >
                      <Volume2 className={`h-4 w-4 ${isSpeaking ? "text-indigo-400 animate-pulse" : ""}`} />
                    </button>
                    <button
                      onClick={() => onToggleStar(currentCard.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          currentCard.isStarred ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-lg font-medium text-slate-100 sm:text-2xl leading-relaxed">
                    {currentCard.question}
                  </p>

                  {currentCard.hint && (
                    <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                      {!showHint ? (
                        <button
                          onClick={() => setShowHint(true)}
                          className="inline-flex items-center space-x-1 rounded-md bg-indigo-950/60 px-2.5 py-1 text-xs text-indigo-300 hover:bg-indigo-900/60"
                        >
                          <Lightbulb className="h-3 w-3 text-amber-400" />
                          <span>Show Hint</span>
                        </button>
                      ) : (
                        <div className="inline-block rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200">
                          ?? <strong>Hint:</strong> {currentCard.hint}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Click to flip</span>
                  <div className="flex items-center space-x-1">
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Flip Card</span>
                  </div>
                </div>
              </div>

              <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                    ANSWER
                  </span>

                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => speakText(currentCard.answer)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleStar(currentCard.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          currentCard.isStarred ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="my-auto overflow-y-auto max-h-[190px] py-2 text-center">
                  <p className="text-base text-slate-200 sm:text-lg leading-relaxed font-normal">
                    {currentCard.answer}
                  </p>
                </div>

                <div
                  className="flex items-center justify-between border-t border-slate-800/80 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-slate-400">Did you recall it?</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        onUpdateCardStatus(currentCard.id, "learning");
                        handleNext();
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        currentCard.masteryStatus === "learning"
                          ? "bg-amber-600 text-white"
                          : "bg-slate-800 text-amber-300 hover:bg-amber-950/60"
                      }`}
                    >
                      Need Practice
                    </button>
                    <button
                      onClick={() => {
                        onUpdateCardStatus(currentCard.id, "mastered");
                        handleNext();
                      }}
                      className={`flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        currentCard.masteryStatus === "mastered"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-emerald-300 hover:bg-emerald-950/60"
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      <span>Mastered</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleFlip}
              className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-4 py-2.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-900/60 hover:text-white"
            >
              <RotateCw className="inline-block h-3.5 w-3.5 mr-1" />
              <span>Flip</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
