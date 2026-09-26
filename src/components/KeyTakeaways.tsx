"use client";

import React, { useState } from "react";
import { Check, Copy, Sparkles, BookOpen } from "lucide-react";

interface KeyTakeawaysProps {
  takeaways: string[];
  summary: string;
  topic: string;
}

export function KeyTakeaways({ takeaways, summary, topic }: KeyTakeawaysProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let text = `Key Takeaways for ${topic}:\n\nSummary:\n${summary}\n\nCore Concepts:\n`;
    takeaways.forEach((t, i) => {
      text += `${i + 1}. ${t}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Overview Card */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Executive Summary</h3>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Cheat Sheet</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{summary}</p>
      </div>

      {/* Bulleted Takeaways */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>Core Concepts & Mental Models ({takeaways.length})</span>
        </h3>

        <div className="space-y-3">
          {takeaways.map((takeaway, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 text-sm text-slate-200 transition hover:border-indigo-500/40"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-300 border border-indigo-500/30 mt-0.5">
                {idx + 1}
              </div>
              <p className="leading-relaxed">{takeaway}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
