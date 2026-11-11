import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PublishForm from "@/components/PublishForm";
import { Feather, Lock, ArrowRight } from "lucide-react";

const FALLBACK_CATEGORIES = [
  { id: "cat-1", slug: "history-heritage", nameRw: "Amateka n'Umurage", nameEn: "History & Heritage", isHealthOrMedicine: false },
  { id: "cat-2", slug: "kinyarwanda-language", nameRw: "Ururimi rw'Ikinyarwanda", nameEn: "Kinyarwanda Language", isHealthOrMedicine: false },
  { id: "cat-3", slug: "proverbs-riddles", nameRw: "Imigani n'Ibisakuzo", nameEn: "Proverbs & Riddles", isHealthOrMedicine: false },
  { id: "cat-4", slug: "oral-traditions-stories", nameRw: "Ubuvanganzo Nyemvugo n'Inkuru", nameEn: "Oral Traditions & Stories", isHealthOrMedicine: false },
  { id: "cat-5", slug: "traditional-practices", nameRw: "Imigenzo n'Ibyirorere Gakondo", nameEn: "Traditional Practices", isHealthOrMedicine: false },
  { id: "cat-6", slug: "music-dance", nameRw: "Umuziki n'Imbyino Gakondo", nameEn: "Music & Dance", isHealthOrMedicine: false },
  { id: "cat-7", slug: "food-dietary", nameRw: "Ibyokurya n'Imirire Gakondo", nameEn: "Traditional Food & Diet", isHealthOrMedicine: false },
  { id: "cat-8", slug: "clothing-adornment", nameRw: "Imyambarire n'Uburanga Gakondo", nameEn: "Traditional Clothing", isHealthOrMedicine: false },
  { id: "cat-9", slug: "traditional-knowledge-health", nameRw: "Ubumenyi n'Ubuvuzi Gakondo", nameEn: "Traditional Knowledge & Healing", isHealthOrMedicine: true },
  { id: "cat-10", slug: "cultural-events", nameRw: "Ibirori n'Imihango y'Umuco", nameEn: "Cultural Events", isHealthOrMedicine: false },
  { id: "cat-11", slug: "contemporary-cultural-life", nameRw: "Ubuzima bw'Umuco bugezweho", nameEn: "Contemporary Culture", isHealthOrMedicine: false },
];

export default async function PublishPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // In case DB is offline during UI design
    user = null;
  }

  // Fetch categories from DB if available, else use fallback
  let categories = FALLBACK_CATEGORIES;
  try {
    const dbCategories = await prisma.topicCategory.findMany({
      where: { isArchived: false },
      select: {
        id: true,
        slug: true,
        nameRw: true,
        nameEn: true,
        isHealthOrMedicine: true,
      },
      orderBy: { slug: "asc" },
    });
    if (dbCategories.length > 0) {
      categories = dbCategories;
    }
  } catch {
    categories = FALLBACK_CATEGORIES;
  }

  // Guest Gate: If unauthenticated, invite them to login/register to publish
  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-stone-200/90 rounded-2xl shadow-xs p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Kwandika ku Urunana
            </h1>
            <p className="mt-2 text-xs text-stone-600 font-serif leading-relaxed">
              Kugira ngo ubashe gutangaza inyandiko, umugani, cyangwa inkuru y&apos;ubuvanganzo,
              ugomba kuba winjiye muri konti yawe yemeye amategeko agenga umuryango.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-800 border border-stone-300 hover:bg-stone-50 transition"
            >
              Injira muri Konti
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 shadow-2xs transition flex items-center justify-center space-x-1.5"
            >
              <span>Fungura Konti Nshya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
          <Feather className="w-3.5 h-3.5" />
          <span>Iteka ry&apos;Umwanditsi (Contributor Studio)</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Kwandika no Gusangiza Inkuru Gakondo
        </h1>
        <p className="font-serif text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl italic leading-relaxed">
          Uyu mwanya ni uwawe wo kwandika amateka, imigani, inyito z&apos;amagambo, cyangwa uburambe bw&apos;umuryango.
          Hitamo inkomoko y&apos;ubumenyi kandi usobanure ibitekerezo byawe mu mutuzo.
        </p>
      </div>

      {/* Main Publishing Form */}
      <PublishForm categories={categories} />
    </div>
  );
}

