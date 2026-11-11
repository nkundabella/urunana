import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SettingsTabs from "@/components/SettingsTabs";
import { Settings, ShieldCheck } from "lucide-react";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-stone-200 pb-6">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>Igenamiterere rya Konti (Account Settings)</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Gucunga Umwirondoro n&apos;Umutekano
        </h1>
        <p className="font-serif text-xs sm:text-sm text-stone-600 mt-1 max-w-xl italic leading-relaxed">
          Hindura amakuru yawe bwite, ijambobanga, ururimi ukoresha, n&apos;uburenganzira ku nyandiko zawe ku Urunana.
        </p>
      </div>

      {/* Tabs */}
      <SettingsTabs user={user} />
    </div>
  );
}
