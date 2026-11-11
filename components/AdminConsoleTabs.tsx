"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  resolveReportAction,
  updateWordOfTheWeekAction,
  processRemovalRequestAction,
  toggleFoundingContributorAction,
  toggleModeratorRoleAction,
  setModerationThresholdAction,
} from "@/app/actions/admin";
import {
  ShieldAlert,
  BookOpen,
  Users,
  BarChart3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  Loader2,
  Check,
  X,
  Send,
  Sliders,
} from "lucide-react";
import type {
  ModerationActionType,
  ReportReason,
  ContentLanguage,
} from "@/generated/prisma/client";

interface CommunityRuleItem {
  ruleCode: string;
  titleRw: string;
  titleEn: string;
  tier: number;
}

interface ReportItem {
  id: string;
  reason: ReportReason;
  details: string | null;
  autoHidden: boolean;
  createdAt: Date;
  reporter: {
    displayName: string;
    username: string;
  };
  publication?: {
    id: string;
    title: string;
    slug: string;
    author: {
      id: string;
      displayName: string;
      username: string;
    };
  } | null;
  comment?: {
    id: string;
    body: string;
    author: {
      id: string;
      displayName: string;
      username: string;
    };
    publication: {
      slug: string;
      title: string;
    };
  } | null;
}

interface WordOfTheWeekData {
  id: string;
  word: string;
  pronunciation: string | null;
  explanationRw: string;
  explanationEn: string;
  culturalContext: string | null;
  exampleSentenceRw: string | null;
  exampleSentenceTranslation: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface RemovalRequestItem {
  id: string;
  requesterIdentifier: string;
  notes: string | null;
  requestedAt: Date;
  user?: {
    id: string;
    displayName: string;
    username: string;
    emailOrPhone: string | null;
  } | null;
}

interface UserItem {
  id: string;
  username: string;
  displayName: string;
  emailOrPhone: string | null;
  role: string;
  isModerator: boolean;
  isFoundingContributor: boolean;
  createdAt: Date;
  _count: {
    publications: number;
    comments: number;
  };
}

interface AdminConsoleTabsProps {
  currentUserId: string;
  currentUserRole: string;
  isModerator: boolean;
  reports: ReportItem[];
  rules: CommunityRuleItem[];
  activeWord: WordOfTheWeekData | null;
  removalRequests: RemovalRequestItem[];
  users: UserItem[];
  metrics: {
    totalPublications: number;
    totalComments: number;
    totalUsers: number;
    pendingReportsCount: number;
    languageCounts: Record<ContentLanguage, number>;
  };
  currentThreshold: number;
}

export default function AdminConsoleTabs({
  currentUserRole,
  isModerator,
  reports,
  rules,
  activeWord,
  removalRequests,
  users,
  metrics,
  currentThreshold,
}: AdminConsoleTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "MODERATION" | "WORD" | "REMOVALS" | "USERS" | "METRICS"
  >("MODERATION");
  const [isPending, startTransition] = useTransition();

  // Resolution form state for moderation
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [actionTaken, setActionTaken] = useState<ModerationActionType>(
    "DISMISS_AND_RESTORE" as ModerationActionType
  );
  const [ruleCited, setRuleCited] = useState<string>("BR-1");
  const [notes, setNotes] = useState<string>("");
  const [modMessage, setModMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  // Word of the week form state
  const [wordFormMsg, setWordFormMsg] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  // Users filter state
  const [userSearch, setUserSearch] = useState("");

  // Threshold state
  const [thresholdVal, setThresholdVal] = useState(currentThreshold);

  const isAdmin = currentUserRole === "ADMIN";

  // Handle report resolution
  async function handleResolveReport(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReportId) return;

    setModMessage(null);
    const formData = new FormData();
    formData.set("reportId", selectedReportId);
    formData.set("actionTaken", actionTaken);
    formData.set("ruleCited", ruleCited);
    formData.set("notes", notes);

    startTransition(async () => {
      const res = await resolveReportAction(formData);
      if (res && res.error) {
        setModMessage({ text: res.error, isError: true });
      } else {
        setModMessage({
          text: "Icyemezo cy'ubugenzuzi cyashyizwe mu bikorwa neza!",
          isError: false,
        });
        setSelectedReportId(null);
        setNotes("");
        router.refresh();
      }
    });
  }

  // Handle Word of the Week Submit
  async function handleWordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWordFormMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await updateWordOfTheWeekAction(formData);
      if (res && res.error) {
        setWordFormMsg({ text: res.error, isError: true });
      } else {
        setWordFormMsg({
          text: "Ijambo ry'icyumweru ryatangajwe neza ku rubuga!",
          isError: false,
        });
        form.reset();
        router.refresh();
      }
    });
  }

  // Handle Removal Request
  async function handleProcessRemoval(requestId: string, approved: boolean) {
    if (
      !confirm(
        approved
          ? "Uragira ngo wemeze iri siba ry'amakuru n'inyandiko zose z'uyu mukoresha?"
          : "Uragira ngo wange ubu busabe bwo gusiba?"
      )
    )
      return;

    startTransition(async () => {
      await processRemovalRequestAction(requestId, approved);
      router.refresh();
    });
  }

  // Handle User Role Toggles
  async function handleToggleFounding(userId: string) {
    startTransition(async () => {
      await toggleFoundingContributorAction(userId);
      router.refresh();
    });
  }

  async function handleToggleModerator(userId: string) {
    startTransition(async () => {
      await toggleModeratorRoleAction(userId);
      router.refresh();
    });
  }

  // Handle threshold change
  async function handleSaveThreshold() {
    startTransition(async () => {
      await setModerationThresholdAction(thresholdVal);
      router.refresh();
      alert("Threshold yavuguruwe!");
    });
  }

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Tab Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("MODERATION")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-2 ${
            activeTab === "MODERATION"
              ? "bg-emerald-800 text-white shadow-2xs"
              : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Ibugenzuzi (Reports)</span>
          {reports.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "MODERATION"
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {reports.length}
            </span>
          )}
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("WORD")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-2 ${
              activeTab === "WORD"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ijambo ry&apos;Icyumweru</span>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("REMOVALS")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-2 ${
              activeTab === "REMOVALS"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Gusaba Gusibwa (14d SLA)</span>
            {removalRequests.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "REMOVALS"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {removalRequests.length}
              </span>
            )}
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("USERS")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-2 ${
              activeTab === "USERS"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Abanyamuryango</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("METRICS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-2 ${
            activeTab === "METRICS"
              ? "bg-emerald-800 text-white shadow-2xs"
              : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Incamake y&apos;Urubuga</span>
        </button>
      </div>

      {/* TAB 1: MODERATION QUEUE */}
      {activeTab === "MODERATION" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Ubugenzuzi bw&apos;Ibirego (Moderation Queue)
              </h2>
              <p className="text-xs text-stone-500">
                Ibisubizo n&apos;inyandiko zagaragajwe n&apos;abaturage ko
                zibangamiye amategeko y&apos;umuryango.
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              Raporo {reports.length} zitegerejwe
            </span>
          </div>

          {modMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                modMessage.isError
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              {modMessage.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{modMessage.text}</span>
            </div>
          )}

          {reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => {
                const isSelected = selectedReportId === report.id;
                return (
                  <div
                    key={report.id}
                    className={`p-5 rounded-2xl border transition bg-white space-y-4 shadow-2xs ${
                      isSelected
                        ? "border-emerald-800 ring-2 ring-emerald-800/10"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200">
                            {report.reason}
                          </span>
                          {report.autoHidden && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                              Yarahagaritswe (Auto-hidden)
                            </span>
                          )}
                          <span className="text-[10px] text-stone-400">
                            Yatanzwe na @{report.reporter.username}
                          </span>
                        </div>

                        {/* Target Info */}
                        {report.publication && (
                          <div className="pt-1">
                            <span className="text-xs text-stone-500">Inkuru: </span>
                            <Link
                              href={`/publications/${report.publication.slug}`}
                              target="_blank"
                              className="font-serif font-bold text-stone-900 text-sm hover:underline inline-flex items-center space-x-1"
                            >
                              <span>{report.publication.title}</span>
                              <ExternalLink className="w-3 h-3 text-stone-400" />
                            </Link>
                            <span className="text-xs text-stone-500 block">
                              Umwanditsi: {report.publication.author.displayName} (@
                              {report.publication.author.username})
                            </span>
                          </div>
                        )}

                        {report.comment && (
                          <div className="pt-1">
                            <span className="text-xs text-stone-500">
                              Igitekerezo ku nkuru:{" "}
                            </span>
                            <Link
                              href={`/publications/${report.comment.publication.slug}#discussion`}
                              target="_blank"
                              className="font-serif font-bold text-stone-900 text-xs hover:underline"
                            >
                              {report.comment.publication.title}
                            </Link>
                            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700 italic my-1 font-serif">
                              &ldquo;{report.comment.body}&rdquo;
                            </div>
                            <span className="text-xs text-stone-500">
                              Umwanditsi: {report.comment.author.displayName} (@
                              {report.comment.author.username})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReportId(isSelected ? null : report.id)
                          }
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                            isSelected
                              ? "bg-stone-200 text-stone-800"
                              : "bg-emerald-800 text-white hover:bg-emerald-900"
                          }`}
                        >
                          {isSelected ? "Funga" : "Suzuma & Fata Icyemezo"}
                        </button>
                      </div>
                    </div>

                    {/* Report Details */}
                    {report.details && (
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
                        <strong className="block text-[10px] uppercase font-bold text-amber-800">
                          Ibisobanuro by&apos;uwatanze raporo:
                        </strong>
                        <p className="mt-0.5">{report.details}</p>
                      </div>
                    )}

                    {/* Decision Drawer */}
                    {isSelected && (
                      <form
                        onSubmit={handleResolveReport}
                        className="pt-4 border-t border-stone-200 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                              Icyemezo cyafashwe (Action Taken) *
                            </label>
                            <select
                              value={actionTaken}
                              onChange={(e) =>
                                setActionTaken(
                                  e.target.value as ModerationActionType
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                            >
                              <option value="DISMISS_AND_RESTORE">
                                Kureka & Kugarura (Dismiss & Restore)
                              </option>
                              <option value="WARN_AUTHOR">
                                Kuburira Umwanditsi (Warn Author)
                              </option>
                              <option value="REMOVE_CONTENT">
                                Gusiba Ibyanditswe (Remove Content)
                              </option>
                              <option value="RESTRICT_ACCOUNT">
                                Gufungira Konti By&apos;agateganyo (Restrict)
                              </option>
                              <option value="SUSPEND_ACCOUNT">
                                Gufunga Konti Burundu (Suspend Account)
                              </option>
                            </select>
                          </div>

                          {actionTaken !== "DISMISS_AND_RESTORE" && (
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                Ingingo y&apos;Amategeko yishwe (Rule Cited) *
                              </label>
                              <select
                                value={ruleCited}
                                onChange={(e) => setRuleCited(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                              >
                                {rules.map((rule) => (
                                  <option key={rule.ruleCode} value={rule.ruleCode}>
                                    {rule.ruleCode}: {rule.titleRw}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                            Ibisobanuro by&apos;umugenzuzi (Moderation Notes)
                          </label>
                          <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Andika impamvu y'iki cyemezo kugira ngo ibikwe mu gitabo cy'ubugenzuzi..."
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReportId(null)}
                            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                          >
                            Kureka
                          </button>
                          <button
                            type="submit"
                            disabled={isPending}
                            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                          >
                            {isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>Emeza Icyemezo</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-stone-200/80 rounded-2xl space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Nta raporo zitegerejwe!
              </h3>
              <p className="text-xs text-stone-500">
                Urubuga rufite ituze kandi ibyanditswe byose birubahiriza amategeko
                y&apos;umuryango.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WORD OF THE WEEK CURATOR */}
      {activeTab === "WORD" && isAdmin && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Ijambo ry&apos;Icyumweru (Word of the Week)
            </h2>
            <p className="text-xs text-stone-500">
              Hitamo kandi utangaze ijambo rikize ry&apos;Ikinyarwanda riza ku
              rupapuro rw&apos;itangiriro ry&apos;urubuga.
            </p>
          </div>

          {wordFormMsg && (
            <div
              className={`p-4 rounded-xl text-xs font-medium flex items-center space-x-2 ${
                wordFormMsg.isError
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              {wordFormMsg.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{wordFormMsg.text}</span>
            </div>
          )}

          {/* Current Word Display */}
          {activeWord && (
            <div className="p-5 rounded-2xl bg-emerald-900 text-white space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  Ijambo ry&apos;ubu riri ku rubuga
                </span>
                <span className="text-[10px] text-emerald-200">
                  Rirangira ku wa{" "}
                  {new Date(activeWord.endDate).toLocaleDateString("rw-RW", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold tracking-tight">
                {activeWord.word}{" "}
                {activeWord.pronunciation && (
                  <span className="text-sm font-normal text-emerald-300 font-mono">
                    /{activeWord.pronunciation}/
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-100 leading-relaxed font-serif">
                {activeWord.explanationRw}
              </p>
              {activeWord.exampleSentenceRw && (
                <div className="pt-2 border-t border-emerald-800 text-xs italic text-amber-200">
                  &ldquo;{activeWord.exampleSentenceRw}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Form to Publish New Word */}
          <form
            onSubmit={handleWordSubmit}
            className="p-6 bg-white border border-stone-200 rounded-2xl space-y-4 shadow-2xs"
          >
            <h3 className="font-serif font-bold text-stone-900 text-base">
              Tangaza Ijambo Rishya ry&apos;Icyumweru
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Ijambo (Word) *
                </label>
                <input
                  type="text"
                  name="word"
                  required
                  placeholder="urugero: Urunana, Ubupfura, Indashyikirwa"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Uko Rivugwa (Pronunciation / Phonetics)
                </label>
                <input
                  type="text"
                  name="pronunciation"
                  placeholder="urugero: u-ru-naː-na"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Ibisobanuro mu Kinyarwanda *
                </label>
                <textarea
                  name="explanationRw"
                  required
                  rows={2}
                  placeholder="Sobanura neza icyo iri jambo risobanura n'uko rikoreshwa mu muco..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Ibisobanuro mu Cyongereza (English Explanation) *
                </label>
                <textarea
                  name="explanationEn"
                  required
                  rows={2}
                  placeholder="English meaning and cultural nuance..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Urugero rw&apos;Interuro (Example Sentence in Kinyarwanda)
                </label>
                <input
                  type="text"
                  name="exampleSentenceRw"
                  placeholder="Interuro igaragaza uko rikoreshwa..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Ubusobanuro bw&apos;Interuro mu Cyongereza (Sentence Translation)
                </label>
                <input
                  type="text"
                  name="exampleSentenceTranslation"
                  placeholder="English translation of the sentence..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Tangaza Ijambo ry&apos;Icyumweru</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: REMOVAL REQUESTS (14-DAY SLA) */}
      {activeTab === "REMOVALS" && isAdmin && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Gusaba Gusiba Amakuru By&apos;umuryango (14-Day SLA)
            </h2>
            <p className="text-xs text-stone-500">
              Ubusabe bw&apos;abanyamuryango basabye ko inyandiko zabo zose zisibwa
              burundu hakurikijwe amategeko y&apos;uburenganzira ku makuru (GDPR /
              Data Rights).
            </p>
          </div>

          {removalRequests.length > 0 ? (
            <div className="space-y-3">
              {removalRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl border border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-stone-900 text-sm">
                        {req.user
                          ? `${req.user.displayName} (@${req.user.username})`
                          : req.requesterIdentifier}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        Bitegerejwe (Pending)
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-stone-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Yatanzwe:{" "}
                          {new Date(req.requestedAt).toLocaleDateString("rw-RW")}
                        </span>
                      </span>
                      {req.notes && <span>• Impamvu: {req.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleProcessRemoval(req.id, false)}
                      disabled={isPending}
                      className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
                    >
                      Kwangira
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProcessRemoval(req.id, true)}
                      disabled={isPending}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition shadow-xs"
                    >
                      Emeza & Siba Burundu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-stone-200/80 rounded-2xl space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Nta busabe bwo gusiba buhari
              </h3>
              <p className="text-xs text-stone-500">
                Ubusabe bwose bwarakiriwe kandi bwakemuwe mu gihe cyagenwe cya
                minsi 14.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: USERS & ROLES */}
      {activeTab === "USERS" && isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Abanyamuryango n&apos;Inshingano (Contributors & Roles)
              </h2>
              <p className="text-xs text-stone-500">
                Guhitamo abanyamuryango b&apos;intangiriro n&apos;abagize uruhare mu
                bugenzuzi.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Shakisha umunyamuryango..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white focus:ring-2 focus:ring-emerald-800"
              />
            </div>
          </div>

          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-serif font-bold text-sm flex items-center justify-center shrink-0">
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Link
                        href={`/profile/${u.username}`}
                        target="_blank"
                        className="font-semibold text-sm text-stone-900 hover:underline"
                      >
                        {u.displayName}
                      </Link>
                      <span className="text-xs text-stone-400">@{u.username}</span>

                      {u.isFoundingContributor && (
                        <span className="inline-flex items-center space-x-0.5 px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                          <Award className="w-3 h-3 text-amber-700" />
                          <span>Intangiriro</span>
                        </span>
                      )}

                      {u.isModerator && (
                        <span className="inline-flex items-center space-x-0.5 px-2 py-0.2 rounded-full bg-teal-100 text-teal-900 text-[10px] font-bold uppercase">
                          <Shield className="w-3 h-3 text-teal-700" />
                          <span>Umugenzuzi</span>
                        </span>
                      )}

                      {u.role === "ADMIN" && (
                        <span className="px-2 py-0.2 rounded-full bg-stone-900 text-white text-[10px] font-bold uppercase">
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-stone-500 pt-0.5">
                      Inkuru {u._count.publications} • Ibitekerezo{" "}
                      {u._count.comments}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleFounding(u.id)}
                    disabled={isPending}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      u.isFoundingContributor
                        ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                        : "border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {u.isFoundingContributor
                      ? "Kura ku Ntangiriro"
                      : "Gira Intangiriro"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleModerator(u.id)}
                    disabled={isPending || u.role === "ADMIN"}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      u.isModerator
                        ? "border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100"
                        : "border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {u.isModerator ? "Kura ku Bugenzuzi" : "Gira Umugenzuzi"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM METRICS & SETTINGS */}
      {activeTab === "METRICS" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Incamake n&apos;Ibicuruzwa by&apos;Urubuga (Platform Overview)
            </h2>
            <p className="text-xs text-stone-500">
              Imibare igaragaza ubwiyongere bw&apos;inkuru n&apos;abanyamuryango ku
              Urunana.
            </p>
          </div>

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Inkuru Zose
              </span>
              <div className="font-serif text-3xl font-bold text-stone-900">
                {metrics.totalPublications}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Ibitekerezo
              </span>
              <div className="font-serif text-3xl font-bold text-stone-900">
                {metrics.totalComments}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Abanyamuryango
              </span>
              <div className="font-serif text-3xl font-bold text-stone-900">
                {metrics.totalUsers}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Raporo Zitegerejwe
              </span>
              <div className="font-serif text-3xl font-bold text-rose-800">
                {metrics.pendingReportsCount}
              </div>
            </div>
          </div>

          {/* Language Breakdown */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-4 shadow-2xs">
            <h3 className="font-serif font-bold text-stone-900 text-sm">
              Ikwirakwizwa ry&apos;Indimi mu Nkuru (Language Distribution)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-semibold text-stone-700 block">
                  🇷🇼 Ikinyarwanda
                </span>
                <span className="text-xl font-bold text-stone-900">
                  {metrics.languageCounts.KINYARWANDA || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-semibold text-stone-700 block">
                  🇬🇧 English
                </span>
                <span className="text-xl font-bold text-stone-900">
                  {metrics.languageCounts.ENGLISH || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-semibold text-stone-700 block">
                  🇫🇷 Français
                </span>
                <span className="text-xl font-bold text-stone-900">
                  {metrics.languageCounts.FRENCH || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-semibold text-stone-700 block">
                  🌐 Indimi Zivanze
                </span>
                <span className="text-xl font-bold text-stone-900">
                  {metrics.languageCounts.MIXED || 0}
                </span>
              </div>
            </div>
          </div>

          {/* System Settings: Auto-hide Threshold */}
          {isAdmin && (
            <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-4 shadow-2xs">
              <div className="flex items-center space-x-2 text-stone-900">
                <Sliders className="w-4 h-4 text-emerald-800" />
                <h3 className="font-serif font-bold text-sm">
                  Igenamiterere ry&apos;Ibugenzuzi (Moderation Threshold Setting)
                </h3>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Umubare w&apos;abaturage batandukanye batanze raporo kuri Tier 2
                mbere y&apos;uko inkuru ihagarikwa by&apos;agateganyo (Auto-hide).
              </p>

              <div className="flex items-center space-x-3 max-w-xs">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={thresholdVal}
                  onChange={(e) => setThresholdVal(parseInt(e.target.value) || 3)}
                  className="w-24 px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb]"
                />
                <button
                  type="button"
                  onClick={handleSaveThreshold}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition"
                >
                  Bika (Save)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
