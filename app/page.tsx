import Link from "next/link";
import { prisma } from "@/lib/prisma";
import WordOfTheWeekCard from "@/components/WordOfTheWeekCard";
import PublicationCard from "@/components/PublicationCard";
import { PublicationStatus } from "@/generated/prisma/client";
import { Feather, PenLine, Compass, Sparkles } from "lucide-react";

export default async function HomePage() {
  // 1. Fetch active Word of the Week
  const wordOfTheWeek = await prisma.wordOfTheWeek.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch categories
  const categories = await prisma.topicCategory.findMany({
    where: { isArchived: false },
    take: 12,
  });

  // 3. Fetch publications (recency order per FR-DISC-1, never algorithmic per FR-DISC-9)
  const publications = await prisma.publication.findMany({
    where: {
      status: PublicationStatus.PUBLISHED,
    },
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
    take: 10,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Editorial Welcome Banner */}
      <section className="text-center sm:text-left sm:flex sm:items-end sm:justify-between pb-6 border-b border-stone-200">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <Feather className="w-3.5 h-3.5" />
            <span>Ihuriro ry&apos;Umurage n&apos;Ubumenyi Gakondo</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
            Urunana rw&apos;Umuco n&apos;Ururimi
          </h1>
          <p className="font-serif text-sm sm:text-base text-stone-600 max-w-xl italic">
            Dusigasire umurage, amateka n&apos;imigenzo y&apos;abakurambere, duhe agaciro ururimi
            rw&apos;Ikinyarwanda no kwandika inkuru z&apos;umuryango.
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center justify-center sm:justify-end space-x-3">
          <Link
            href="/publish"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-95 transition shadow-xs"
          >
            <PenLine className="w-4 h-4" />
            <span>Tangaza Inkuru</span>
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:border-stone-400 transition"
          >
            <Compass className="w-4 h-4" />
            <span>Gushakisha</span>
          </Link>
        </div>
      </section>

      {/* Word of the Week Spotlight (FR-DISC-7, FR-LANG-4) */}
      <section>
        <WordOfTheWeekCard word={wordOfTheWeek} />
      </section>

      {/* Topic Category Horizontal Scroll */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Insanganyamatsiko z&apos;Umuco (Topic Categories)
          </h2>
          <span className="text-[11px] text-stone-400">Byose hamwe: {categories.length}</span>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/discover?topic=${cat.slug}`}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-800 hover:border-emerald-800 hover:text-emerald-900 transition"
            >
              {cat.nameRw}
            </Link>
          ))}
        </div>
      </section>

      {/* Main Publications Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-800" />
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Inkuru Ziheruka Kwandikwa
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-sans">
            Gukurikirana ku gihe cy&apos;inyandiko (Recency Order)
          </span>
        </div>

        {publications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8">
            <Feather className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="font-serif text-stone-600">Nta nkuru zirashyirwaho ku mugaragaro.</p>
            <Link
              href="/publish"
              className="mt-3 inline-block text-xs font-semibold text-emerald-800 hover:underline"
            >
              Ba uwa mbere wanditse inkuru gakondo &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {publications.map((pub) => (
              <PublicationCard key={pub.id} publication={pub} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
