"use client";

import React, { useState } from "react";
import { AlertTriangle, RefreshCw, Sparkles, ChevronDown, ChevronUp, CheckCircle, ShieldAlert } from "lucide-react";
import { StudyApiError } from "@/lib/api";
import { DEMO_PRESETS } from "@/lib/demoData";
import { StudyDeck } from "@/types/study";

interface ErrorStateProps {
  error: StudyApiError | Error | null;
  onRetry: () => void;
  onSelectPreset?: (deck: StudyDeck) => void;
}

export function ErrorState({ error, onRetry, onSelectPreset }: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  const errorType = error instanceof StudyApiError ? error.type : "unknown";
  const errorDetails = error instanceof StudyApiError ? error.details : undefined;

  const getErrorBadge = () => {
    switch (errorType) {
      case "malformed_json":
        return { label: "Malformed JSON Output", color: "text-amber-400 bg-amber-950/50 border-amber-500/30" };
      case "wrong_shape":
        return { label: "Invalid Structural Schema", color: "text-rose-400 bg-rose-950/50 border-rose-500/30" };
      case "empty_response":
        return { label: "Empty Model Response", color: "text-orange-400 bg-orange-950/50 border-orange-500/30" };
      case "timeout":
        return { label: "Request Timeout (>35s)", color: "text-purple-400 bg-purple-950/50 border-purple-500/30" };
      case "rate_limited":
        return { label: "API Rate Limit Reached", color: "text-yellow-400 bg-yellow-950/50 border-yellow-500/30" };
      case "provider_busy":
        return { label: "Gemini Temporarily Unavailable", color: "text-yellow-400 bg-yellow-950/50 border-yellow-500/30" };
      case "api_key_missing":
        return { label: "API Key Authentication Error", color: "text-red-400 bg-red-950/50 border-red-500/30" };
      default:
        return { label: "Generation Failure", color: "text-rose-400 bg-rose-950/50 border-rose-500/30" };
    }
  };

  const badge = getErrorBadge();

  return (
    <div className="mx-auto my-8 max-w-2xl rounded-2xl border border-rose-500/30 bg-slate-900/80 p-6 backdrop-blur-md shadow-2xl">
      <div className="flex items-start space-x-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white text-base">Generation Encountered an Issue</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-300">
            {error?.message || "An unexpected error occurred while generating your interactive deck."}
          </p>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onRetry}
              className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Request</span>
            </button>

            {errorDetails && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
              >
                <span>{showDetails ? "Hide technical diagnostic" : "Show technical diagnostic"}</span>
                {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {/* Technical Diagnostics */}
          {showDetails && errorDetails && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-400">
              <p className="font-bold text-slate-300">Diagnostic Details:</p>
              <pre className="mt-1 whitespace-pre-wrap break-all text-[11px] text-rose-300">
                {errorDetails}
              </pre>
            </div>
          )}

          {/* Fallback Presets */}
          {onSelectPreset && (
            <div className="mt-6 border-t border-slate-800/80 pt-4">
              <p className="text-xs font-medium text-slate-400">
                Or explore an instant pre-validated study deck:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEMO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset.deck)}
                    className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-200 transition hover:border-indigo-500 hover:bg-slate-700"
                  >
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
