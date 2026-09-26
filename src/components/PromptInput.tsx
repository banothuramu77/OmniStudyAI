"use client";

import React, { useRef, useState } from "react";
import { Sparkles, ArrowRight, Wand2, X, Zap } from "lucide-react";
import { DEMO_PRESETS } from "@/lib/demoData";
import { StudyDeck } from "@/types/study";

interface PromptInputProps {
  onSubmit: (prompt: string, level: "beginner" | "intermediate" | "advanced") => void;
  isLoading: boolean;
  onSelectPreset: (deck: StudyDeck) => void;
}

const SAMPLE_PROMPTS = [
  "JavaScript Event Loop, Microtasks vs Macrotasks, and Call Stack",
  "Photosynthesis, Light-dependent reactions and Calvin Cycle",
  "World War II: Major turning points, Battle of Midway and Stalingrad",
  "SQL Query Optimization, Indexing strategies (B-Tree vs Hash)",
];

export function PromptInput({ onSubmit, isLoading, onSelectPreset }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const syncPrompt = (value: string) => {
    setPrompt(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPrompt = promptInputRef.current?.value ?? prompt;
    if (!currentPrompt.trim() || isLoading) return;
    onSubmit(currentPrompt.trim(), level);
  };

  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-md sm:p-6">
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white sm:text-xl">
            Create an Interactive Study Set
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">
          Paste lecture notes or describe any topic. The AI turns it into an interactive flashcard deck, diagnostic quiz, and cheat sheet.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            ref={promptInputRef}
            value={prompt}
            onChange={(e) => syncPrompt(e.currentTarget.value)}
            onInput={(e) => syncPrompt(e.currentTarget.value)}
            placeholder="e.g. Paste notes on Quantum Computing or type 'React 18 Concurrent Rendering, Suspense, and useDeferredValue'..."
            rows={4}
            disabled={isLoading}
            className="w-full resize-y rounded-xl border border-slate-700/80 bg-slate-950/80 p-4 text-sm text-slate-100 placeholder-slate-500 shadow-inner outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
          />
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt("")}
              disabled={isLoading}
              className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-400">Depth:</span>
            <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1">
              {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  disabled={isLoading}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
                    level === lvl ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Validating Output...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Study Tools</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-5 border-t border-slate-800/80 pt-4">
        <span className="text-xs font-medium text-slate-400">? Instant Demo Presets (Zero setup):</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.deck)}
              disabled={isLoading}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 transition hover:border-indigo-500 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <Zap className="h-3 w-3 text-amber-400" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Try pasting:</span>
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(sample)}
              disabled={isLoading}
              className="rounded bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-400 transition hover:bg-indigo-950/60 hover:text-indigo-300"
            >
              "{sample.slice(0, 28)}..."
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
