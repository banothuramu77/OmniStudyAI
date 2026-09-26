"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { QuizQuestion } from "@/types/study";

interface QuizViewProps {
  questions: QuizQuestion[];
}

export function QuizView({ questions }: QuizViewProps) {
  const [quizList, setQuizList] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [isRetestingWrong, setIsRetestingWrong] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);

  useEffect(() => {
    setQuizList(questions);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowSummary(false);
    setIsRetestingWrong(false);
  }, [questions]);

  if (!quizList || quizList.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
        <p>No quiz questions available for this deck.</p>
      </div>
    );
  }

  const currentQ = quizList[currentIndex];
  const isAnswered = currentQ ? selectedAnswers[currentQ.id] !== undefined : false;
  const userAnswer = currentQ ? selectedAnswers[currentQ.id] : undefined;

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < quizList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSummary(true);
      const correctTotal = quizList.filter(
        (q) => selectedAnswers[q.id] === q.correctIndex
      ).length;
      if (correctTotal / quizList.length >= 0.7) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas unavailable
        }
      }
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizList.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: quizList.length,
      percentage: Math.round((correct / quizList.length) * 100),
      wrongQuestions: quizList.filter((q) => selectedAnswers[q.id] !== q.correctIndex),
    };
  };

  const scoreData = calculateScore();

  const handleRetestWrong = () => {
    if (scoreData.wrongQuestions.length === 0) return;
    setQuizList(scoreData.wrongQuestions);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowSummary(false);
    setIsRetestingWrong(true);
  };

  const handleResetFullQuiz = () => {
    setQuizList(questions);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowSummary(false);
    setIsRetestingWrong(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {isRetestingWrong && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/40 p-3 text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span>
              <strong>Targeted Mode:</strong> Re-testing only previous wrong answers ({quizList.length} questions).
            </span>
          </div>
          <button
            onClick={handleResetFullQuiz}
            className="rounded bg-slate-800 px-2.5 py-1 text-slate-200 hover:bg-slate-700"
          >
            Exit to Full Quiz
          </button>
        </div>
      )}

      {showSummary ? (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30">
            <Trophy className="h-8 w-8 text-amber-300" />
          </div>

          <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
          <p className="mt-1 text-sm text-slate-400">Diagnostic comprehension breakdown</p>

          <div className="my-6 inline-flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 px-8 py-6 shadow-inner">
            <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              {scoreData.percentage}%
            </span>
            <span className="mt-2 text-sm font-semibold text-slate-300">
              {scoreData.correct} of {scoreData.total} Correct
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {scoreData.wrongQuestions.length > 0 ? (
              <button
                onClick={handleRetestWrong}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 transition hover:from-amber-500 hover:to-orange-500"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Re-test Wrong Answers ({scoreData.wrongQuestions.length})</span>
              </button>
            ) : (
              <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-emerald-300">
                ?? Perfect Score! All concepts mastered.
              </div>
            )}

            <button
              onClick={handleResetFullQuiz}
              className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake Entire Quiz</span>
            </button>
          </div>

          <div className="mt-8 text-left border-t border-slate-800 pt-6">
            <h4 className="text-sm font-bold text-slate-300 mb-3">Question Breakdown</h4>
            <div className="space-y-3">
              {quizList.map((q, idx) => {
                const uAns = selectedAnswers[q.id];
                const isCorrect = uAns === q.correctIndex;
                const isExpanded = expandedExplanation === q.id;

                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-4 transition ${
                      isCorrect
                        ? "border-emerald-500/30 bg-emerald-950/20"
                        : "border-rose-500/30 bg-rose-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {idx + 1}. {q.question}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Your answer: <span className={isCorrect ? "text-emerald-300 font-medium" : "text-rose-300 font-medium"}>
                              {uAns !== undefined ? q.options[uAns] : "Not answered"}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-xs text-emerald-300">
                              Correct answer: <strong>{q.options[q.correctIndex]}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedExplanation(isExpanded ? null : q.id)}
                        className="text-slate-400 hover:text-slate-200 p-1"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 rounded-lg bg-slate-900/80 p-3 text-xs text-slate-300 border border-slate-800">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
            <span>
              Question <span className="font-bold text-white">{currentIndex + 1}</span> of {quizList.length}
            </span>
            <span>
              {Object.keys(selectedAnswers).length} / {quizList.length} Answered
            </span>
          </div>

          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / quizList.length) * 100}%` }}
            />
          </div>

          <h3 className="text-lg font-semibold text-white sm:text-xl leading-snug">
            {currentQ.question}
          </h3>

          <div className="mt-6 space-y-3">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = userAnswer === optIdx;
              const isCorrectOption = currentQ.correctIndex === optIdx;

              let optionStyle = "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-indigo-500 hover:bg-slate-900";

              if (isAnswered) {
                if (isCorrectOption) {
                  optionStyle = "border-emerald-500 bg-emerald-950/40 text-emerald-200 shadow-md shadow-emerald-500/10";
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = "border-rose-500 bg-rose-950/40 text-rose-200 shadow-md shadow-rose-500/10";
                } else {
                  optionStyle = "border-slate-800/60 bg-slate-950/30 text-slate-500 opacity-60";
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isAnswered}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all duration-200 ${optionStyle}`}
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                        isAnswered && isCorrectOption
                          ? "border-emerald-400 bg-emerald-500 text-white"
                          : isAnswered && isSelected
                          ? "border-rose-400 bg-rose-500 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswered && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrectOption && (
                    <XCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div
              className={`mt-6 rounded-xl border p-4 text-xs sm:text-sm ${
                userAnswer === currentQ.correctIndex
                  ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                  : "border-rose-500/30 bg-rose-950/30 text-rose-200"
              }`}
            >
              <div className="flex items-start space-x-2">
                <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">
                    {userAnswer === currentQ.correctIndex ? "Correct!" : "Incorrect"}
                  </p>
                  <p className="mt-1 text-slate-300 leading-relaxed">{currentQ.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40"
            >
              ? Previous
            </button>

            {isAnswered && (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
              >
                <span>{currentIndex < quizList.length - 1 ? "Next Question" : "View Score Summary"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
