import React from "react";
import { Sparkles, BookOpen, Volume2 } from "lucide-react";

interface WordOfTheWeekProps {
  word: {
    word: string;
    pronunciation?: string | null;
    explanationRw: string;
    explanationEn: string;
    culturalContext?: string | null;
    exampleSentenceRw?: string | null;
    exampleSentenceTranslation?: string | null;
  } | null;
}

export default function WordOfTheWeekCard({ word }: WordOfTheWeekProps) {
  if (!word) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-950 text-white p-6 sm:p-8 shadow-sm border border-emerald-700/40">
      {/* Decorative background shape */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-emerald-700/20 blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ijambo ry&apos;Icyumweru (Word of the Week)</span>
          </div>
          {word.pronunciation && (
            <div className="flex items-center space-x-1 text-xs text-emerald-200/90 font-mono">
              <Volume2 className="w-3.5 h-3.5" />
              <span>[{word.pronunciation}]</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-amber-200">
            {word.word}
          </h2>

          <p className="text-sm sm:text-base text-stone-100 font-serif leading-relaxed">
            {word.explanationRw}
          </p>

          <p className="text-xs text-emerald-200/80 italic font-sans leading-relaxed">
            &ldquo;{word.explanationEn}&rdquo;
          </p>

          {word.culturalContext && (
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-stone-200 space-y-1">
              <div className="font-semibold text-amber-300 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ubusobanuro mu Muco (Cultural Context):</span>
              </div>
              <p className="text-stone-300 leading-relaxed">{word.culturalContext}</p>
            </div>
          )}

          {word.exampleSentenceRw && (
            <div className="p-3 rounded-lg bg-black/20 text-xs text-emerald-100 font-serif">
              <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-amber-300 block mb-0.5">
                Urugero mu Nteruro:
              </span>
              &ldquo;{word.exampleSentenceRw}&rdquo;
              {word.exampleSentenceTranslation && (
                <span className="block text-[11px] text-stone-300 font-sans italic mt-0.5">
                  ({word.exampleSentenceTranslation})
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
