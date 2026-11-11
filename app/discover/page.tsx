import React, { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import PublicationCard from "@/components/PublicationCard";
import DiscoverFilters from "@/components/DiscoverFilters";
import {
  PublicationStatus,
  KnowledgeSourceType,
  ContentType,
  ContentLanguage,
  Prisma,
} from "@/generated/prisma/client";
import { Compass, BookOpen, Sparkles, AlertCircle } from "lucide-react";

interface DiscoverPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    source?: string;
    type?: string;
    lang?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  const category = params.category?.trim();
  const source = params.source?.trim();
  const type = params.type?.trim();
  const lang = params.lang?.trim();

  // 1. Fetch all active categories for the filter pills
  const categories = await prisma.topicCategory.findMany({
    where: { isArchived: false },
    select: { id: true, slug: true, nameRw: true },
    orderBy: { nameRw: "asc" },
  });

  // 2. Build where clause
  const where: Prisma.PublicationWhereInput = {
    status: PublicationStatus.PUBLISHED,
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      {
        author: {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (category) {
    where.categories = {
      some: {
        category: {
          slug: category,
        },
      },
    };
  }

  if (
    source &&
    Object.values(KnowledgeSourceType).includes(source as KnowledgeSourceType)
  ) {
    where.knowledgeSources = {
      has: source as KnowledgeSourceType,
    };
  }

  if (
    type &&
    Object.values(ContentType).includes(type as ContentType)
  ) {
    where.contentType = type as ContentType;
  }

  if (
    lang &&
    Object.values(ContentLanguage).includes(lang as ContentLanguage)
  ) {
    where.contentLanguage = lang as ContentLanguage;
  }

  // 3. Fetch publications (recency order per FR-DISC-1, never opaque algorithmic)
  const publications = await prisma.publication.findMany({
    where,
    include: {
      author: {
        select: {
          username: true,
          displayName: true,
          isFoundingContributor: true,
        },
      },
      categories: {
        include: {
          category: {
            select: {
              id: true,
              nameRw: true,
              nameEn: true,
              isHealthOrMedicine: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 30,
  });

  const activeCategoryObj = categories.find((c) => c.slug === category);
  const totalCount = publications.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <header className="space-y-2 border-b border-stone-200 pb-6">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          <Compass className="w-4 h-4" />
          <span>Ubushakashatsi n&apos;Ubuvanganzo</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
          Gushakisha mu Murage w&apos;Ururimi n&apos;Umuco
        </h1>
        <p className="font-serif text-sm sm:text-base text-stone-600 italic">
          Shakisha imigani, inyandiko nyunguranabitekerezo, inkuru zo mu muryango
          n&apos;ubumenyi gakondo by&apos;u Rwanda.
        </p>
      </header>

      {/* Filter Component (wrapped in Suspense for useSearchParams) */}
      <Suspense fallback={<div className="h-28 bg-stone-100 rounded-2xl animate-pulse" />}>
        <DiscoverFilters
          categories={categories}
          initialQuery={q}
          initialCategory={category}
          initialSource={source}
          initialType={type}
          initialLang={lang}
        />
      </Suspense>

      {/* Results Header / Active Scope Bar */}
      <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-stone-900">
            {totalCount}{" "}
            {totalCount === 1 ? "inyandiko yabonetse" : "inyandiko zabonetse"}
          </span>
          {activeCategoryObj && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 font-medium">
              mu: {activeCategoryObj.nameRw}
            </span>
          )}
          {q && (
            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 italic">
              &ldquo;{q}&rdquo;
            </span>
          )}
        </div>
        <span className="text-[11px] text-stone-400">
          Ibishya biheruka (Chrono)
        </span>
      </div>

      {/* Publications List */}
      {publications.length > 0 ? (
        <div className="space-y-4">
          {publications.map((publication) => (
            <PublicationCard key={publication.id} publication={publication} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-stone-200/80 rounded-2xl space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Nta nyandiko zihuye n&apos;ibyo mushakishije
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Gerageza gukoresha andi magambo, fungura akayunguruzo cyangwa uhitemo
              izindi nsanganyamatsiko kugira ngo ubone ibyanditswe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

