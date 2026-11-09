"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { ArrowRight, Loader2, Feather } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await loginAction(formData);
      if (result.error) {
        setErrorMessage(result.error);
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
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
            Injira muri Konti yawe
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Uzuza amakuru yawe kugira ngo ukomeze gusoma no kwandika.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Username */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Imeri cyangwa Izina ry&apos;Urubuga (Email or Username)
            </label>
            <input
              type="text"
              name="identifier"
              required
              placeholder="urugero: kalisa@urugero.rw cyangwa kalisa"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition bg-[#fcfcfb]"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Ijambobanga (Password)
              </label>
            </div>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition bg-[#fcfcfb]"
            />
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
                <span>Injira</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-500">
            Nta konti ufite?{" "}
            <Link
              href="/register"
              className="font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              Iyandikishe hano
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

