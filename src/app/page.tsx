"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { ResultView } from "@/components/ResultView";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { SessionHistory } from "@/components/SessionHistory";
import { StudyDeck } from "@/types/study";
import { generateStudyDeck, refineStudyDeck, StudyApiError } from "@/lib/api";
import { loadSavedDecks, saveDeck, deleteDeck } from "@/lib/storage";
import { DEMO_PRESETS } from "@/lib/demoData";
import { Sparkles, Info, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  const [currentDeck, setCurrentDeck] = useState<StudyDeck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<StudyApiError | Error | null>(null);
  const [savedDecks, setSavedDecks] = useState<StudyDeck[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState("");

  // Stale request guard
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load saved decks on mount
  useEffect(() => {
    const loaded = loadSavedDecks();
    setSavedDecks(loaded);
    if (loaded.length > 0) {
      setCurrentDeck(loaded[0]);
    } else {
      // Default to first preset so the page is immediately engaging
      setCurrentDeck(DEMO_PRESETS[0].deck);
    }
  }, []);

  // Generate new study deck
  const handleGenerate = async (
    prompt: string,
    level: "beginner" | "intermediate" | "advanced"
  ) => {
    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const reqId = ++requestIdRef.current;

    setActivePrompt(prompt);
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateStudyDeck({ prompt, level }, controller.signal);

      // Stale response guard
      if (reqId !== requestIdRef.current) {
        console.log("Ignored stale response from request id:", reqId);
        return;
      }

      setCurrentDeck(result);
      saveDeck(result);
      setSavedDecks(loadSavedDecks());
    } catch (err: any) {
      if (reqId !== requestIdRef.current) return;
      if (err instanceof StudyApiError && err.type === "stale_request") return;
      console.error("Generation failed:", err);
      setError(err);
    } finally {
      if (reqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Refine active deck with follow-up prompt
  const handleRefine = async (instruction: string) => {
    if (!currentDeck) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const reqId = ++requestIdRef.current;

    setIsRefining(true);
    setError(null);

    try {
      const refined = await refineStudyDeck(
        { currentDeck, instruction },
        controller.signal
      );

      if (reqId !== requestIdRef.current) return;

      setCurrentDeck(refined);
      saveDeck(refined);
      setSavedDecks(loadSavedDecks());
    } catch (err: any) {
      if (reqId !== requestIdRef.current) return;
      if (err instanceof StudyApiError && err.type === "stale_request") return;
      console.error("Refine failed:", err);
      setError(err);
    } finally {
      if (reqId === requestIdRef.current) {
        setIsRefining(false);
      }
    }
  };

  const handleSelectPreset = (deck: StudyDeck) => {
    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    setCurrentDeck(deck);
    saveDeck(deck);
    setSavedDecks(loadSavedDecks());
    setError(null);
  };

  const handleUpdateDeck = (updated: StudyDeck) => {
    setCurrentDeck(updated);
    saveDeck(updated);
    setSavedDecks(loadSavedDecks());
  };

  const handleDeleteDeck = (deckId: string) => {
    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    const updated = deleteDeck(deckId);
    setSavedDecks(updated);
    if (currentDeck?.id === deckId) {
      setCurrentDeck(updated[0] || DEMO_PRESETS[0].deck);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header
        currentDeck={currentDeck}
        onOpenHistory={() => setIsHistoryOpen(true)}
        savedDecksCount={savedDecks.length}
      />

      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {/* Top Input Box */}
        <PromptInput
          onSubmit={handleGenerate}
          isLoading={isLoading}
          onSelectPreset={handleSelectPreset}
        />

        {/* Loading State with simulated steps */}
        {isLoading && <LoadingState topic={activePrompt} />}

        {/* Error State with retry & fallback presets */}
        {error && !isLoading && (
          <ErrorState
            error={error}
            onRetry={() => handleGenerate(activePrompt || "React Hooks", "intermediate")}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {/* Result Interactive View */}
        {currentDeck && !isLoading && (
          <ResultView
            deck={currentDeck}
            onUpdateDeck={handleUpdateDeck}
            onRefine={handleRefine}
            isRefining={isRefining}
          />
        )}
      </main>

      {/* History Drawer Modal */}
      <SessionHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedDecks={savedDecks}
        activeDeckId={currentDeck?.id}
        onSelectDeck={(deck) => {
          requestIdRef.current += 1;
          abortControllerRef.current?.abort();
          setCurrentDeck(deck);
          setError(null);
        }}
        onDeleteDeck={handleDeleteDeck}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Flam Frontend Internship Assignment — AI Interactive Tool</span>
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Structured Data Only • Backend Proxy • Defensive Error Handling</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
