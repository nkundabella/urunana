import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  AccountStatus,
  CommentStatus,
  ContentLanguage,
  KnowledgeSourceType,
  ModerationActionType,
  NotificationType,
  PublicationStatus,
  RemovalRequestStatus,
  ReportReason,
  ReportStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import {
  requireAdmin,
  requireAdminOrMod,
} from "../../plugins/auth-guard.js";
import { slugifyText } from "../posts/post.presenter.js";

const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  THREATS_VIOLENCE: "Iterabwoba n'urugomo",
  HATE_SPEECH: "Amagambo y'urwango",
  PRIVACY_VIOLATION: "Ubuzima bwite",
  SPAM_MANIPULATION: "Spam / Uburiganya",
  IMPERSONATION: "Kwiyitirira undi",
  PLAGIARISM_IP: "Kwiyitirira igihangano cy'abandi",
  HARASSMENT: "Gutoteza",
  FABRICATED_INFO: "Amakuru y'imfabusa",
  OFF_TOPIC: "Ibiri hanze y'insanganyamatsiko",
  OTHER: "Ikindi",
};

const REPORT_RULE_CODES: Record<ReportReason, string> = {
  THREATS_VIOLENCE: "BR-4",
  HATE_SPEECH: "BR-3",
  PRIVACY_VIOLATION: "BR-5",
  SPAM_MANIPULATION: "BR-12",
  IMPERSONATION: "BR-11",
  PLAGIARISM_IP: "BR-9",
  HARASSMENT: "BR-2",
  FABRICATED_INFO: "BR-8",
  OFF_TOPIC: "BR-10",
  OTHER: "BR-16",
};

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteSuffix(length = 4): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length];
  }
  return out;
}

function toPercentages(counts: number[]): number[] {
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return counts.map(() => 0);
  const raw = counts.map((n) => Math.round((n / total) * 100));
  const diff = 100 - raw.reduce((sum, n) => sum + n, 0);
  if (diff !== 0 && raw.length > 0) {
    raw[0] = Math.max(0, raw[0] + diff);
  }
  return raw;
}

async function readReportThreshold(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "MODERATION_DISTINCT_REPORTER_THRESHOLD" },
  });
  const parsed = Number.parseInt(setting?.value ?? "3", 10);
  return Number.isNaN(parsed) ? 3 : Math.max(1, Math.min(10, parsed));
}

const resolveRemovalSchema = z.object({
  action: z.enum(["emeza", "siba", "hagarika"]),
  notes: z.string().trim().max(1000).optional(),
});

const moderationActionSchema = z.object({
  action: z.enum([
    "Bireke",
    "Subizaho",
    "Kuburira",
    "Kuraho",
    "Hagarika konti",
    "DISMISS",
    "RESTORE",
    "WARN",
    "REMOVE",
    "SUSPEND",
  ]),
  ruleCited: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1000).optional(),
});

const createTopicSchema = z.object({
  nameRw: z.string().trim().min(2, "Izina ry'insanganyamatsiko rirakenewe.").max(80),
  nameEn: z.string().trim().min(2).max(80).optional(),
  nameFr: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(400).optional(),
  isHealthOrMedicine: z.boolean().optional(),
});

const thresholdSchema = z.object({
  threshold: z.coerce.number().int().min(1).max(10),
});

export async function adminRoutes(app: FastifyInstance) {
  // GET /api/v1/admin/overview?period=7d|30d|all
  app.get(
    "/api/v1/admin/overview",
    { preHandler: requireAdminOrMod },
    async (request) => {
      const query = request.query as { period?: string };
      const period =
        query.period === "7d" || query.period === "30d" || query.period === "all"
          ? query.period
          : "7d";

      const now = Date.now();
      const cutoffDate =
        period === "7d"
          ? new Date(now - 7 * 24 * 60 * 60 * 1000)
          : period === "30d"
            ? new Date(now - 30 * 24 * 60 * 60 * 1000)
            : null;

      const postWhere = {
        status: PublicationStatus.PUBLISHED,
        ...(cutoffDate ? { publishedAt: { gte: cutoffDate } } : {}),
      };

      const commentWhere = {
        status: CommentStatus.VISIBLE,
        ...(cutoffDate ? { createdAt: { gte: cutoffDate } } : {}),
      };

      const [
        publishedPosts,
        commentsCount,
        commentAuthorGroups,
        activeUsersCount,
        pendingRemovalCount,
        openReportsCount,
        threshold,
        topics,
        totalInviteCodes,
        usedInviteCodes,
      ] = await Promise.all([
        prisma.publication.findMany({
          where: postWhere,
          select: {
            id: true,
            authorId: true,
            contentLanguage: true,
            knowledgeSources: true,
          },
        }),
        prisma.comment.count({ where: commentWhere }),
        prisma.comment.findMany({
          where: commentWhere,
          select: { authorId: true },
          distinct: ["authorId"],
        }),
        prisma.user.count({
          where: {
            accountStatus: { in: [AccountStatus.ACTIVE, AccountStatus.RESTRICTED] },
            ...(cutoffDate ? { createdAt: { lte: new Date(now) } } : {}),
          },
        }),
        prisma.removalRequest.count({
          where: { status: RemovalRequestStatus.PENDING },
        }),
        prisma.report.count({
          where: { status: { in: [ReportStatus.OPEN, ReportStatus.REVIEWED] } },
        }),
        readReportThreshold(),
        prisma.topicCategory.findMany({
          where: { isArchived: false },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            slug: true,
            nameRw: true,
            nameEn: true,
            nameFr: true,
            isHealthOrMedicine: true,
          },
        }),
        prisma.foundingInviteCode.count(),
        prisma.foundingInviteCode.count({
          where: { usedById: { not: null } },
        }),
      ]);

      const postsByAuthor = new Map<string, number>();
      const langCounts = { rw: 0, en: 0, fr: 0, mixed: 0 };
      const srcCounts = {
        personal: 0,
        oral: 0,
        researched: 0,
        interpretation: 0,
      };

      for (const p of publishedPosts) {
        postsByAuthor.set(p.authorId, (postsByAuthor.get(p.authorId) ?? 0) + 1);

        if (p.contentLanguage === ContentLanguage.KINYARWANDA) langCounts.rw += 1;
        else if (p.contentLanguage === ContentLanguage.ENGLISH) langCounts.en += 1;
        else if (p.contentLanguage === ContentLanguage.FRENCH) langCounts.fr += 1;
        else langCounts.mixed += 1;

        const firstSource = p.knowledgeSources[0];
        if (firstSource === KnowledgeSourceType.PERSONAL_EXPERIENCE) {
          srcCounts.personal += 1;
        } else if (
          firstSource === KnowledgeSourceType.FAMILY_ORAL_TRADITION ||
          firstSource === KnowledgeSourceType.COMMUNITY_PRACTICE
        ) {
          srcCounts.oral += 1;
        } else if (
          firstSource === KnowledgeSourceType.RESEARCH_BASED ||
          firstSource === KnowledgeSourceType.DOCUMENTED_HISTORY
        ) {
          srcCounts.researched += 1;
        } else {
          srcCounts.interpretation += 1;
        }
      }

      const totalPosts = publishedPosts.length;
      const contributorsCount = postsByAuthor.size;
      const repeatContributors = [...postsByAuthor.values()].filter(
        (c) => c >= 2
      ).length;
      const commentersCount = commentAuthorGroups.length;

      const [rwPct, enPct, frPct, mixedPct] = toPercentages([
        langCounts.rw,
        langCounts.en,
        langCounts.fr,
        langCounts.mixed,
      ]);

      const [personalPct, oralPct, researchedPct, interpPct] = toPercentages([
        srcCounts.personal,
        srcCounts.oral,
        srcCounts.researched,
        srcCounts.interpretation,
      ]);

      const returningPct =
        contributorsCount > 0
          ? Math.round((repeatContributors / contributorsCount) * 100)
          : null;
      const readerToContributorPct =
        activeUsersCount > 0 && contributorsCount > 0
          ? Math.round((contributorsCount / activeUsersCount) * 100)
          : null;
      const commentFunnelPct =
        activeUsersCount > 0
          ? Math.min(100, Math.round((commentersCount / activeUsersCount) * 100))
          : 0;
      const publishFunnelPct =
        activeUsersCount > 0
          ? Math.min(
              100,
              Math.round((contributorsCount / activeUsersCount) * 100)
            )
          : 0;

      const kpis = [
        {
          id: "contributors",
          title: "Abanditsi",
          value: contributorsCount > 0 ? String(contributorsCount) : null,
          caption: "Contributors",
        },
        {
          id: "activeReaders",
          title: "Abasomyi bakora",
          value:
            activeUsersCount > 0
              ? activeUsersCount.toLocaleString("en-US")
              : null,
          caption: "Active users",
        },
        {
          id: "returning",
          title: "Abagaruka",
          value: returningPct !== null ? `${returningPct}%` : null,
          caption: "Returning",
        },
        {
          id: "comments",
          title: "Ibitekerezo",
          value: commentsCount > 0 ? String(commentsCount) : null,
          caption: "Comments",
        },
        {
          id: "postsByLanguage",
          title: "Inyandiko ku rurimi",
          value: totalPosts > 0 ? String(totalPosts) : null,
          caption: "Posts published",
        },
        {
          id: "byKnowledgeType",
          title: "Inyandiko ku bwoko bw'ubumenyi",
          value: totalPosts > 0 ? `${oralPct}%` : null,
          caption: "Oral / community share",
        },
        {
          id: "readerToContributor",
          title: "Abasomyi bahinduka abanditsi",
          value:
            readerToContributorPct !== null
              ? `${readerToContributorPct}%`
              : null,
          caption: "Reader → contributor",
        },
        {
          id: "repeatContributors",
          title: "Abanditsi basubiramo",
          value: repeatContributors > 0 ? String(repeatContributors) : null,
          caption: "Repeat contributors",
        },
      ];

      const charts = [
        {
          id: "language",
          title: "Inyandiko ku rurimi",
          rows: [
            { label: "Ikinyarwanda", pct: rwPct, count: langCounts.rw },
            { label: "English", pct: enPct, count: langCounts.en },
            { label: "Français", pct: frPct, count: langCounts.fr },
            { label: "Mixed", pct: mixedPct, count: langCounts.mixed },
          ],
        },
        {
          id: "knowledgeSource",
          title: "Ku bwoko bw'ubumenyi",
          rows: [
            {
              label: "Personal experience",
              pct: personalPct,
              count: srcCounts.personal,
            },
            {
              label: "Family / oral tradition",
              pct: oralPct,
              count: srcCounts.oral,
            },
            { label: "Researched", pct: researchedPct, count: srcCounts.researched },
            {
              label: "Interpretation",
              pct: interpPct,
              count: srcCounts.interpretation,
            },
          ],
        },
        {
          id: "funnel",
          title: "Umusomyi → Umwanditsi",
          rows: [
            {
              label: "Abakoresha",
              pct: activeUsersCount > 0 ? 100 : 0,
              count: activeUsersCount,
            },
            {
              label: "Bakoze igitekerezo",
              pct: commentFunnelPct,
              count: commentersCount,
            },
            {
              label: "Batangaje inyandiko",
              pct: publishFunnelPct,
              count: contributorsCount,
            },
          ],
        },
      ];

      return {
        period,
        kpis,
        charts,
        counts: {
          pendingRemovalRequests: pendingRemovalCount,
          openReports: openReportsCount,
        },
        settings: {
          reportThreshold: threshold,
        },
        topics,
        foundingCodes: {
          total: totalInviteCodes,
          used: usedInviteCodes,
          target: 30,
        },
      };
    }
  );

  // GET /api/v1/admin/removal-requests
  app.get(
    "/api/v1/admin/removal-requests",
    { preHandler: requireAdminOrMod },
    async (request) => {
      const query = request.query as { status?: string };
      const includeAll = query.status === "all";

      const requests = await prisma.removalRequest.findMany({
        where: includeAll ? {} : { status: RemovalRequestStatus.PENDING },
        orderBy: { requestedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          publication: {
            select: {
              id: true,
              slug: true,
              title: true,
              status: true,
            },
          },
        },
      });

      return {
        removalRequests: requests.map((r) => ({
          id: r.id,
          publicationId: r.publicationId,
          postTitle: r.publication?.title ?? r.postTitleSnapshot ?? "Inyandiko",
          postSlug: r.publication?.slug ?? null,
          postStatus: r.publication?.status ?? null,
          postAuthor: r.user?.displayName ?? r.requesterIdentifier,
          authorUsername: r.user?.username ?? null,
          reason: r.reason,
          notes: r.notes,
          status: r.status,
          resolvedAction: r.resolvedAction,
          requestedAt: r.requestedAt,
          completedAt: r.completedAt,
        })),
      };
    }
  );

  // POST /api/v1/admin/removal-requests/:id/resolve
  app.post(
    "/api/v1/admin/removal-requests/:id/resolve",
    { preHandler: requireAdminOrMod },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const parsed = resolveRemovalSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hitamo igikorwa cyemewe (emeza, siba, hagarika).",
          },
        });
      }

      const existing = await prisma.removalRequest.findUnique({
        where: { id },
        include: {
          publication: {
            select: { id: true, title: true, authorId: true },
          },
        },
      });

      if (!existing) {
        return reply.code(404).send({
          error: {
            code: "REMOVAL_REQUEST_NOT_FOUND",
            message: "Ubusabe bwo gukuraho ntibwabonetse.",
          },
        });
      }

      if (existing.status !== RemovalRequestStatus.PENDING) {
        return reply.code(409).send({
          error: {
            code: "ALREADY_RESOLVED",
            message: "Ubu busabe bwamaze gusuzumwa.",
          },
        });
      }

      const { action, notes } = parsed.data;
      const now = new Date();
      const postTitle =
        existing.publication?.title ?? existing.postTitleSnapshot ?? "Inyandiko";
      const notifyUserId = existing.publication?.authorId ?? existing.userId;

      const resolved = await prisma.$transaction(async (tx) => {
        if (action === "emeza") {
          if (existing.publicationId && existing.publication) {
            await tx.publication.update({
              where: { id: existing.publicationId },
              data: { status: PublicationStatus.UNPUBLISHED },
            });
          }

          const updatedReq = await tx.removalRequest.update({
            where: { id: existing.id },
            data: {
              status: RemovalRequestStatus.COMPLETED,
              resolvedAction: "emeza",
              completedAt: now,
              completedById: authUser.id,
            },
          });

          await tx.moderationActionLog.create({
            data: {
              actorId: authUser.id,
              targetType: "PUBLICATION",
              targetId: existing.publicationId ?? existing.id,
              actionTaken: ModerationActionType.REMOVE_CONTENT,
              ruleCited: "REMOVAL_REQUEST_UNPUBLISH",
              notes: notes ?? `Author removal request approved (unpublished): ${postTitle}`,
            },
          });

          if (notifyUserId) {
            await tx.notification.create({
              data: {
                userId: notifyUserId,
                actorId: authUser.id,
                type: NotificationType.MODERATION_ACTION,
                title: "Ubusabe bwawe bwemejwe",
                message: `Inyandiko "${postTitle}" yakuwe mu ruhame nk'uko wabisabye.`,
                entityType: "PUBLICATION",
                entityId: existing.publicationId ?? undefined,
                isRead: false,
              },
            });
          }

          return updatedReq;
        }

        if (action === "siba") {
          const targetIdSnapshot = existing.publicationId ?? existing.id;
          if (existing.publicationId && existing.publication) {
            await tx.publication.delete({
              where: { id: existing.publicationId },
            });
          }

          const updatedReq = await tx.removalRequest.update({
            where: { id: existing.id },
            data: {
              status: RemovalRequestStatus.COMPLETED,
              resolvedAction: "siba",
              completedAt: now,
              completedById: authUser.id,
            },
          });

          await tx.moderationActionLog.create({
            data: {
              actorId: authUser.id,
              targetType: "PUBLICATION",
              targetId: targetIdSnapshot,
              actionTaken: ModerationActionType.REMOVE_CONTENT,
              ruleCited: "REMOVAL_REQUEST_DELETE",
              notes: notes ?? `Author removal request approved (deleted): ${postTitle}`,
            },
          });

          if (notifyUserId) {
            await tx.notification.create({
              data: {
                userId: notifyUserId,
                actorId: authUser.id,
                type: NotificationType.MODERATION_ACTION,
                title: "Inyandiko yawe yasibwe burundu",
                message: `Inyandiko "${postTitle}" yasibwe burundu nk'uko wabisabye.`,
                entityType: "REMOVAL_REQUEST",
                entityId: existing.id,
                isRead: false,
              },
            });
          }

          return updatedReq;
        }

        // action === "hagarika" (reject request)
        const updatedReq = await tx.removalRequest.update({
          where: { id: existing.id },
          data: {
            status: RemovalRequestStatus.REJECTED,
            resolvedAction: "hagarika",
            completedAt: now,
            completedById: authUser.id,
          },
        });

        await tx.moderationActionLog.create({
          data: {
            actorId: authUser.id,
            targetType: "PUBLICATION",
            targetId: existing.publicationId ?? existing.id,
            actionTaken: ModerationActionType.DISMISS_AND_RESTORE,
            ruleCited: "REMOVAL_REQUEST_REJECTED",
            notes: notes ?? `Author removal request rejected: ${postTitle}`,
          },
        });

        if (notifyUserId) {
          await tx.notification.create({
            data: {
              userId: notifyUserId,
              actorId: authUser.id,
              type: NotificationType.MODERATION_ACTION,
              title: "Ubusabe bwo gukuraho bwahagaritswe",
              message: `Ubusabe bwawe kuri "${postTitle}" ntibwemejwe; inyandiko irakomeza kugaragara.`,
              entityType: "PUBLICATION",
              entityId: existing.publicationId ?? undefined,
              isRead: false,
            },
          });
        }

        return updatedReq;
      });

      return reply.code(200).send({ removalRequest: resolved });
    }
  );

  // GET /api/v1/admin/moderation-queue?filter=hidden|review|done
  app.get(
    "/api/v1/admin/moderation-queue",
    { preHandler: requireAdminOrMod },
    async (request) => {
      const query = request.query as { filter?: string };
      const filter =
        query.filter === "hidden" ||
        query.filter === "review" ||
        query.filter === "done"
          ? query.filter
          : "hidden";

      const reports = await prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          publication: {
            select: {
              id: true,
              slug: true,
              title: true,
              status: true,
              autoHideReason: true,
              author: {
                select: { id: true, displayName: true, accountStatus: true },
              },
            },
          },
          comment: {
            select: {
              id: true,
              body: true,
              status: true,
              publication: { select: { title: true, slug: true } },
              author: {
                select: { id: true, displayName: true, accountStatus: true },
              },
            },
          },
        },
      });

      type QueueGroup = {
        id: string;
        targetType: "PUBLICATION" | "COMMENT";
        targetId: string;
        item: string;
        authorId: string;
        authorName: string;
        authorStatus: AccountStatus;
        reportCount: number;
        reasons: Set<string>;
        hasOpen: boolean;
        isAutoHidden: boolean;
        latestAt: Date;
        primaryReason: ReportReason;
      };

      const groups = new Map<string, QueueGroup>();

      for (const r of reports) {
        if (r.publicationId && r.publication) {
          const key = `publication:${r.publicationId}`;
          const existing = groups.get(key);
          const isOpen =
            r.status === ReportStatus.OPEN || r.status === ReportStatus.REVIEWED;
          const hidden =
            r.autoHidden || r.publication.status === PublicationStatus.AUTO_HIDDEN;

          if (!existing) {
            groups.set(key, {
              id: key,
              targetType: "PUBLICATION",
              targetId: r.publicationId,
              item: r.publication.title,
              authorId: r.publication.author.id,
              authorName: r.publication.author.displayName,
              authorStatus: r.publication.author.accountStatus,
              reportCount: 1,
              reasons: new Set([REPORT_REASON_LABELS[r.reason] ?? r.reason]),
              hasOpen: isOpen,
              isAutoHidden: hidden,
              latestAt: r.createdAt,
              primaryReason: r.reason,
            });
          } else {
            existing.reportCount += 1;
            existing.reasons.add(REPORT_REASON_LABELS[r.reason] ?? r.reason);
            if (isOpen) existing.hasOpen = true;
            if (hidden) existing.isAutoHidden = true;
          }
        } else if (r.commentId && r.comment) {
          const key = `comment:${r.commentId}`;
          const existing = groups.get(key);
          const isOpen =
            r.status === ReportStatus.OPEN || r.status === ReportStatus.REVIEWED;

          if (!existing) {
            groups.set(key, {
              id: key,
              targetType: "COMMENT",
              targetId: r.commentId,
              item: `Igitekerezo kuri: ${r.comment.publication.title}`,
              authorId: r.comment.author.id,
              authorName: r.comment.author.displayName,
              authorStatus: r.comment.author.accountStatus,
              reportCount: 1,
              reasons: new Set([REPORT_REASON_LABELS[r.reason] ?? r.reason]),
              hasOpen: isOpen,
              isAutoHidden: r.autoHidden,
              latestAt: r.createdAt,
              primaryReason: r.reason,
            });
          } else {
            existing.reportCount += 1;
            existing.reasons.add(REPORT_REASON_LABELS[r.reason] ?? r.reason);
            if (isOpen) existing.hasOpen = true;
            if (r.autoHidden) existing.isAutoHidden = true;
          }
        }
      }

      const allItems = [...groups.values()].map((g) => {
        const bucket: "hidden" | "review" | "done" = !g.hasOpen
          ? "done"
          : g.isAutoHidden
            ? "hidden"
            : "review";

        const statusLabel =
          bucket === "done"
            ? "Byasuzumwe"
            : bucket === "hidden"
              ? "Byihishe ako kanya"
              : "Kugenzura bisanzwe";

        return {
          id: g.id,
          targetType: g.targetType,
          targetId: g.targetId,
          item: g.item,
          authorId: g.authorId,
          authorName: g.authorName,
          reports: g.reportCount,
          reason: [...g.reasons].join(" · "),
          ruleCited: REPORT_RULE_CODES[g.primaryReason] ?? "BR-16",
          status: statusLabel,
          statusVariant: bucket === "hidden" ? ("filled" as const) : ("outline" as const),
          hasSuspend: g.authorStatus !== AccountStatus.SUSPENDED,
          bucket,
          latestAt: g.latestAt,
        };
      });

      const counts = {
        hidden: allItems.filter((i) => i.bucket === "hidden").length,
        review: allItems.filter((i) => i.bucket === "review").length,
        done: allItems.filter((i) => i.bucket === "done").length,
      };

      const items = allItems.filter((i) => i.bucket === filter);

      return {
        filter,
        counts,
        items,
      };
    }
  );

  // POST /api/v1/admin/moderation-queue/:id/action
  app.post(
    "/api/v1/admin/moderation-queue/:id/action",
    { preHandler: requireAdminOrMod },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const parsed = moderationActionSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hitamo igikorwa cy'ubuyobozi cyemewe.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      let targetType: "PUBLICATION" | "COMMENT" | null = null;
      let targetId: string | null = null;

      if (id.startsWith("publication:")) {
        targetType = "PUBLICATION";
        targetId = id.slice("publication:".length);
      } else if (id.startsWith("comment:")) {
        targetType = "COMMENT";
        targetId = id.slice("comment:".length);
      } else {
        const report = await prisma.report.findUnique({
          where: { id },
          select: { publicationId: true, commentId: true },
        });
        if (report?.publicationId) {
          targetType = "PUBLICATION";
          targetId = report.publicationId;
        } else if (report?.commentId) {
          targetType = "COMMENT";
          targetId = report.commentId;
        }
      }

      if (!targetType || !targetId) {
        return reply.code(404).send({
          error: {
            code: "QUEUE_ITEM_NOT_FOUND",
            message: "Raporo ntiyabonetse mu rutonde rw'ibisuzumwa.",
          },
        });
      }

      let authorId: string | null = null;
      let targetLabel = "";

      if (targetType === "PUBLICATION") {
        const pub = await prisma.publication.findUnique({
          where: { id: targetId },
          select: { id: true, title: true, authorId: true },
        });
        if (!pub) {
          return reply.code(404).send({
            error: {
              code: "POST_NOT_FOUND",
              message: "Inyandiko ntiyabonetse.",
            },
          });
        }
        authorId = pub.authorId;
        targetLabel = pub.title;
      } else {
        const cmt = await prisma.comment.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            authorId: true,
            publication: { select: { title: true } },
          },
        });
        if (!cmt) {
          return reply.code(404).send({
            error: {
              code: "COMMENT_NOT_FOUND",
              message: "Igitekerezo ntikibonetse.",
            },
          });
        }
        authorId = cmt.authorId;
        targetLabel = cmt.publication.title;
      }

      const rawAction = parsed.data.action;
      const ruleCited = parsed.data.ruleCited || "BR-16";
      const notes = parsed.data.notes || null;
      const now = new Date();

      const reportWhere =
        targetType === "PUBLICATION"
          ? { publicationId: targetId }
          : { commentId: targetId };

      const actionLog = await prisma.$transaction(async (tx) => {
        let logType: ModerationActionType = ModerationActionType.DISMISS_AND_RESTORE;
        let reportOutcome: ReportStatus = ReportStatus.DISMISSED;
        let notifTitle: string | null = null;
        let notifMessage: string | null = null;

        if (rawAction === "Bireke" || rawAction === "DISMISS") {
          logType = ModerationActionType.DISMISS_AND_RESTORE;
          reportOutcome = ReportStatus.DISMISSED;
        } else if (rawAction === "Subizaho" || rawAction === "RESTORE") {
          logType = ModerationActionType.DISMISS_AND_RESTORE;
          reportOutcome = ReportStatus.DISMISSED;
          if (targetType === "PUBLICATION") {
            await tx.publication.update({
              where: { id: targetId },
              data: {
                status: PublicationStatus.PUBLISHED,
                autoHideReason: null,
              },
            });
          } else {
            await tx.comment.update({
              where: { id: targetId },
              data: { status: CommentStatus.VISIBLE },
            });
          }
          notifTitle = "Inyandiko yawe yasubijweho";
          notifMessage = `"${targetLabel}" yasuzumwe isubizwa mu ruhame.`;
        } else if (rawAction === "Kuburira" || rawAction === "WARN") {
          logType = ModerationActionType.WARN_AUTHOR;
          reportOutcome = ReportStatus.ACTIONED;
          notifTitle = "Umuburo uvuye ku buyobozi";
          notifMessage = `Wahawe umuburo ku bijyanye na "${targetLabel}" (Ingingo ${ruleCited}).`;
        } else if (rawAction === "Kuraho" || rawAction === "REMOVE") {
          logType = ModerationActionType.REMOVE_CONTENT;
          reportOutcome = ReportStatus.ACTIONED;
          if (targetType === "PUBLICATION") {
            await tx.publication.update({
              where: { id: targetId },
              data: { status: PublicationStatus.REMOVED },
            });
          } else {
            await tx.comment.update({
              where: { id: targetId },
              data: {
                status: CommentStatus.REMOVED_PLACEHOLDER,
                body: "[igitekerezo cyakuweho]",
              },
            });
          }
          notifTitle = "Inyandiko yawe yakuweho n'ubuyobozi";
          notifMessage = `"${targetLabel}" yakuweho kubera kutubahiriza amategeko (${ruleCited}).`;
        } else {
          // Hagarika konti / SUSPEND
          logType = ModerationActionType.SUSPEND_ACCOUNT;
          reportOutcome = ReportStatus.ACTIONED;
          if (authorId) {
            await tx.user.update({
              where: { id: authorId },
              data: { accountStatus: AccountStatus.SUSPENDED },
            });
          }
          if (targetType === "PUBLICATION") {
            await tx.publication.update({
              where: { id: targetId },
              data: { status: PublicationStatus.REMOVED },
            });
          } else {
            await tx.comment.update({
              where: { id: targetId },
              data: {
                status: CommentStatus.REMOVED_PLACEHOLDER,
                body: "[igitekerezo cyakuweho]",
              },
            });
          }
          notifTitle = "Konti yawe yahagaritswe by'agateganyo";
          notifMessage = `Konti yawe yahagaritswe kubera amakosa ajyanye n'ingingo ${ruleCited}.`;
        }

        await tx.report.updateMany({
          where: {
            ...reportWhere,
            status: { in: [ReportStatus.OPEN, ReportStatus.REVIEWED] },
          },
          data: {
            status: reportOutcome,
            resolutionNotes: notes ?? rawAction,
            reviewedById: authUser.id,
            reviewedAt: now,
          },
        });

        const log = await tx.moderationActionLog.create({
          data: {
            actorId: authUser.id,
            targetType,
            targetId,
            actionTaken: logType,
            ruleCited,
            notes: notes ?? rawAction,
          },
        });

        if (authorId && notifTitle && notifMessage) {
          await tx.notification.create({
            data: {
              userId: authorId,
              actorId: authUser.id,
              type: NotificationType.MODERATION_ACTION,
              title: notifTitle,
              message: notifMessage,
              entityType: targetType,
              entityId: targetId,
              isRead: false,
            },
          });
        }

        return log;
      });

      return reply.code(200).send({ ok: true, actionLog });
    }
  );

  // GET /api/v1/admin/users
  app.get(
    "/api/v1/admin/users",
    { preHandler: requireAdminOrMod },
    async () => {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          displayName: true,
          emailOrPhone: true,
          role: true,
          isModerator: true,
          isFoundingContributor: true,
          accountStatus: true,
          verifiedAt: true,
          createdAt: true,
          _count: {
            select: {
              publications: { where: { status: PublicationStatus.PUBLISHED } },
            },
          },
        },
      });

      return {
        users: users.map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          handle: `@${u.username}`,
          emailOrPhone: u.emailOrPhone,
          role:
            u.role === "ADMIN"
              ? "Umuyobozi Mukuru"
              : u.isModerator
                ? "Umusuzumi"
                : u.isFoundingContributor
                  ? "Umwanditsi Washinze"
                  : "Umwanditsi",
          rawRole: u.role,
          isModerator: u.isModerator,
          isFoundingContributor: u.isFoundingContributor,
          accountStatus: u.accountStatus,
          statusLabel:
            u.accountStatus === AccountStatus.ACTIVE
              ? "Arakora"
              : u.accountStatus === AccountStatus.SUSPENDED
                ? "Yahagaritswe"
                : u.accountStatus === AccountStatus.RESTRICTED
                  ? "Yagabanyirijwe"
                  : "Yasibwe",
          postsCount: u._count.publications,
          verifiedAt: u.verifiedAt,
          createdAt: u.createdAt,
        })),
      };
    }
  );

  // POST /api/v1/admin/topics
  app.post(
    "/api/v1/admin/topics",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const parsed = createTopicSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Andika izina ry'insanganyamatsiko ryemewe.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const nameRw = parsed.data.nameRw;
      const nameEn = parsed.data.nameEn || nameRw;
      const nameFr = parsed.data.nameFr || nameEn;
      const slug = slugifyText(parsed.data.slug || nameEn || nameRw);

      const existing = await prisma.topicCategory.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (existing) {
        return reply.code(409).send({
          error: {
            code: "TOPIC_EXISTS",
            message: "Iyo nsanganyamatsiko isanzwe ibaho.",
          },
        });
      }

      const category = await prisma.topicCategory.create({
        data: {
          slug,
          nameRw,
          nameEn,
          nameFr,
          description: parsed.data.description || null,
          isHealthOrMedicine: parsed.data.isHealthOrMedicine ?? false,
        },
      });

      return reply.code(201).send({ category });
    }
  );

  // GET /api/v1/admin/founding-codes
  app.get(
    "/api/v1/admin/founding-codes",
    { preHandler: requireAdminOrMod },
    async () => {
      const codes = await prisma.foundingInviteCode.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          usedBy: { select: { id: true, username: true, displayName: true } },
        },
      });

      const used = codes.filter((c) => c.usedById !== null).length;

      return {
        codes: codes.map((c) => ({
          id: c.id,
          code: c.code,
          usedBy: c.usedBy,
          usedAt: c.usedAt,
          createdAt: c.createdAt,
        })),
        stats: {
          total: codes.length,
          used,
          target: 30,
        },
      };
    }
  );

  // POST /api/v1/admin/founding-codes
  app.post(
    "/api/v1/admin/founding-codes",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const authUser = request.authUser!;

      let candidate = `URUNANA-${generateInviteSuffix(4)}`;
      for (let attempt = 0; attempt < 10; attempt++) {
        const exists = await prisma.foundingInviteCode.findUnique({
          where: { code: candidate },
          select: { id: true },
        });
        if (!exists) break;
        candidate = `URUNANA-${generateInviteSuffix(4)}`;
      }

      const created = await prisma.foundingInviteCode.create({
        data: {
          code: candidate,
          createdById: authUser.id,
        },
      });

      const [total, used] = await Promise.all([
        prisma.foundingInviteCode.count(),
        prisma.foundingInviteCode.count({ where: { usedById: { not: null } } }),
      ]);

      return reply.code(201).send({
        inviteCode: created,
        stats: {
          total,
          used,
          target: 30,
        },
      });
    }
  );

  // PATCH /api/v1/admin/settings/report-threshold
  app.patch(
    "/api/v1/admin/settings/report-threshold",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const parsed = thresholdSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Umubare ugomba kuba hagati ya 1 na 10.",
          },
        });
      }

      const threshold = parsed.data.threshold;
      await prisma.systemSetting.upsert({
        where: { key: "MODERATION_DISTINCT_REPORTER_THRESHOLD" },
        update: { value: String(threshold) },
        create: {
          key: "MODERATION_DISTINCT_REPORTER_THRESHOLD",
          value: String(threshold),
          description:
            "Threshold of distinct reporters required to auto-hide Tier-2 content",
        },
      });

      return reply.code(200).send({ threshold });
    }
  );
}
