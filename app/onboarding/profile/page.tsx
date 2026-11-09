"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveOnboardingProfileAction } from "@/app/actions/auth";
import { Sparkles, ArrowRight, Check, Compass, BookOpen, PenTool, MapPin } from "lucide-react";

const TOPIC_OPTIONS = [
  { id: "Amateka n'Umurage", label: "Amateka n'Umurage", icon: "📜", desc: "History & Heritage" },
  { id: "Ururimi rw'Ikinyarwanda", label: "Ururimi rw'Ikinyarwanda", icon: "🗣️", desc: "Language & Dialects" },
  { id: "Imigani n'Ibisakuzo", label: "Imigani n'Ibisakuzo", icon: "💡", desc: "Proverbs & Riddles" },
  { id: "Ubuvanganzo Nyemvugo", label: "Ubuvanganzo Nyemvugo", icon: "📖", desc: "Oral Traditions & Stories" },
  { id: "Ubumenyi n'Ubuvuzi Gakondo", label: "Ubumenyi n'Ubuvuzi Gakondo", icon: "🌿", desc: "Traditional Healing & Plants" },
  { id: "Umuziki n'Imbyino Gakondo", label: "Umuziki n'Imbyino Gakondo", icon: "🥁", desc: "Music & Dance" },
  { id: "Ibyokurya n'Imirire Gakondo", label: "Ibyokurya Gakondo", icon: "🍲", desc: "Traditional Cuisine" },
  { id: "Ubuzima bw'Umuco bugezweho", label: "Umuco bugezweho", icon: "🇷🇼", desc: "Contemporary Culture" },
];

const INTENT_OPTIONS = [
  {
    id: "reader",
    title: "Gusoma no Kwiga (Reader)",
    desc: "Nje hano ahanini gusoma inkuru, kumenya umuco, no gutanga ibitekerezo mu mwubahane.",
    icon: BookOpen,
  },
  {
    id: "contributor",
    title: "Kwandika no Gusangiza (Storyteller)",
    desc: "Mfitanye isano n'amateka, inkuru zo mu muryango cyangwa ubumenyi nifuza gusangiza abandi.",
    icon: PenTool,
  },
  {
    id: "both",
    title: "Byombi (Explorer & Contributor)",
    desc: "Nifuza gusoma inkuru z'abandi ndetse no gutanga umusanzu w'inyandiko n'uburambe bwanjye.",
    icon: Compass,
  },
];

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedIntent, setSelectedIntent] = useState<string>("both");
  const [regionalRoots, setRegionalRoots] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function toggleTopic(id: string) {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.set("bio", bio);
    formData.set("regionalRoots", regionalRoots);
    formData.set("communityIntent", selectedIntent);
    selectedTopics.forEach((t) => formData.append("areasOfInterest", t));

    try {
      await saveOnboardingProfileAction(formData);
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 bg-[#fbfbf9]">
      <div className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intambwe ya 2 / 2: Sobanura Umwirondoro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Dusezereye Ikaze mu Muryango w&apos;Urunana!
          </h1>
          <p className="mt-2 text-sm text-stone-600 max-w-lg mx-auto font-serif">
            Ibi bibazo bituma dushyira imbere inkuru n&apos;insanganyamatsiko zihuye n&apos;ibyo ukunda
            kandi bikafasha kumenya inkomoko n&apos;inyito z&apos;umuco wacu.
          </p>
        </div>

        {/* Questionnaire Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200/90 rounded-2xl shadow-xs p-6 sm:p-10 space-y-8">
          {/* Question 1: Cultural Topics */}
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1">
              1. Ni izihe nsanganyamatsiko z&apos;umuco wifuza gusoma cyangwa kwandikaho cyane?
            </label>
            <p className="text-xs text-stone-500 mb-3">
              Hitamo izo wumva zikurimo (urashobora guhitamo nyinshi):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TOPIC_OPTIONS.map((topic) => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? "border-emerald-800 bg-emerald-50/70 text-emerald-950 shadow-xs"
                        : "border-stone-200 bg-[#fcfcfb] text-stone-800 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">{topic.icon}</span>
                      <div>
                        <div className="text-xs font-semibold">{topic.label}</div>
                        <div className="text-[10px] text-stone-500">{topic.desc}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: Community Intent */}
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1">
              2. Uruhare rwawe rw&apos;ibanze ku rubuga rw&apos;Urunana ruzaba uruhe?
            </label>
            <p className="text-xs text-stone-500 mb-3">
              Nta kiguzi cyangwa icyemezo kidasubirwaho; ni uburyo bwo kumenya uko dutunganya intebe y&apos;ibiganiro:
            </p>
            <div className="space-y-2.5">
              {INTENT_OPTIONS.map((item) => {
                const isSelected = selectedIntent === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIntent(item.id)}
                    className={`w-full flex items-start space-x-3 p-3.5 rounded-xl border text-left transition ${
                      isSelected
                        ? "border-emerald-800 bg-emerald-50/70 text-emerald-950 shadow-xs"
                        : "border-stone-200 bg-[#fcfcfb] text-stone-800 hover:border-stone-300"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isSelected ? "bg-emerald-800 text-white" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Regional Roots */}
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-800" />
              <span>3. Inkomoko cyangwa Agace k&apos;Umuco ushaka guhagararira (Optional)</span>
            </label>
            <p className="text-xs text-stone-500 mb-2">
              Urugero: Akarere, Intara (Amajyaruguru, Amajyepfo, Iburengerazuba, Iburasirazuba, Kigali) cyangwa mu Mahanga (Diaspora).
            </p>
            <input
              type="text"
              value={regionalRoots}
              onChange={(e) => setRegionalRoots(e.target.value)}
              placeholder="urugero: Nyanza (Amajyepfo) cyangwa Kigali"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-[#fcfcfb]"
            />
          </div>

          {/* Question 4: Short Bio */}
          <div>
            <label className="block text-sm font-semibold text-stone-900 mb-1">
              4. Amagambo make akwerekeyeho (Short Bio - Optional)
            </label>
            <p className="text-xs text-stone-500 mb-2">
              Ibi bizagaragara ku mwirondoro wawe n&apos;imbere y&apos;inkuru zose uzandika:
            </p>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Andika interuro 1 cyangwa 2 zikwerekeyeho, urukundo ukunda umuco nyarwanda..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-[#fcfcfb]"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 order-2 sm:order-1"
            >
              Simbuka iyi ntambwe ubu (Skip for now)
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] transition shadow-xs flex items-center justify-center space-x-2 order-1 sm:order-2"
            >
              <span>{loading ? "Birabikwa..." : "Emeza & Tangira Gusoma"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

