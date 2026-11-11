"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
  Globe,
  Sparkles,
} from "lucide-react";
import {
  KnowledgeSourceType,
  ContentType,
  ContentLanguage,
} from "@/generated/prisma/client";

interface Category {
  id: string;
  slug: string;
  nameRw: string;
}

interface DiscoverFiltersProps {
  categories: Category[];
  initialQuery?: string;
  initialCategory?: string;
  initialSource?: string;
  initialType?: string;
  initialLang?: string;
}

const KNOWLEDGE_SOURCES: { id: KnowledgeSourceType; label: string }[] = [
  { id: "FAMILY_ORAL_TRADITION", label: "Ubuvanganzo bwo mu Muryango" },
  { id: "PERSONAL_EXPERIENCE", label: "Uburambe bwanjye bwite" },
  { id: "COMMUNITY_PRACTICE", label: "Imigenzo n'Ibyirorere by'Akarere" },
  { id: "DOCUMENTED_HISTORY", label: "Amateka n'Inyandiko Gakondo" },
  { id: "RESEARCH_BASED", label: "Ubushakashatsi Gakondo" },
  { id: "INTERVIEW_BASED", label: "Ibibazwa n'Ubuhamya bw'Abakuru" },
  { id: "INTERPRETATION_OPINION", label: "Isesengura n'Inyito" },
];

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: "STORY", label: "Inkuru (Story)" },
  { id: "ORAL_TRADITION", label: "Ubuvanganzo Nyemvugo" },
  { id: "ARTICLE", label: "Inyandiko Nyunguranabitekerezo" },
  { id: "LANGUAGE_EXPLANATION", label: "Ururimi n'Imigani" },
  { id: "PERSONAL_EXPERIENCE", label: "Uburambe bw'Umuryango" },
  { id: "RESEARCH_PIECE", label: "Ubushakashatsi" },
  { id: "EVENT_NOTICE", label: "Ibirori n'Imihango" },
  { id: "OPINION_INTERPRETATION", label: "Inyito n'Isesengura" },
];

const LANGUAGES: { id: ContentLanguage; label: string }[] = [
  { id: "KINYARWANDA", label: "🇷🇼 Ikinyarwanda" },
  { id: "ENGLISH", label: "🇬🇧 English" },
  { id: "FRENCH", label: "🇫🇷 Français" },
  { id: "MIXED", label: "🌐 Indimi Zivanze" },
];

export default function DiscoverFilters({
  categories,
  initialQuery = "",
  initialCategory = "",
  initialSource = "",
  initialType = "",
  initialLang = "",
}: DiscoverFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialQuery);
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(initialSource || initialType || initialLang)
  );

  const activeCategory = searchParams.get("category") || "";
  const activeSource = searchParams.get("source") || "";
  const activeType = searchParams.get("type") || "";
  const activeLang = searchParams.get("lang") || "";

  // Count active non-category filters
  const extraFiltersCount = [activeSource, activeType, activeLang].filter(
    Boolean
  ).length;

  function updateQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === "ALL") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ q: search.trim() || null });
  }

  function handleClearSearch() {
    setSearch("");
    updateQuery({ q: null });
  }

  function handleCategoryClick(catSlug: string) {
    if (activeCategory === catSlug) {
      updateQuery({ category: null });
    } else {
      updateQuery({ category: catSlug });
    }
  }

  function handleResetAll() {
    setSearch("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasAnyFilter = Boolean(
    searchParams.get("q") ||
      activeCategory ||
      activeSource ||
      activeType ||
      activeLang
  );

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shakisha ku mutwe, amagambo, umwanditsi cyangwa inyito..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-stone-200 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent shadow-xs transition"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title="Siba ibyanditswe"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="ml-3 px-5 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs active:scale-98 transition shrink-0"
        >
          {isPending ? "Biracyashakisha..." : "Shakisha"}
        </button>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`ml-2 p-3.5 rounded-2xl border transition relative shrink-0 ${
            showAdvanced || extraFiltersCount > 0
              ? "border-emerald-800 bg-emerald-50 text-emerald-900"
              : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          }`}
          title="Akayunguruzo k'Inyongera (Advanced filters)"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {extraFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-bold flex items-center justify-center">
              {extraFiltersCount}
            </span>
          )}
        </button>
      </form>

      {/* Horizontal Scrolling Topic Categories */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={() => updateQuery({ category: null })}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${
            !activeCategory
              ? "bg-stone-900 text-white shadow-2xs"
              : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
          }`}
        >
          Zose (All Topics)
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${
                isActive
                  ? "bg-emerald-800 text-white shadow-2xs"
                  : "bg-white border border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              {cat.nameRw}
            </button>
          );
        })}
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {showAdvanced && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center space-x-2 text-xs font-semibold text-stone-900 uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800" />
              <span>Akayunguruzo k&apos;Inyongera (Filters)</span>
            </div>
            {hasAnyFilter && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center space-x-1 text-xs text-rose-700 hover:text-rose-800 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Kusanya Byose (Reset)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Knowledge Source */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3 h-3 inline mr-1 text-amber-600" />
                Inkomoko y&apos;Ubumenyi
              </label>
              <select
                value={activeSource}
                onChange={(e) => updateQuery({ source: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              >
                <option value="ALL">Inkomoko zose (All sources)</option>
                {KNOWLEDGE_SOURCES.map((ks) => (
                  <option key={ks.id} value={ks.id}>
                    {ks.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                <BookOpen className="w-3 h-3 inline mr-1 text-emerald-700" />
                Ubwoko bw&apos;Inyandiko
              </label>
              <select
                value={activeType}
                onChange={(e) => updateQuery({ type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              >
                <option value="ALL">Ubwoko bwose (All types)</option>
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                <Globe className="w-3 h-3 inline mr-1 text-blue-600" />
                Ururimi rw&apos;Inyandiko
              </label>
              <select
                value={activeLang}
                onChange={(e) => updateQuery({ lang: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800 focus:outline-none"
              >
                <option value="ALL">Indimi zose (All languages)</option>
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

