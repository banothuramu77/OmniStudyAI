"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, BrainCircuit, Layers, CheckCircle2, HelpCircle } from "lucide-react";

interface LoadingStateProps {
  topic?: string;
  isRefining?: boolean;
}

const GENERATION_STEPS = [
  { text: "Analyzing semantic context and key concepts...", icon: BrainCircuit },
  { text: "Synthesizing testable 3D flashcards...", icon: Layers },
  { text: "Drafting diagnostic quiz questions & explanations...", icon: HelpCircle },
  { text: "Validating structural schema and integrity...", icon: CheckCircle2 },
];

export function LoadingState({ topic, isRefining = false }: LoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto my-8 max-w-2xl rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-8 text-center backdrop-blur-md shadow-2xl">
      {/* Animated Orb */}
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20 duration-1000"></div>
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-40 blur-lg"></div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
          <Sparkles className="h-8 w-8 animate-spin text-white duration-3000" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white">
        {isRefining ? "Refining Study Session..." : "Generating Structured Study Deck..."}
      </h3>
      {topic && (
        <p className="mt-1 text-sm text-indigo-300">
          Target Topic: <span className="font-semibold text-white">"{topic.slice(0, 50)}"</span>
        </p>
      )}

      {/* Progress steps */}
      <div className="mt-8 space-y-3 text-left">
        {GENERATION_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`flex items-center space-x-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
                isCurrent
                  ? "border-indigo-500/50 bg-indigo-950/40 text-indigo-200 shadow-sm"
                  : isDone
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                  : "border-slate-800 bg-slate-900/30 text-slate-500"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isCurrent
                    ? "animate-pulse bg-indigo-600 text-white"
                    : isDone
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium sm:text-sm">{step.text}</span>
              {isDone && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />}
              {isCurrent && (
                <div className="ml-auto flex space-x-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 delay-100"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 delay-200"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-slate-400">
        ? Defensive schema validation actively monitors output shape.
      </div>
    </div>
  );
}
