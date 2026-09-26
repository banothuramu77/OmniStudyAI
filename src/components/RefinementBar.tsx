"use client";

import React, { useState } from "react";
import { Sparkles, Send, RefreshCw, Wand2 } from "lucide-react";

interface RefinementBarProps {
  onRefine: (instruction: string) => void;
  isRefining: boolean;
}

const REFINEMENT_SUGGESTIONS = [
  "Add 3 tricky cards on edge cases & pitfalls",
  "Make explanations more beginner friendly",
  "Add multiple choice questions with code snippets",
  "Focus heavily on practical real-world interview scenarios",
];

export function RefinementBar({ onRefine, isRefining }: RefinementBarProps) {
  const [instruction, setInstruction] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining) return;
    onRefine(instruction.trim());
    setInstruction("");
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md sm:p-5">
      <div className="flex items-center space-x-2 mb-2">
        <Wand2 className="h-4 w-4 text-indigo-400" />
        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
          Interactive Refinement Loop (Stretch Goal)
        </h4>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Edit or expand the active study deck without starting from scratch.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. 'Add 3 harder cards about memory leaks' or 'Explain in simpler terms'..."
          disabled={isRefining}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 sm:text-sm"
        />

        <button
          type="submit"
          disabled={!instruction.trim() || isRefining}
          className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isRefining ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Refine</span>
        </button>
      </form>

      {/* Quick Refinement Chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {REFINEMENT_SUGGESTIONS.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onRefine(sug)}
            disabled={isRefining}
            className="rounded-lg bg-slate-800/70 border border-slate-700/50 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-500 hover:text-white transition disabled:opacity-50"
          >
            + {sug}
          </button>
        ))}
      </div>
    </div>
  );
}
