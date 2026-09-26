"use client";

import React from "react";
import { X, Trash2, Calendar, BookOpen, Layers, HelpCircle, ArrowRight } from "lucide-react";
import { StudyDeck } from "@/types/study";

interface SessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  savedDecks: StudyDeck[];
  activeDeckId?: string;
  onSelectDeck: (deck: StudyDeck) => void;
  onDeleteDeck: (deckId: string) => void;
}

export function SessionHistory({
  isOpen,
  onClose,
  savedDecks,
  activeDeckId,
  onSelectDeck,
  onDeleteDeck,
}: SessionHistoryProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative h-full w-full max-w-md border-l border-slate-800 bg-slate-900 p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white text-lg">Saved Study Decks</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List of saved decks */}
        <div className="mt-6 space-y-3">
          {savedDecks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <p>No saved decks yet.</p>
              <p className="mt-1 text-xs text-slate-500">
                Generate a study set or choose a preset to save it automatically.
              </p>
            </div>
          ) : (
            savedDecks.map((deck) => {
              const isActive = deck.id === activeDeckId;
              const dateStr = new Date(deck.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={deck.id}
                  className={`group relative rounded-xl border p-4 transition-all duration-200 ${
                    isActive
                      ? "border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="cursor-pointer flex-1 pr-4"
                      onClick={() => {
                        onSelectDeck(deck);
                        onClose();
                      }}
                    >
                      <h4 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300">
                        {deck.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                        {deck.summary}
                      </p>

                      <div className="mt-3 flex items-center space-x-3 text-[11px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Layers className="h-3 w-3 text-indigo-400" />
                          <span>{deck.cards.length} cards</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <HelpCircle className="h-3 w-3 text-purple-400" />
                          <span>{deck.quiz.length} quiz</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{dateStr}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDeck(deck.id);
                      }}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400"
                      title="Delete deck"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
