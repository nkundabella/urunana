"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import CommunityRulesModal from "@/components/CommunityRulesModal";
import { ShieldCheck, ArrowRight, Loader2, Feather } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [selectedLang, setSelectedLang] = useState("rw");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!ageConfirmed) {
      setErrorMessage("Ugomba kwemeza ko ufite nibura imyaka 13 y'amavuko.");
      return;
    }

    if (!rulesAccepted) {
      setErrorMessage("Ugomba kwemeza ko uzakurikiza amategeko agenga umuryango w'Urunana.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("communityRulesAccepted", "true");
    formData.set("preferredLanguage", selectedLang);
    formData.set("statedAgeBand", "13+");

    try {
      const result = await registerAction(formData);
      if (result.error) {
        setErrorMessage(result.error);
        setLoading(false);
      } else {
        router.push("/onboarding/profile");
      }
    } catch {
      setErrorMessage("Habaye ikosa ryo kwinjira mu rusobe. Ongera ugerageze.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 bg-[#fbfbf9]">
      {/* Brand & Editorial Title */}
      <div className="max-w-md w-full text-center mb-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-emerald-900 group">
          <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center text-amber-300 shadow-sm group-hover:scale-105 transition">
            <Feather className="w-5 h-5" />
          </div>
          <span className="font-serif text-3xl font-bold tracking-tight text-stone-900">
            Urunana
          </span>
        </Link>
        <p className="mt-2 text-sm text-stone-600 font-serif italic">
          Ihuriro ry&apos;umuco, ururimi, inkuru n&apos;umurage w&apos;u Rwanda.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full bg-white border border-stone-200/90 rounded-2xl shadow-xs p-8 sm:p-10">
        <div className="mb-6">
          <h1 className="text-xl font-serif font-bold text-stone-900">
            Fungura Konti Nshya
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Injira mu muryango w&apos;abanditsi n&apos;abakunda umuco nyarwanda.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Amazina yawe (Full Name)
            </label>
            <input
              type="text"
              name="displayName"
              required
              placeholder="urugero: Kalisa Mugisha"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition bg-[#fcfcfb]"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Izina ry&apos;Urubuga (Username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-sm">
                @
              </span>
              <input
                type="text"
                name="username"
                required
                placeholder="kalisa"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition bg-[#fcfcfb]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Imeri (Email Address)
            </label>
            <input
              type="email"
              name="emailOrPhone"
              required
              placeholder="kalisa@urugero.rw"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition bg-[#fcfcfb]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Ijambobanga (Password)
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Byibura inyuguti 6..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition bg-[#fcfcfb]"
            />
          </div>

          {/* Language Selector (Kinyarwanda pre-selected default per CON-1) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Ururimi wifuza gukoresha (Interface Language)
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              <option value="rw">🇷🇼 Ikinyarwanda (Default / Ibanze)</option>
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
          </div>

          {/* Age Checkbox (FR-AUTH-6) */}
          <div className="pt-2">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-800 border-stone-300 focus:ring-emerald-800"
              />
              <span className="text-xs text-stone-600 leading-snug">
                Nemeza ko mfite nibura imyaka 13 y&apos;amavuko (I am at least 13 years old).
              </span>
            </label>
          </div>

          {/* Community Rules Checkbox (FR-AUTH-5) */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-800 border-stone-300 focus:ring-emerald-800"
              />
              <span className="text-xs text-stone-700 leading-snug">
                Nemeye kubahiriza{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRulesModalOpen(true);
                  }}
                  className="font-semibold text-emerald-800 underline hover:text-emerald-950 inline-flex items-center gap-0.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 inline" />
                  amategeko 18 agenga umuryango
                </button>{" "}
                yo kurengera umuco n&apos;ubwubahane.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] transition shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Biratunganywa...</span>
              </>
            ) : (
              <>
                <span>Komeza Ku Nyirondoro</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-500">
            Ufite konti isanzwe?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              Injira hano
            </Link>
          </p>
        </div>
      </div>

      {/* Community Rules Modal */}
      <CommunityRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onAgree={() => setRulesAccepted(true)}
        lang={selectedLang as "rw" | "en" | "fr"}
      />
    </div>
  );
}

