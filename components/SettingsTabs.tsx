"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateAccountProfileAction,
  changePasswordAction,
  deleteAccountToGhostAction,
  requestPermanentContentRemovalAction,
} from "@/app/actions/auth";
import {
  User,
  Lock,
  Shield,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileText,
  Sparkles,
  X,
} from "lucide-react";

interface SettingsTabsProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio?: string | null;
    emailOrPhone?: string | null;
    preferredLanguage: string;
    researchUseConsent: boolean;
    isFoundingContributor: boolean;
  };
}

export default function SettingsTabs({ user }: SettingsTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "privacy">("profile");

  // Profile Form States
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || "");
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage || "rw");
  const [researchConsent, setResearchConsent] = useState(user.researchUseConsent);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMsg, setSecurityMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Privacy & Removal States
  const [removalNotes, setRemovalNotes] = useState("");
  const [removalLoading, setRemovalLoading] = useState(false);
  const [removalMsg, setRemovalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Ghost Deletion Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alsoRemoveContent, setAlsoRemoveContent] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Handle Profile Update
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    const formData = new FormData();
    formData.set("displayName", displayName);
    formData.set("bio", bio);
    formData.set("preferredLanguage", preferredLanguage);
    formData.set("researchUseConsent", researchConsent ? "true" : "false");

    try {
      const res = await updateAccountProfileAction(formData);
      if (res.error) {
        setProfileMsg({ type: "error", text: res.error });
      } else {
        setProfileMsg({ type: "success", text: "Amakuru y'umwirondoro yabitswe neza!" });
        router.refresh();
      }
    } catch {
      setProfileMsg({ type: "error", text: "Habaye ikosa ryo kubika amakuru." });
    } finally {
      setProfileLoading(false);
    }
  }

  // 2. Handle Password Change
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSecurityLoading(true);
    setSecurityMsg(null);

    const formData = new FormData();
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    try {
      const res = await changePasswordAction(formData);
      if (res.error) {
        setSecurityMsg({ type: "error", text: res.error });
      } else {
        setSecurityMsg({ type: "success", text: "Ijambobanga ryahinduwe neza!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setSecurityMsg({ type: "error", text: "Habaye ikosa ryo guhindura ijambobanga." });
    } finally {
      setSecurityLoading(false);
    }
  }

  // 3. Handle Standalone Content Removal Request
  async function handleRemovalRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRemovalLoading(true);
    setRemovalMsg(null);

    try {
      const res = await requestPermanentContentRemovalAction(removalNotes);
      if (res.error) {
        setRemovalMsg({ type: "error", text: res.error });
      } else {
        setRemovalMsg({
          type: "success",
          text: "Ubusabe bwo gusiba inyandiko bwakiriwe. Ubuyobozi buzabusuzuma mu minsi 14 (14-day SLA).",
        });
        setRemovalNotes("");
      }
    } catch {
      setRemovalMsg({ type: "error", text: "Habaye ikosa ryo kohereza ubusabe." });
    } finally {
      setRemovalLoading(false);
    }
  }

  // 4. Handle Ghost Account Deletion
  async function handleGhostDelete() {
    setDeleteLoading(true);
    try {
      await deleteAccountToGhostAction(alsoRemoveContent);
      router.push("/");
      router.refresh();
    } catch {
      alert("Habaye ikosa ryo gusiba konti.");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-stone-200 bg-white rounded-t-xl px-2 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === "profile"
              ? "border-emerald-800 text-emerald-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Umwirondoro & Ururimi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === "security"
              ? "border-emerald-800 text-emerald-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Umutekano (Security)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("privacy")}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition ${
            activeTab === "privacy"
              ? "border-emerald-800 text-emerald-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Uburenganzira ku Makuru (Privacy)</span>
        </button>
      </div>

      {/* TAB 1: Profile & Language */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="bg-white border border-stone-200 rounded-b-xl p-6 sm:p-8 space-y-6">
          {profileMsg && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
                profileMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {profileMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Amazina yawe (Display Name)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Izina ry&apos;Urubuga (Username - Read Only)
              </label>
              <input
                type="text"
                disabled
                value={`@${user.username}`}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-xs text-stone-500 bg-stone-100 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Imeri (Email - Protected by Privacy)
              </label>
              <input
                type="text"
                disabled
                value={user.emailOrPhone || "Nta meri yanditse"}
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 text-xs text-stone-500 bg-stone-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Ururimi rw&apos;Ibanze (Preferred Language)
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
              >
                <option value="rw">🇷🇼 Ikinyarwanda (Default / Ibanze)</option>
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Amagambo make akwerekeyeho (Short Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Andika ku buvanganzo, amateka cyangwa umuryango ukomokamo..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 transition flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
            >
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Bika Impinduka</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Security & Change Password */}
      {activeTab === "security" && (
        <form onSubmit={handlePasswordSubmit} className="bg-white border border-stone-200 rounded-b-xl p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Guhindura Ijambobanga (Change Password)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Shyiramo ijambobanga rya none kugira ngo uhindure irishya rifite umutekano.
            </p>
          </div>

          {securityMsg && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
                securityMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {securityMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{securityMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Ijambobanga rya None (Current Password)
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Ijambobanga Rishya (New Password)
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Byibura inyuguti 6..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Emeza Ijambobanga Rishya (Confirm New Password)
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-start">
            <button
              type="submit"
              disabled={securityLoading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 transition flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
            >
              {securityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Hindura Ijambobanga</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Privacy & Data Rights */}
      {activeTab === "privacy" && (
        <div className="bg-white border border-stone-200 rounded-b-xl p-6 sm:p-8 space-y-8">
          {/* Research & Language Tech Consent Toggle (FR-PUB-16) */}
          <div className="space-y-3 pb-6 border-b border-stone-200">
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Ubwitange mu Bushakashatsi bw&apos;Ururimi (FR-PUB-16)</span>
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Gukoresha Inyandiko mu Guteza Imbere Ikinyarwanda
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Urashobora kwemeza cyangwa guhagarika igihe icyo ari cyo cyose ko inyandiko zawe zikoreshwa
              mu bushakashatsi bw&apos;ururimi cyangwa ikoranabuhanga rya Kinyarwanda.
            </p>
            <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={researchConsent}
                onChange={(e) => setResearchConsent(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-800 border-stone-300 focus:ring-emerald-800"
              />
              <span className="text-xs text-stone-800 font-medium">
                Nemeye ko inyandiko zanjye zikoreshwa mu bushakashatsi bw&apos;ururimi rw&apos;Ikinyarwanda.
              </span>
            </label>
          </div>

          {/* Standalone Content Removal Request (FR-AUTH-8: 14-day SLA) */}
          <div className="space-y-3 pb-6 border-b border-stone-200">
            <div className="flex items-center space-x-2 text-stone-700 text-xs font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Ubusabe bwo Gusiba Inyandiko Burundu (FR-AUTH-8)</span>
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Gusiba Inyandiko n&apos;Ibitekerezo Byose (14-day SLA)
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Niba wifuza ko inyandiko n&apos;ibitekerezo byose wanditse ku rubuga bisibwa burundu (bitagumye mu buvanganzo),
              tanga ubusabe hano. Ubuyobozi buzabusuzuma kandi bukuririreho mu minsi 14, unahabwe imeri y&apos;ubwemezi.
            </p>

            {removalMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  removalMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{removalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleRemovalRequestSubmit} className="space-y-3 pt-1">
              <textarea
                rows={2}
                value={removalNotes}
                onChange={(e) => setRemovalNotes(e.target.value)}
                placeholder="Sobanura muri make impamvu cyangwa inyandiko wifuza ko zisibwa burundu..."
                className="w-full max-w-lg px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
              />
              <div>
                <button
                  type="submit"
                  disabled={removalLoading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-800 border border-stone-300 hover:bg-stone-50 transition shadow-2xs disabled:opacity-50"
                >
                  {removalLoading ? "Biratunganywa..." : "Ohereza Ubusabe bwo Gusiba Inyandiko"}
                </button>
              </div>
            </form>
          </div>

          {/* Self-service Ghost Account Deletion (FR-AUTH-7) */}
          <div className="space-y-3 p-5 rounded-xl bg-red-50/60 border border-red-200">
            <div className="flex items-center space-x-2 text-red-800 text-xs font-bold uppercase tracking-wider">
              <Trash2 className="w-4 h-4" />
              <span>Gufunga Konti Burundu (Ghost Account Deletion - FR-AUTH-7)</span>
            </div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Gusiba Konti yawe ku Urunana
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Gusiba konti bisiba amakuru yawe yose bwite (imeri, ijambobanga, bio, ifoto). Konti yawe ihinduka
              <strong> Ghost Account</strong> kugira ngo inkuru n&apos;amateka wasangiye n&apos;abandi bidatakara mu buvanganzo rusange.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition shadow-2xs"
              >
                Siba Konti Yanjye
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ghost Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-300 p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Urifuza Gusiba Konti Burundu?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
              <p>
                Konti yawe ihita ihindurwa <strong>Ghost Account</strong> ako kanya:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-stone-700">
                <li>Imeri, ijambobanga, n&apos;amakuru yawe bwite birasibwa burundu mu bubiko.</li>
                <li>Ntuzongera gushobora kwinjira muri iyi konti.</li>
                <li>Inkuru n&apos;ibitekerezo watanze bizaguma ku rubuga byitirirwe umwirondoro w&apos;inyandiko (Ghost Contributor) kugira ngo umurage rusange udasenyuka.</li>
              </ul>
            </div>

            {/* Checkbox for Also Permanently Remove Content (FR-AUTH-8) */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoRemoveContent}
                  onChange={(e) => setAlsoRemoveContent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-red-700 border-amber-300 focus:ring-red-700"
                />
                <span className="text-xs text-amber-950 leading-snug">
                  <strong>Nifuza kandi ko n&apos;inkuru zanjye zose zisibwa burundu:</strong>{" "}
                  Ibi bizohereza ubusabe ku buyobozi bwo gukuraho inyandiko n&apos;ibitekerezo byose mu minsi 14 (14-day SLA).
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition"
              >
                Kureka (Cancel)
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleGhostDelete}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Emeza Gusiba Konti</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
