import React from "react";
import Link from "next/link";
import { MessageSquare, Sparkles, AlertTriangle, ShieldCheck, Tag } from "lucide-react";
import { KnowledgeSourceType, ContentLanguage, ContentType } from "@/generated/prisma/client";

interface PublicationCardProps {
  publication: {
    id: string;
    title: string;
    slug: string;
    summary?: string | null;
    publishedAt?: Date | null;
    isEdited: boolean;
    contentType: ContentType;
    contentLanguage: ContentLanguage;
    knowledgeSources: KnowledgeSourceType[];
    categories: {
      category: {
        id: string;
        nameRw: string;
        nameEn: string;
        isHealthOrMedicine: boolean;
      };
    }[];
    author: {
      username: string;
      displayName: string;
      isFoundingContributor: boolean;
    };
    _count?: {
      comments: number;
    };
  };
}

const KNOWLEDGE_LABELS: Record<KnowledgeSourceType, { rw: string; en: string; color: string }> = {
  PERSONAL_EXPERIENCE: { rw: "Uburambe bwanjye", en: "Personal experience", color: "bg-blue-50 text-blue-800 border-blue-200" },
  FAMILY_ORAL_TRADITION: { rw: "Ubuvanganzo bwo mu muryango", en: "Family oral tradition", color: "bg-amber-50 text-amber-800 border-amber-200" },
  COMMUNITY_PRACTICE: { rw: "Imigenzo y'abaturage", en: "Community practice", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  DOCUMENTED_HISTORY: { rw: "Amateka yanditse", en: "Documented history", color: "bg-stone-100 text-stone-800 border-stone-300" },
  RESEARCH_BASED: { rw: "Ubushakashatsi", en: "Research-based", color: "bg-purple-50 text-purple-800 border-purple-200" },
  INTERVIEW_BASED: { rw: "Ibibazwa n'ubuhamya", en: "Interview-based", color: "bg-teal-50 text-teal-800 border-teal-200" },
  INTERPRETATION_OPINION: { rw: "Igitekerezo / Inyito", en: "Interpretation/opinion", color: "bg-rose-50 text-rose-800 border-rose-200" },
};

const LANG_LABELS: Record<ContentLanguage, string> = {
  KINYARWANDA: "🇷🇼 Kinyarwanda",
  ENGLISH: "🇬🇧 English",
  FRENCH: "🇫🇷 Français",
  MIXED: "🌐 Mixed",
};

export default function PublicationCard({ publication }: PublicationCardProps) {
  const hasHealthCategory = publication.categories.some((c) => c.category.isHealthOrMedicine);

  return (
    <article className="p-6 bg-white border border-stone-200/90 rounded-2xl shadow-2xs hover:border-stone-300 hover:shadow-xs transition flex flex-col justify-between">
      <div>
        {/* Top Badges (Knowledge-Source & Language) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {publication.knowledgeSources.map((ks) => {
            const meta = KNOWLEDGE_LABELS[ks] || { rw: ks, en: ks, color: "bg-stone-50 text-stone-700 border-stone-200" };
            return (
              <span
                key={ks}
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.color}`}
                title={`Knowledge Source: ${meta.en}`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{meta.rw}</span>
              </span>
            );
          })}

          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
            {LANG_LABELS[publication.contentLanguage] || publication.contentLanguage}
          </span>
        </div>

        {/* Title */}
        <Link href={`/publications/${publication.slug}`} className="group block">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 group-hover:text-emerald-900 transition leading-snug">
            {publication.title}
          </h3>
        </Link>

        {/* Mandatory Health Disclaimer notice if applicable (FR-MOD-13) */}
        {hasHealthCategory && (
          <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
            <span className="leading-tight">
              Iyi nyandiko ni iy&apos;umuco gusa, si inama z&apos;ubuvuzi bw&apos;abaganga.
            </span>
          </div>
        )}

        {/* Summary / Excerpt */}
        {publication.summary && (
          <p className="mt-2.5 text-xs sm:text-sm text-stone-600 font-serif leading-relaxed line-clamp-3">
            {publication.summary}
          </p>
        )}

        {/* Category tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {publication.categories.map(({ category }) => (
            <span
              key={category.id}
              className="inline-flex items-center space-x-1 text-[11px] font-medium text-stone-500 hover:text-stone-800"
            >
              <Tag className="w-3 h-3 text-stone-400" />
              <span>{category.nameRw}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer: Author & Stats */}
      <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <Link
          href={`/profile/${publication.author.username}`}
          className="flex items-center space-x-2 group"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-serif font-bold text-[10px] flex items-center justify-center">
            {publication.author.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-stone-800 group-hover:text-emerald-900 transition">
            {publication.author.displayName}
          </span>
          {publication.author.isFoundingContributor && (
            <span title="Founding Contributor" className="text-amber-500">
              <Sparkles className="w-3 h-3 fill-amber-400 inline" />
            </span>
          )}
        </Link>

        <div className="flex items-center space-x-3 text-stone-400">
          <span className="flex items-center space-x-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{publication._count?.comments || 0}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
