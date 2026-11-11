"use client";

import React, { useState } from "react";
import { submitReportAction } from "@/app/actions/publications";
import { ShieldAlert, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { ReportReason } from "@/generated/prisma/client";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicationId?: string;
  commentId?: string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  {
    group: "Umutekano n'Uburenganzira bw'Ikiremwamuntu (Tier 1 - Instant Review)",
    items: [
      { id: "THREATS_VIOLENCE", label: "Gukangisha urugomo (Threats or violence)", desc: "Gukangisha umutekano ku muntu cyangwa itsinda." },
      { id: "HATE_SPEECH", label: "Urwango n'amagambo asenya (Hate speech)", desc: "Amagambo ahembera urwango cyangwa asuzugura ikiremwamuntu." },
      { id: "PRIVACY_VIOLATION", label: "Gusohora ibanga ry'umuntu (Privacy violation)", desc: "Gutangaza amakuru bwite y'undi muntu utabiherewe uburenganzira." },
    ],
  },
  {
    group: "Ubudahemuka ku Bumenyi (Tier 2 - Multi-User Verification)",
    items: [
      { id: "SPAM_MANIPULATION", label: "Ubutumwa bwa robot cyangwa kwamamaza (Spam)", desc: "Kwohereza ubutumwa busa bwinshi no kwamamaza bitajyanye n'umuco." },
      { id: "IMPERSONATION", label: "Kutiyitirira undi muntu (Impersonation)", desc: "Kwigira undi muntu cyangwa gukoresha amazina ye mu buriganya." },
      { id: "PLAGIARISM_IP", label: "Kwiba inyandiko cyangwa umutungo mu by'ubwenge (Plagiarism)", desc: "Gukopera inyandiko y'undi utavuze aho wayikuye." },
    ],
  },
  {
    group: "Imyitwarire n'Isesengura (Tier 3 - Standard Admin Review)",
    items: [
      { id: "HARASSMENT", label: "Gutoteza cyangwa guhohotera (Harassment)", desc: "Kubuza umutekano undi muntu ku bushake." },
      { id: "FABRICATED_INFO", label: "Guhimba amateka nk'aho ari ukuri (Fabricated information)", desc: "Guhimba ibitari byo ku bushake ubyitirira amateka." },
      { id: "OFF_TOPIC", label: "Kuyobya ibiganiro (Off-topic)", desc: "Kuzana ingingo zidafite aho zihuriye n'umuco n'ururimi." },
      { id: "OTHER", label: "Ikindi kibazo (Other violation)", desc: "Ubundi buryo bubangamiye amategeko y'umuryango." },
    ],
  },
];

export default function ReportModal({
  isOpen,
  onClose,
  publicationId,
  commentId,
  targetTitle,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReason) {
      setErrorMessage("Hitamo impamvu yo gutanga raporo.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    if (publicationId) formData.set("publicationId", publicationId);
    if (commentId) formData.set("commentId", commentId);
    formData.set("reason", selectedReason);
    formData.set("details", details);

    try {
      const res = await submitReportAction(formData);
      if (res.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setSelectedReason("");
          setDetails("");
          setLoading(false);
        }, 1800);
      }
    } catch {
      setErrorMessage("Habaye ikosa ryo gutanga raporo.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-300 p-6 sm:p-7 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center space-x-2 text-rose-800">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Tanga Raporo ku Bintu Bibangamye
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {targetTitle && (
          <div className="p-2.5 rounded-lg bg-stone-100 text-xs text-stone-600 font-serif italic truncate">
            &ldquo;{targetTitle}&rdquo;
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
            <h4 className="font-serif font-bold text-stone-900">Raporo yakiriwe neza!</h4>
            <p className="text-xs text-stone-600">
              Ubuyobozi bw&apos;Urunana bugiye kuyisuzuma hashingiwe ku mategeko agenga umuryango.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
                Hitamo Impamvu (Reason for Report) *
              </label>

              <div className="space-y-4">
                {REPORT_REASONS.map((group) => (
                  <div key={group.group} className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      {group.group}
                    </span>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-start space-x-2.5 p-2 rounded-lg border text-left cursor-pointer transition ${
                            selectedReason === item.id
                              ? "border-rose-700 bg-rose-50/70 text-rose-950 font-medium"
                              : "border-stone-200 bg-[#fcfcfb] hover:bg-stone-50 text-stone-800"
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportReason"
                            value={item.id}
                            checked={selectedReason === item.id}
                            onChange={() => setSelectedReason(item.id as ReportReason)}
                            className="mt-1 text-rose-700 border-stone-300 focus:ring-rose-700"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-semibold">{item.label}</div>
                            <div className="text-[10px] text-stone-500 leading-tight">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-1">
                Ibisobanuro Byiyongereyeho (Additional Details - Optional)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tanga ibisobanuro byafasha ubuyobozi gusuzuma iyi raporo..."
                className="w-full p-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-rose-700"
              />
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
              >
                Kureka
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Ohereza Raporo</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

