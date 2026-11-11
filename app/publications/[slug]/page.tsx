import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PublicationStatus, ContentLanguage, KnowledgeSourceType, ContentType } from "@/generated/prisma/client";
import PublicationActionsBar from "@/components/PublicationActionsBar";
import DiscussionSection, { type DiscussionComment } from "@/components/DiscussionSection";
import { AlertTriangle, Award, Calendar, Edit3, Globe } from "lucide-react";

const LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  KINYARWANDA: "Ikinyarwanda",
  FRENCH: "Français",
  ENGLISH: "English",
  MIXED: "Indimi Zivanze",
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  STORY: "Inkuru",
  ORAL_TRADITION: "Ubuvanganzo Nyemvugo",
  ARTICLE: "Inyandiko Nyunguranabitekerezo",
  LANGUAGE_EXPLANATION: "Ibisobanuro by'Ururimi",
  PERSONAL_EXPERIENCE: "Uburambe bw'Umuryango",
  INTERVIEW: "Ikiganiro n'Ubuhamya",
  EVENT_NOTICE: "Irangamimerere ry'Ibirori",
  RESEARCH_PIECE: "Ubushakashatsi",
  OPINION_INTERPRETATION: "Inyito n'Isesengura",
};

const KNOWLEDGE_SOURCE_LABELS: Record<KnowledgeSourceType, string> = {
  PERSONAL_EXPERIENCE: "Uburambe bwanjye",
  FAMILY_ORAL_TRADITION: "Ubuvanganzo bwo mu muryango",
  COMMUNITY_PRACTICE: "Imigenzo y'abaturage",
  DOCUMENTED_HISTORY: "Amateka yanditse",
  RESEARCH_BASED: "Ubushakashatsi",
  INTERVIEW_BASED: "Ibibazwa n'ubuhamya",
  INTERPRETATION_OPINION: "Igitekerezo / Inyito",
};

/** Editorial Markdown Renderer supporting Substack-style inline images & literary formatting */
function renderBody(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let isFirstParagraph = true;

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Substack-style image: ![Caption | wide/full](https://...)
    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      const rawAlt = imageMatch[1];
      const src = imageMatch[2];
      const parts = rawAlt.split("|").map((p) => p.trim());
      const caption = parts[0];
      const isWide = parts.some(
        (p) => p === "wide" || p === "full" || p === "cinema"
      );

      elements.push(
        <figure
          key={i}
          className={`my-8 transition-all ${
            isWide ? "-mx-4 sm:-mx-8 md:-mx-16" : ""
          }`}
        >
          <div className="overflow-hidden rounded-2xl bg-stone-100 border border-stone-200/90 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={caption || "Ifoto yo mu nkuru"}
              className="w-full h-auto object-cover max-h-[600px] mx-auto transition duration-300 hover:scale-[1.01]"
              loading="lazy"
            />
          </div>
          {caption && (
            <figcaption className="text-center font-serif text-xs text-stone-500 italic mt-2.5 px-4 leading-normal">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-10 mb-4 tracking-tight"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={i}
          className="font-serif text-xl sm:text-2xl font-semibold text-stone-800 mt-8 mb-3"
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-4 border-emerald-800 pl-6 py-2 my-6 italic text-stone-700 font-serif text-lg leading-relaxed bg-stone-50/60 rounded-r-xl"
        >
          {line.slice(2)}
        </blockquote>
      );
    } else if (line === "---" || line === "***") {
      // Subtle literary section break
      elements.push(
        <div
          key={i}
          className="flex items-center justify-center space-x-3 my-8 text-stone-300 font-serif text-sm tracking-widest"
        >
          <span>❖</span>
          <span>❖</span>
          <span>❖</span>
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-5 list-disc text-stone-800 my-1 font-serif">
          {inlineFormat(line.slice(2))}
        </li>
      );
    } else if (line === "") {
      elements.push(<div key={i} className="h-4" />);
    } else {
      const isDropCap = isFirstParagraph;
      if (isFirstParagraph) isFirstParagraph = false;

      elements.push(
        <p
          key={i}
          className={`text-stone-800 leading-relaxed mb-4 text-[1.08rem] font-serif ${
            isDropCap
              ? "first-letter:float-left first-letter:text-5xl first-letter:font-bold first-letter:text-emerald-900 first-letter:mr-3 first-letter:leading-none first-letter:font-serif"
              : ""
          }`}
        >
          {inlineFormat(rawLine)}
        </p>
      );
    }
    i++;
  }

  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </>
  );
}

export default async function PublicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [publication, currentUser] = await Promise.all([
    prisma.publication.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            isFoundingContributor: true,
            foundingJoinDate: true,
            role: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                isFoundingContributor: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    isFoundingContributor: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        bookmarks: {
          select: { userId: true },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!publication) notFound();

  // If not published, only author/admin/moderator can view
  const isAuthor = currentUser?.id === publication.authorId;
  const isPrivileged =
    isAuthor ||
    currentUser?.role === "ADMIN" ||
    currentUser?.isModerator;

  if (
    publication.status !== PublicationStatus.PUBLISHED &&
    !isPrivileged
  ) {
    notFound();
  }

  const isBookmarked = currentUser
    ? publication.bookmarks.some((b) => b.userId === currentUser.id)
    : false;

  const hasHealthCategory = publication.categories.some(
    (pt) => pt.category.isHealthOrMedicine
  );

  const totalCommentCount =
    publication.comments.length +
    publication.comments.reduce((sum, c) => sum + c.replies.length, 0);

  const isUnpublished =
    publication.status === PublicationStatus.DRAFT ||
    publication.status === PublicationStatus.AUTO_HIDDEN ||
    publication.status === PublicationStatus.REMOVED;

  return (
    <div className="min-h-screen bg-[#fbfbf9]">
      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-14">

        {/* Unpublished notice for author/admin */}
        {isUnpublished && (
          <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 text-sm text-amber-900 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <strong>
                {publication.status === PublicationStatus.DRAFT && "Iyi nkuru ikiri mu gitabo (Draft)"}
                {publication.status === PublicationStatus.AUTO_HIDDEN && "Iyi nkuru yashyizwe ahagaragara (Auto-hidden for review)"}
                {publication.status === PublicationStatus.REMOVED && "Iyi nkuru ikuweho (Removed)"}
              </strong>
              {publication.autoHideReason && (
                <p className="mt-1 text-xs text-amber-800">{publication.autoHideReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Mandatory health disclaimer */}
        {hasHealthCategory && (
          <div className="mb-6 p-4 rounded-xl border border-amber-400 bg-amber-50 text-sm text-amber-900 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <strong>Integuza Ngombwa ku Buzima</strong>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Iyi nkuru irimo amakuru ajyanye n&apos;ubuvuzi bw&apos;igihugu cyangwa imiti
                y&apos;inyamaswa. Aya makuru ni umurage w&apos;amateka gusa kandi ntabwo
                ashobora gufata ahagana inama z&apos;inzobere mu buzima. Baza inzobere mu
                buzima mbere yo gukoresha iyo miti cyangwa izo ngamba.
              </p>
            </div>
          </div>
        )}

        {/* Topic categories */}
        {publication.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {publication.categories.map((pt) => (
              <span
                key={pt.categoryId}
                className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold"
              >
                {pt.category.nameRw}
              </span>
            ))}
          </div>
        )}

        {/* Content type tag */}
        <div className="mb-3">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            {CONTENT_TYPE_LABELS[publication.contentType]}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-4">
          {publication.title}
        </h1>

        {/* Summary / lede */}
        {publication.summary && (
          <p className="font-serif text-lg text-stone-600 leading-relaxed mb-5 italic">
            {publication.summary}
          </p>
        )}

        {/* Author + meta row */}
        <div className="flex items-center justify-between mb-2 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${publication.author.username}`}
              className="font-semibold text-stone-900 hover:underline"
            >
              {publication.author.displayName}
            </Link>
            {publication.author.isFoundingContributor && (
              <span
                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase tracking-wider"
                title="Umunyamuryango w'intangiriro (Founding Contributor)"
              >
                <Award className="w-3 h-3" />
                Intangiriro
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Language badge */}
            <span className="flex items-center gap-1 text-stone-400">
              <Globe className="w-3 h-3" />
              {LANGUAGE_LABELS[publication.contentLanguage]}
            </span>
            {/* Date */}
            {publication.publishedAt && (
              <span className="flex items-center gap-1 text-stone-400">
                <Calendar className="w-3 h-3" />
                {new Date(publication.publishedAt).toLocaleDateString("rw-RW", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {/* Edited badge */}
            {publication.isEdited && (
              <span className="flex items-center gap-1 text-stone-400 italic">
                <Edit3 className="w-3 h-3" />
                Ihinduwe
              </span>
            )}
          </div>
        </div>

        {/* Knowledge source badges */}
        {publication.knowledgeSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6 pb-6 border-b border-stone-100">
            {publication.knowledgeSources.map((ks) => (
              <span
                key={ks}
                className="px-2 py-0.5 rounded-md border border-stone-200 bg-stone-50 text-stone-600 text-[10px] font-medium"
              >
                {KNOWLEDGE_SOURCE_LABELS[ks]}
              </span>
            ))}
          </div>
        )}

        {/* Actions bar (Gushima, Bookmark, Share, Comments, Report) */}
        <PublicationActionsBar
          publicationId={publication.id}
          publicationTitle={publication.title}
          commentCount={totalCommentCount}
          initialBookmarked={isBookmarked}
        />

        {/* Body content */}
        <article className="font-serif text-[1.08rem] leading-[1.8] text-stone-800 mt-6 mb-10 space-y-1">
          {renderBody(publication.body)}
        </article>

        {/* Source citation */}
        {publication.sourceCitation && (
          <div className="mt-6 mb-8 p-4 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-600">
            <span className="font-semibold text-stone-700 block mb-1">
              Inkomoko (Source)
            </span>
            <p className="italic leading-relaxed">{publication.sourceCitation}</p>
          </div>
        )}

        {/* Related versions note */}
        {publication.relatedVersionsNote && (
          <div className="mt-2 mb-8 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
            <span className="font-semibold block mb-1">Indi nyito / Ubuhindurire</span>
            <p>{publication.relatedVersionsNote}</p>
          </div>
        )}

        {/* Author bio card */}
        <div className="mt-8 p-5 rounded-2xl border border-stone-200 bg-white flex gap-4 items-start">
          <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
            {publication.author.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${publication.author.username}`}
                className="font-serif font-bold text-stone-900 hover:underline"
              >
                {publication.author.displayName}
              </Link>
              {publication.author.isFoundingContributor && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase tracking-wider">
                  <Award className="w-3 h-3" />
                  Umunyamuryango w&apos;Intangiriro
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">@{publication.author.username}</p>
            {publication.author.bio && (
              <p className="text-sm text-stone-700 mt-2 leading-relaxed">
                {publication.author.bio}
              </p>
            )}
            <Link
              href={`/profile/${publication.author.username}`}
              className="inline-block mt-2 text-xs font-semibold text-emerald-700 hover:underline"
            >
              Reba insanganyamatsiko zawe →
            </Link>
          </div>
        </div>

        {/* Discussion anchor + section */}
        <div id="discussion" className="mt-12 scroll-mt-20">
          <DiscussionSection
            publicationId={publication.id}
            publicationSlug={slug}
            initialComments={publication.comments as DiscussionComment[]}
            currentUserId={currentUser?.id ?? null}
            currentUserIsAdmin={currentUser?.role === "ADMIN" || !!currentUser?.isModerator}
          />
        </div>
      </main>
    </div>
  );
}
