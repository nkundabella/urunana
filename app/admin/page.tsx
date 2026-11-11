import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AdminConsoleTabs from "@/components/AdminConsoleTabs";
import { Shield } from "lucide-react";
import { ContentLanguage } from "@/generated/prisma/client";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();

  // Strict role check: must be ADMIN or moderator
  if (!currentUser || (currentUser.role !== "ADMIN" && !currentUser.isModerator)) {
    redirect("/");
  }

  // Fetch all necessary admin context in parallel
  const [
    reports,
    rules,
    activeWord,
    removalRequests,
    users,
    totalPublications,
    totalComments,
    totalUsers,
    pendingReportsCount,
    kinyarwandaCount,
    englishCount,
    frenchCount,
    mixedCount,
    thresholdSetting,
  ] = await Promise.all([
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: {
        reporter: {
          select: { displayName: true, username: true },
        },
        publication: {
          select: {
            id: true,
            title: true,
            slug: true,
            author: {
              select: { id: true, displayName: true, username: true },
            },
          },
        },
        comment: {
          select: {
            id: true,
            body: true,
            author: {
              select: { id: true, displayName: true, username: true },
            },
            publication: {
              select: { slug: true, title: true },
            },
          },
        },
      },
      orderBy: [{ autoHidden: "desc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.communityRule.findMany({
      select: {
        ruleCode: true,
        titleRw: true,
        titleEn: true,
        tier: true,
      },
      orderBy: { ruleCode: "asc" },
    }),
    prisma.wordOfTheWeek.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.removalRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            emailOrPhone: true,
          },
        },
      },
      orderBy: { requestedAt: "asc" },
      take: 20,
    }),
    prisma.user.findMany({
      where: { accountStatus: "ACTIVE" },
      select: {
        id: true,
        username: true,
        displayName: true,
        emailOrPhone: true,
        role: true,
        isModerator: true,
        isFoundingContributor: true,
        createdAt: true,
        _count: {
          select: {
            publications: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.publication.count({ where: { status: "PUBLISHED" } }),
    prisma.comment.count({ where: { status: "VISIBLE" } }),
    prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.publication.count({
      where: { contentLanguage: ContentLanguage.KINYARWANDA, status: "PUBLISHED" },
    }),
    prisma.publication.count({
      where: { contentLanguage: ContentLanguage.ENGLISH, status: "PUBLISHED" },
    }),
    prisma.publication.count({
      where: { contentLanguage: ContentLanguage.FRENCH, status: "PUBLISHED" },
    }),
    prisma.publication.count({
      where: { contentLanguage: ContentLanguage.MIXED, status: "PUBLISHED" },
    }),
    prisma.systemSetting.findUnique({
      where: { key: "MODERATION_DISTINCT_REPORTER_THRESHOLD" },
    }),
  ]);

  const currentThreshold = thresholdSetting ? parseInt(thresholdSetting.value) : 3;

  const metrics = {
    totalPublications,
    totalComments,
    totalUsers,
    pendingReportsCount,
    languageCounts: {
      KINYARWANDA: kinyarwandaCount,
      ENGLISH: englishCount,
      FRENCH: frenchCount,
      MIXED: mixedCount,
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Editorial Header */}
      <header className="space-y-2 border-b border-stone-200 pb-6">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          <Shield className="w-3.5 h-3.5" />
          <span>Ibiro by&apos;Ubuyobozi n&apos;Ubugenzuzi</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
          Ikigo cy&apos;Ubuyobozi bw&apos;Urunana
        </h1>
        <p className="font-serif text-sm sm:text-base text-stone-600 italic">
          Kugenzura amategeko y&apos;umuryango, gucunga ijambo ry&apos;icyumweru,
          kwemeza isibwa ry&apos;amakuru, no kubungabunga umuco n&apos;ururimi.
        </p>
      </header>

      {/* Main Tabbed Console Component */}
      <AdminConsoleTabs
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
        isModerator={currentUser.isModerator}
        reports={reports}
        rules={rules}
        activeWord={activeWord}
        removalRequests={removalRequests}
        users={users}
        metrics={metrics}
        currentThreshold={currentThreshold}
      />
    </div>
  );
}

