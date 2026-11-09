"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  AccountStatus,
  ModerationActionType,
  NotificationType,
  PublicationStatus,
  ReportStatus,
  UserRole,
} from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function resolveReportAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.ADMIN && !user.isModerator)) {
    return { error: "Unauthorized access to moderation console." };
  }

  const reportId = formData.get("reportId") as string;
  const actionTaken = formData.get("actionTaken") as ModerationActionType;
  const ruleCited = formData.get("ruleCited") as string; // Must cite community rule (BR-1 to BR-18, FR-MOD-9)
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!reportId || !actionTaken) {
    return { error: "Report ID and action are required." };
  }

  if (actionTaken !== ModerationActionType.DISMISS_AND_RESTORE && !ruleCited) {
    return { error: "You must cite the specific Community Rule violated (FR-MOD-9, Community Rule 15)." };
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      publication: { select: { id: true, authorId: true, title: true } },
      comment: { select: { id: true, authorId: true } },
    },
  });

  if (!report) return { error: "Report not found." };

  const targetType = report.publicationId ? "PUBLICATION" : report.commentId ? "COMMENT" : "USER";
  const targetId = report.publicationId || report.commentId || "";
  const authorId = report.publication?.authorId || report.comment?.authorId;

  // 1. Execute moderation action
  if (actionTaken === ModerationActionType.DISMISS_AND_RESTORE) {
    if (report.publicationId) {
      await prisma.publication.update({
        where: { id: report.publicationId },
        data: {
          status: PublicationStatus.PUBLISHED,
          autoHideReason: null,
        },
      });
    }
  } else if (actionTaken === ModerationActionType.REMOVE_CONTENT) {
    if (report.publicationId) {
      await prisma.publication.update({
        where: { id: report.publicationId },
        data: {
          status: PublicationStatus.REMOVED,
          autoHideReason: `Removed by administrator for violation of ${ruleCited}.`,
        },
      });
    } else if (report.commentId) {
      await prisma.comment.delete({
        where: { id: report.commentId },
      });
    }
  } else if (actionTaken === ModerationActionType.RESTRICT_ACCOUNT && authorId) {
    await prisma.user.update({
      where: { id: authorId },
      data: { accountStatus: AccountStatus.RESTRICTED },
    });
  } else if (actionTaken === ModerationActionType.SUSPEND_ACCOUNT && authorId) {
    await prisma.user.update({
      where: { id: authorId },
      data: { accountStatus: AccountStatus.SUSPENDED },
    });
  }

  // 2. Mark report as actioned/dismissed
  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: actionTaken === ModerationActionType.DISMISS_AND_RESTORE ? ReportStatus.DISMISSED : ReportStatus.ACTIONED,
      reviewedById: user.id,
      reviewedAt: new Date(),
      resolutionNotes: notes,
    },
  });

  // 3. Log action for accountability (FR-MOD-8, Community Rule 16)
  await prisma.moderationActionLog.create({
    data: {
      actorId: user.id,
      targetType,
      targetId,
      actionTaken,
      ruleCited: ruleCited || "NONE",
      notes,
    },
  });

  // 4. In-app notification to affected author (FR-MOD-10)
  if (authorId && actionTaken !== ModerationActionType.DISMISS_AND_RESTORE) {
    await prisma.notification.create({
      data: {
        userId: authorId,
        actorId: user.id,
        type: NotificationType.MODERATION_ACTION,
        title: "Icyemezo cy'Ubugenzuzi ku Buranga bw'Urugero (Moderation)",
        message: `Icyemezo: ${actionTaken}. Ingingo y'Amategeko yashingiweho: ${ruleCited}. ${notes ? `Ibisobanuro: ${notes}` : ""}`,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function setModerationThresholdAction(threshold: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Admin access required." };
  }

  if (threshold < 1 || threshold > 50) {
    return { error: "Threshold must be between 1 and 50." };
  }

  await prisma.systemSetting.upsert({
    where: { key: "MODERATION_DISTINCT_REPORTER_THRESHOLD" },
    update: { value: threshold.toString() },
    create: {
      key: "MODERATION_DISTINCT_REPORTER_THRESHOLD",
      value: threshold.toString(),
      description: "Threshold of distinct reporters required to auto-hide Tier-2 content",
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateWordOfTheWeekAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Admin access required." };
  }

  const word = (formData.get("word") as string)?.trim();
  const pronunciation = (formData.get("pronunciation") as string)?.trim() || null;
  const explanationRw = (formData.get("explanationRw") as string)?.trim();
  const explanationEn = (formData.get("explanationEn") as string)?.trim();
  const explanationFr = (formData.get("explanationFr") as string)?.trim() || null;
  const culturalContext = (formData.get("culturalContext") as string)?.trim() || null;
  const exampleSentenceRw = (formData.get("exampleSentenceRw") as string)?.trim() || null;
  const exampleSentenceTranslation = (formData.get("exampleSentenceTranslation") as string)?.trim() || null;

  if (!word || !explanationRw || !explanationEn) {
    return { error: "Word and both Kinyarwanda & English explanations are required." };
  }

  // Deactivate previous active words
  await prisma.wordOfTheWeek.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.wordOfTheWeek.create({
    data: {
      word,
      pronunciation,
      explanationRw,
      explanationEn,
      explanationFr,
      culturalContext,
      exampleSentenceRw,
      exampleSentenceTranslation,
      startDate: now,
      endDate: nextWeek,
      isActive: true,
      createdById: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function processRemovalRequestAction(requestId: string, approved: boolean, notes?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Admin access required." };
  }

  const request = await prisma.removalRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) return { error: "Request not found." };

  if (approved && request.userId) {
    // Permanently remove all publications and comments authored by the user
    await prisma.publication.deleteMany({
      where: { authorId: request.userId },
    });
    await prisma.comment.deleteMany({
      where: { authorId: request.userId },
    });
  }

  await prisma.removalRequest.update({
    where: { id: requestId },
    data: {
      status: approved ? "COMPLETED" : "REJECTED",
      completedAt: new Date(),
      completedById: user.id,
      notes,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleFoundingContributorAction(targetUserId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Admin access required." };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { error: "User not found." };

  const isFounding = !target.isFoundingContributor;

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isFoundingContributor: isFounding,
      foundingJoinDate: isFounding ? new Date() : null,
    },
  });

  revalidatePath("/admin");
  return { success: true, isFoundingContributor: isFounding };
}

export async function toggleModeratorRoleAction(targetUserId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return { error: "Admin access required." };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) return { error: "User not found." };

  const isModerator = !target.isModerator;

  await prisma.user.update({
    where: { id: targetUserId },
    data: { isModerator },
  });

  revalidatePath("/admin");
  return { success: true, isModerator };
}

