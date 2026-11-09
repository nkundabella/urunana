"use client";

import React, { useState } from "react";
import { X, ShieldCheck, BookOpen } from "lucide-react";

interface RuleItem {
  ruleCode: string;
  titleRw: string;
  titleEn: string;
  descriptionRw: string;
  descriptionEn: string;
}

interface CommunityRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void;
  lang?: "rw" | "en" | "fr";
}

const RULES: RuleItem[] = [
  {
    ruleCode: "BR-1",
    titleRw: "Guhugura ibitekerezo, si abantu",
    titleEn: "Disagree with ideas, not people",
    descriptionRw: "Guhangana ku bitekerezo byemewe ariko nta gutuka cyangwa gusenya mugenzi wawe.",
    descriptionEn: "Critique ideas respectfully; personal attacks and insults are strictly prohibited.",
  },
  {
    ruleCode: "BR-2",
    titleRw: "Nta gutoteza cyangwa guhohotera",
    titleEn: "No harassment or bullying",
    descriptionRw: "Kubuza umutekano undi muntu ku bushake birabujijwe rwose.",
    descriptionEn: "Targeted harassment or repeated unwanted interaction will not be tolerated.",
  },
  {
    ruleCode: "BR-3",
    titleRw: "Kwirinda urwango n'amagambo asenya",
    titleEn: "No hate or dehumanizing content",
    descriptionRw: "Amagambo ahembera urwango cyangwa asuzugura ikiremwamuntu akurwaho ako kanya.",
    descriptionEn: "Hate speech and dehumanizing language are auto-hidden upon first report.",
  },
  {
    ruleCode: "BR-4",
    titleRw: "Nta gutera ubwoba cyangwa urugomo",
    titleEn: "No threats or violence",
    descriptionRw: "Gukangisha urugomo ku muntu cyangwa itsinda birabujijwe cyane.",
    descriptionEn: "Threats of physical harm will result in instant auto-hide and account suspension.",
  },
  {
    ruleCode: "BR-5",
    titleRw: "Kubaha ibanga ry'umuntu (Privacy)",
    titleEn: "Protect people's privacy",
    descriptionRw: "Gutangaza amakuru bwite y'undi muntu utabiherewe uruhushya birabujijwe.",
    descriptionEn: "Sharing private contact info, private messages, or sensitive personal data is prohibited.",
  },
  {
    ruleCode: "BR-6",
    titleRw: "Sobanura inkomoko y'ubumenyi",
    titleEn: "Provide context for knowledge sources",
    descriptionRw: "Ntugashyireho ibitekerezo byawe nk'aho ari ukuri kudasubirwaho; hitamo inkomoko nyayo.",
    descriptionEn: "Do not present personal memory as universal fact; clearly tag your knowledge source.",
  },
  {
    ruleCode: "BR-7",
    titleRw: "Inkuru zitandukanye zibana mu mahoro",
    titleEn: "Multiple versions can coexist",
    descriptionRw: "Urunana rwubaha ko inkuru n'imigenzo bigira inyito zitandukanye mu duce dutandukanye.",
    descriptionEn: "Different versions of stories or traditions coexist freely; none is declared superior.",
  },
  {
    ruleCode: "BR-8",
    titleRw: "Kwirinda guhimba ibitari byo",
    titleEn: "Do not knowingly fabricate information",
    descriptionRw: "Guhimba amateka ukayagira ukuri kudasanzwe birabujijwe.",
    descriptionEn: "Fabricating historical or cultural facts and presenting them as truth is forbidden.",
  },
  {
    ruleCode: "BR-9",
    titleRw: "Kubaha umutungo mu by'ubwenge",
    titleEn: "Respect intellectual ownership & credit sources",
    descriptionRw: "Vuga umuntu, umuryango cyangwa igitabo wakuyeho amakuru.",
    descriptionEn: "Credit tradition-bearers, elders, or publications whenever reproducing knowledge.",
  },
  {
    ruleCode: "BR-10",
    titleRw: "Kuguma ku nsanganyamatsiko",
    titleEn: "Keep discussion relevant; no spam",
    descriptionRw: "Ntukinjize kwamamaza cyangwa kuyobya ibiganiro ku zindi ngingo zitari umuco.",
    descriptionEn: "Keep comments pertinent to cultural inquiry; avoid commercial promotion or derailing.",
  },
  {
    ruleCode: "BR-11",
    titleRw: "Kutiyitirira undi muntu",
    titleEn: "No impersonation",
    descriptionRw: "Kwigira undi muntu cyangwa gukoresha amazina ye mu buriganya birabujijwe.",
    descriptionEn: "Creating accounts pretending to be real public figures or other contributors is blocked.",
  },
  {
    ruleCode: "BR-12",
    titleRw: "Nta kwinjiza ibikorwa bya robot (Spam)",
    titleEn: "No spam or manipulation of engagement",
    descriptionRw: "Kwohereza ubutumwa busa bwinshi no gukoresha uburiganya mu gukwirakwiza inyandiko birahanwa.",
    descriptionEn: "Coordinated spam or synthetic engagement is auto-hidden upon multi-user reports.",
  },
  {
    ruleCode: "BR-13",
    titleRw: "Kwitondera ingingo ziremereye",
    titleEn: "Sensitive cultural topics require care",
    descriptionRw: "Tanga ibitekerezo mu mwuka wo kubaka, gushishoza no kwigira hamwe.",
    descriptionEn: "Treat delicate historical narratives with responsibility and dignity.",
  },
  {
    ruleCode: "BR-14",
    titleRw: "Ubumenyi bw'imiti gakondo si inama z'ubuvuzi",
    titleEn: "Traditional health knowledge is not medical advice",
    descriptionRw: "Inyandiko ku miti gakondo ni umurage gusa; ntibizigera bisimbura umuganga w'umwuga.",
    descriptionEn: "Cultural health posts carry mandatory disclaimers; consult medical practitioners for care.",
  },
  {
    ruleCode: "BR-15",
    titleRw: "Ubuyobozi buhana amakosa, si ibitekerezo",
    titleEn: "Moderation targets rule violations, not viewpoints",
    descriptionRw: "Nta muntu uzabuzwa ijambo kubera ko afite uburyo atangamo inkuru butandukanye n'ubw'abandi.",
    descriptionEn: "Content will never be removed solely for having a dissenting viewpoint.",
  },
  {
    ruleCode: "BR-16",
    titleRw: "Ubugenzuzi buciye mu mucyo",
    titleEn: "Moderation is logged and consistent",
    descriptionRw: "Buri cyemezo cy'ubugenzuzi kigomba kugaragaza ingingo y'amategeko yishwe.",
    descriptionEn: "Every moderation action logs the exact community rule cited for full accountability.",
  },
  {
    ruleCode: "BR-17",
    titleRw: "Gukosorana mu kinyabupfura",
    titleEn: "Good-faith correction is encouraged over conflict",
    descriptionRw: "Niba mugenzi wawe yibeshye mu mvugo cyangwa mu mateka, mukosore mu bworoherane.",
    descriptionEn: "Offer polite clarifications in comment threads rather than attacking authors.",
  },
  {
    ruleCode: "BR-18",
    titleRw: "Amategeko ashobora kuvugururwa mu mucyo",
    titleEn: "Rules may evolve transparently",
    descriptionRw: "Amategeko yose azavugururwa azajya agaragaza itariki yavugururiweho.",
    descriptionEn: "Platform guidelines evolve transparently with the community.",
  },
];

export default function CommunityRulesModal({
  isOpen,
  onClose,
  onAgree,
  lang = "rw",
}: CommunityRulesModalProps) {
  const [selectedLang, setSelectedLang] = useState<"rw" | "en">(lang === "en" ? "en" : "rw");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#fbfbf9] rounded-xl shadow-2xl border border-stone-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-800" />
            <h2 className="text-lg font-serif font-bold text-stone-900">
              {selectedLang === "rw"
                ? "Amategeko Agenga Umuryango w'Urunana"
                : "Urunana Community Principles"}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex rounded-md border border-stone-300 p-0.5 text-xs bg-stone-50">
              <button
                type="button"
                onClick={() => setSelectedLang("rw")}
                className={`px-2 py-1 rounded font-medium ${
                  selectedLang === "rw"
                    ? "bg-emerald-800 text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Kinyarwanda
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang("en")}
                className={`px-2 py-1 rounded font-medium ${
                  selectedLang === "en"
                    ? "bg-emerald-800 text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                English
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Intro */}
        <div className="px-6 py-3 bg-amber-50/70 border-b border-amber-200/60 text-xs text-amber-900 leading-relaxed flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-800 shrink-0" />
          <span>
            {selectedLang === "rw"
              ? "Aya mahame 18 ashyizweho kugira ngo asigasire umuco, ururimi, n'ubwubahane mu biganiro byacu byose."
              : "These 18 principles protect our cultural heritage, language, and mutual respect across all discussions."}
          </span>
        </div>

        {/* Scrollable rules list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 divide-y divide-stone-200">
          {RULES.map((rule) => (
            <div key={rule.ruleCode} className="pt-3 first:pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                  {rule.ruleCode}
                </span>
                <h3 className="text-sm font-semibold text-stone-900">
                  {selectedLang === "rw" ? rule.titleRw : rule.titleEn}
                </h3>
              </div>
              <p className="mt-1 text-xs text-stone-600 pl-8 leading-relaxed">
                {selectedLang === "rw" ? rule.descriptionRw : rule.descriptionEn}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-stone-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 transition"
          >
            {selectedLang === "rw" ? "Funga" : "Close"}
          </button>
          {onAgree && (
            <button
              type="button"
              onClick={() => {
                onAgree();
                onClose();
              }}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-md shadow-xs transition"
            >
              {selectedLang === "rw"
                ? "Nemeye Amategeko y'Umuryango"
                : "I Accept the Community Rules"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

