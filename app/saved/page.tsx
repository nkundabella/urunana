import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PublicationStatus } from "@/generated/prisma/client";
import PublicationCard from "@/components/PublicationCard";
import { BookMarked, Compass, LogIn, UserPlus, Sparkles } from "lucide-react";

export default async function SavedPage() {
  const currentUser = await getCurrentUser();

  // Guest Gate: If not authenticated, show welcoming prompt
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
          <BookMarked className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Injira kugira ngo ubike inkuru ukunda
          </h1>
          <p className="font-serif text-stone-600 text-sm sm:text-base max-w-md mx-auto italic leading-relaxed">
            Kuri Urunana, ushobora kubika inkuru gakondo, imigani n&apos;amateka
            kugira ngo uzabisome ubutaha igihe cyose ubishakiye.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs active:scale-95 transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Injira (Login)</span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-2xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Iyandikishe (Register)</span>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch user's bookmarks (most recent first)
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: currentUser.id,
      publication: {
        status: PublicationStatus.PUBLISHED,
      },
    },
    include: {
      publication: {
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
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCount = bookmarks.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Editorial Header */}
      <header className="space-y-2 border-b border-stone-200 pb-6">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          <BookMarked className="w-3.5 h-3.5" />
          <span>Ububiko Bwawe Bwite</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
          Inkuru Wabitse
        </h1>
        <p className="font-serif text-sm sm:text-base text-stone-600 italic">
          Ikusanyirizo ry&apos;inkuru, imigani n&apos;inyandiko wibitseho kugira ngo uzongere
          kuzisoma cyangwa kuzizirikana.
        </p>
      </header>

      {/* Counter Bar */}
      <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
        <span>
          <strong className="font-semibold text-stone-900">{totalCount}</strong>{" "}
          {totalCount === 1 ? "nkuru yabitswe" : "nkuru zabitswe"}
        </span>
        <Link
          href="/discover"
          className="inline-flex items-center space-x-1 text-emerald-800 hover:text-emerald-900 font-semibold"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Shakisha izindi nkuru →</span>
        </Link>
      </div>

      {/* Bookmarks List */}
      {bookmarks.length > 0 ? (
        <div className="space-y-4">
          {bookmarks.map((bm) => (
            <PublicationCard key={bm.id} publication={bm.publication} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-stone-200/80 rounded-2xl space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <BookMarked className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Nta nkuru urabika kuri ubu
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              Igihe uri gusoma inkuru, kanda ku kimenyetso cyo kubika (Bookmark)
              kugira ngo uyishyire muri ubu bubiko.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/discover"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Gushakisha Inkuru</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

