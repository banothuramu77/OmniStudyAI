"use client";

import React, { useState } from "react";
import { Sparkles, BookOpen, History, Download, Sun, Moon, Check, FileJson, FileText, Info } from "lucide-react";
import { StudyDeck } from "@/types/study";
import { exportDeckAsJson, exportDeckAsMarkdown } from "@/lib/storage";

interface HeaderProps {
  currentDeck: StudyDeck | null;
  onOpenHistory: () => void;
  savedDecksCount: number;
}

export function Header({ currentDeck, onOpenHistory, savedDecksCount }: HeaderProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setIsDark(false);
    } else {
      html.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white text-lg">OmniStudy<span className="text-indigo-400">AI</span></span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-500/30">
                Interactive Tool
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Turn free-form notes into smart interactive decks
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            title="View saved study sessions"
          >
            <History className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">Saved Sessions</span>
            {savedDecksCount > 0 && (
              <span className="ml-1 rounded-full bg-indigo-600 px-1.5 py-0.2 text-[10px] font-semibold text-white">
                {savedDecksCount}
              </span>
            )}
          </button>

          {/* Export Dropdown */}
          {currentDeck && (
            <div className="relative">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="flex items-center space-x-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                title="Export current study set"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {isExportOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl shadow-black/50 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsExportOpen(false)}
                >
                  <button
                    onClick={() => exportDeckAsMarkdown(currentDeck)}
                    className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span>Markdown Study Guide (.md)</span>
                  </button>
                  <button
                    onClick={() => exportDeckAsJson(currentDeck)}
                    className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <FileJson className="h-4 w-4 text-emerald-400" />
                    <span>Raw Structured JSON (.json)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-slate-100"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
}
