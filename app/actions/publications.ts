"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  AccountStatus,
  ContentLanguage,
  ContentType,
  KnowledgeSourceType,
  PublicationStatus,
  ReportReason,
  CommentStatus,
  NotificationType,
} from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 7)
  );
}

export async function createPublicationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in to publish." };
  if (user.accountStatus === AccountStatus.RESTRICTED) {
    return { error: "Your account is currently restricted from publishing (FR-MOD-10)." };
  }
  if (!user.communityRulesAccepted) {
    return { error: "You must accept the Community Rules before publishing (FR-AUTH-5)." };
  }

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const summary = (formData.get("summary") as string)?.trim();
  const contentType = formData.get("contentType") as ContentType;
  const contentLanguage = (formData.get("contentLanguage") as ContentLanguage) || ContentLanguage.KINYARWANDA;
  const sourceCitation = (formData.get("sourceCitation") as string)?.trim() || null;
  const isDraft = formData.get("isDraft") === "true";
  const researchConsent = formData.get("researchConsent") === "on" || formData.get("researchConsent") === "true";

  // Knowledge sources (array)
  const knowledgeSourcesRaw = formData.getAll("knowledgeSources") as KnowledgeSourceType[];
  const categoryIds = formData.getAll("categoryIds") as string[];

  // Validation
  if (!title || title.length < 5 || title.length > 150) {
    return { error: "Title must be between 5 and 150 characters (FR-PUB-12)." };
  }

  if (!isDraft && (!body || body.length < 100 || body.length > 20000)) {
    return { error: "Published body content must be between 100 and 20,000 characters (FR-PUB-12)." };
  }

  if (!contentType) {
    return { error: "You must select a primary Content Type (FR-KT-1)." };
  }

  if (!knowledgeSourcesRaw || knowledgeSourcesRaw.length === 0) {
    return { error: "At least one Knowledge Source tag is mandatory (FR-KT-2, Community Rule 6)." };
  }

  if (!categoryIds || categoryIds.length === 0) {
    return { error: "You must select at least one topic category (FR-PUB-10)." };
  }

  const slug = slugify(title);

  const publication = await prisma.publication.create({
    data: {
      title,
      slug,
      body: body || "",
      summary: summary || title,
      authorId: user.id,
      contentType,
      knowledgeSources: knowledgeSourcesRaw,
      contentLanguage,
      sourceCitation,
      hostingLicenseGranted: true,
      researchUseConsent: researchConsent,
      status: isDraft ? PublicationStatus.DRAFT : PublicationStatus.PUBLISHED,
      publishedAt: isDraft ? null : new Date(),
      categories: {
        create: categoryIds.map((id) => ({ categoryId: id })),
      },
    },
  });

  // Notify followers if published (FR-NOTIF-1)
  if (!isDraft) {
    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      select: { followerId: true },
    });

    if (followers.length > 0) {
      await prisma.notification.createMany({
        data: followers.map((f) => ({
          userId: f.followerId,
          actorId: user.id,
          type: NotificationType.NEW_PUBLICATION,
          title: "Inyandiko Nshya y'Uwo Ukurikira",
          message: `${user.displayName} yanditse inkuru nshya: "${title}"`,
          entityType: "PUBLICATION",
          entityId: publication.id,
        })),
      });
    }
  }

  revalidatePath("/");
  return { success: true, slug: publication.slug };
}

export async function updatePublicationAction(id: string, currentVersion: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await prisma.publication.findUnique({
    where: { id },
  });

  if (!existing || existing.authorId !== user.id) {
    return { error: "Publication not found or unauthorized." };
  }

  // FR-PUB-14: Concurrency / optimistic locking check
  if (existing.version !== currentVersion) {
    return {
      error: "This publication has been modified elsewhere since you opened it. Please refresh and review before saving.",
      conflict: true,
    };
  }

  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const summary = (formData.get("summary") as string)?.trim();
  const contentType = formData.get("contentType") as ContentType;
  const contentLanguage = formData.get("contentLanguage") as ContentLanguage;
  const sourceCitation = (formData.get("sourceCitation") as string)?.trim() || null;
  const knowledgeSourcesRaw = formData.getAll("knowledgeSources") as KnowledgeSourceType[];

  if (!title || title.length < 5 || title.length > 150) {
    return { error: "Title must be between 5 and 150 characters." };
  }
  if (!body || body.length < 100) {
    return { error: "Body content must be at least 100 characters." };
  }

  const updated = await prisma.publication.update({
    where: { id },
    data: {
      title,
      body,
      summary: summary || title,
      contentType,
      contentLanguage,
      knowledgeSources: knowledgeSourcesRaw,
      sourceCitation,
      isEdited: true,
      lastEditedAt: new Date(),
      version: { increment: 1 },
    },
  });

  revalidatePath(`/publications/${updated.slug}`);
  revalidatePath("/");
  return { success: true, slug: updated.slug };
}

export async function deletePublicationAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await prisma.publication.findUnique({
    where: { id },
  });

  if (!existing || (existing.authorId !== user.id && user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  await prisma.publication.delete({
    where: { id },
  });

  revalidatePath("/");
  return { success: true };
}

export async function toggleBookmarkAction(publicationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in to bookmark." };

  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_publicationId: {
        userId: user.id,
        publicationId,
      },
    },
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: { id: existing.id },
    });
    revalidatePath(`/publications`);
    return { bookmarked: false };
  } else {
    await prisma.bookmark.create({
      data: {
        userId: user.id,
        publicationId,
      },
    });
    revalidatePath(`/publications`);
    return { bookmarked: true };
  }
}

export async function toggleFollowAction(targetUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in to follow contributors." };

  // FR-FOL-1: Block self-follow
  if (user.id === targetUserId) {
    return { error: "You cannot follow your own profile (FR-FOL-1)." };
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: user.id,
        followingId: targetUserId,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { id: existing.id },
    });
    revalidatePath(`/profile`);
    return { following: false };
  } else {
    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    // In-app notification (FR-NOTIF-1)
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        actorId: user.id,
        type: NotificationType.FOLLOW,
        title: "Ufite Umukunzi Mushya",
        message: `${user.displayName} yatangiye kugukurikira ku Urunana.`,
      },
    });

    revalidatePath(`/profile`);
    return { following: true };
  }
}

export async function createCommentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in to comment (FR-COM-7)." };
  if (user.accountStatus === AccountStatus.RESTRICTED) {
    return { error: "Your account is currently restricted from commenting (FR-MOD-10)." };
  }

  const publicationId = formData.get("publicationId") as string;
  const parentId = (formData.get("parentId") as string) || null;
  const body = (formData.get("body") as string)?.trim();
  const isAlternativeVersion = formData.get("isAlternativeVersion") === "true";

  if (!body || body.length < 2) {
    return { error: "Comment cannot be empty." };
  }

  const pub = await prisma.publication.findUnique({
    where: { id: publicationId },
    select: { id: true, authorId: true, slug: true, title: true },
  });

  if (!pub) return { error: "Publication not found." };

  const comment = await prisma.comment.create({
    data: {
      publicationId,
      authorId: user.id,
      parentId,
      body,
      isAlternativeVersion,
      status: CommentStatus.VISIBLE,
    },
  });

  // Notify publication author or parent comment author (FR-NOTIF-1)
  if (!parentId && pub.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: pub.authorId,
        actorId: user.id,
        type: NotificationType.COMMENT,
        title: "Igitekerezo Gishya ku Nkuru Yawe",
        message: `${user.displayName} yatanze igitekerezo ku nkuru: "${pub.title}"`,
        entityType: "PUBLICATION",
        entityId: pub.id,
      },
    });
  } else if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { authorId: true },
    });
    if (parentComment && parentComment.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: parentComment.authorId,
          actorId: user.id,
          type: NotificationType.REPLY,
          title: "Igisubizo ku Gitekerezo cyawe",
          message: `${user.displayName} yashubije igitekerezo cyawe.`,
          entityType: "COMMENT",
          entityId: comment.id,
        },
      });
    }
  }

  revalidatePath(`/publications/${pub.slug}`);
  return { success: true };
}

export async function deleteCommentAction(commentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { replies: true, publication: { select: { slug: true } } },
  });

  if (!comment || (comment.authorId !== user.id && user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  // FR-COM-8: If comment has replies, leave placeholder "[comment removed]" so reply threads stay intact
  if (comment.replies.length > 0) {
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: CommentStatus.REMOVED_PLACEHOLDER,
        body: "[comment removed]",
      },
    });
  } else {
    await prisma.comment.delete({
      where: { id: commentId },
    });
  }

  if (comment.publication?.slug) {
    revalidatePath(`/publications/${comment.publication.slug}`);
  }
  return { success: true };
}

/**
 * FR-MOD-1, FR-MOD-4, FR-MOD-5, FR-MOD-5B:
 * 3-Tier Moderation Reporting System
 */
export async function submitReportAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in to report content." };

  const publicationId = (formData.get("publicationId") as string) || null;
  const commentId = (formData.get("commentId") as string) || null;
  const reason = formData.get("reason") as ReportReason;
  const details = (formData.get("details") as string)?.trim() || null;

  if (!publicationId && !commentId) {
    return { error: "Target publication or comment required." };
  }
  if (!reason) {
    return { error: "Report reason is required." };
  }

  // Prevent duplicate report by the same user with the same reason
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId: user.id,
      publicationId,
      commentId,
      reason,
    },
  });

  if (existingReport) {
    return { error: "You have already filed a report for this issue." };
  }

  // Create report
  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      publicationId,
      commentId,
      reason,
      details,
    },
  });

  // TIER 1: Instant auto-hide on 1 report (FR-MOD-4)
  // Threats, hate, privacy violation
  const isTier1 =
    reason === ReportReason.THREATS_VIOLENCE ||
    reason === ReportReason.HATE_SPEECH ||
    reason === ReportReason.PRIVACY_VIOLATION;

  if (isTier1) {
    if (publicationId) {
      await prisma.publication.update({
        where: { id: publicationId },
        data: {
          status: PublicationStatus.AUTO_HIDDEN,
          autoHideReason: `Auto-hidden pending admin review due to Tier-1 report (${reason}).`,
        },
      });
    }
    await prisma.report.update({
      where: { id: report.id },
      data: { autoHidden: true },
    });
    revalidatePath("/");
    return { success: true, autoHidden: true, tier: 1 };
  }

  // TIER 2: Auto-hide once distinct reporters >= threshold N (FR-MOD-5)
  // Spam, impersonation, plagiarism
  const isTier2 =
    reason === ReportReason.SPAM_MANIPULATION ||
    reason === ReportReason.IMPERSONATION ||
    reason === ReportReason.PLAGIARISM_IP;

  if (isTier2) {
    // Read dynamic threshold from SystemSetting (FR-ADM-9, default 3)
    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: "MODERATION_DISTINCT_REPORTER_THRESHOLD" },
    });
    const threshold = parseInt(thresholdSetting?.value || "3", 10);

    // Count distinct reporters for this target under Tier-2 reasons
    const distinctReporters = await prisma.report.groupBy({
      by: ["reporterId"],
      where: {
        publicationId,
        commentId,
        reason: {
          in: [
            ReportReason.SPAM_MANIPULATION,
            ReportReason.IMPERSONATION,
            ReportReason.PLAGIARISM_IP,
          ],
        },
      },
    });

    if (distinctReporters.length >= threshold) {
      if (publicationId) {
        await prisma.publication.update({
          where: { id: publicationId },
          data: {
            status: PublicationStatus.AUTO_HIDDEN,
            autoHideReason: `Auto-hidden pending admin review due to accumulation of reports from ${distinctReporters.length} distinct users (${reason}).`,
          },
        });
      }
      await prisma.report.update({
        where: { id: report.id },
        data: { autoHidden: true },
      });
      revalidatePath("/");
      return { success: true, autoHidden: true, tier: 2 };
    }
  }

  // TIER 3 (FR-MOD-5B): Harassment, fabricated information, off-topic, other
  // NEVER auto-hidden by volume alone to protect alternate cultural versions and debates.
  return { success: true, autoHidden: false, tier: 3 };
}

