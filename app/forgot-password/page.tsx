"use client";

import React, { useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { Feather, ArrowRight, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setMessage(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("email", email);

    try {
      const res = await requestPasswordResetAction(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setMessage(res.message || "Ubutumwa bwoherejwe kuri imeri yawe.");
      }
    } catch {
      setErrorMessage("Habaye ikosa ryo kohereza ubusabe. Ongera ugerageze.");
    } finally {
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
          Kugarura Ijambobanga ry&apos;Umwirondoro
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full bg-white border border-stone-200/90 rounded-2xl shadow-xs p-8 sm:p-10">
        <div className="mb-6">
          <h1 className="text-xl font-serif font-bold text-stone-900">
            Wibagiwe Ijambobanga?
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Shyiramo imeri wakoresheje wiyandikisha, tuguhe amabwiriza yo kurihindura.
          </p>
        </div>

        {message && (
          <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Imeri yawe (Registered Email)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="urugero: kalisa@urugero.rw"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-[#fcfcfb]"
            />
          </div>

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
                <span>Ohereza Amabwiriza</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-200 text-center">
          <Link
            href="/login"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Subira ahandi winjirira (Back to Login)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

