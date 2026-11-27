import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  NotificationType,
  PublicationStatus,
  ReportReason,
  ReportStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../plugins/auth-guard.js";

const TIER_1_REASONS = new Set<ReportReason>([
  ReportReason.THREATS_VIOLENCE,
  ReportReason.HATE_SPEECH,
  ReportReason.PRIVACY_VIOLATION,
]);

const createReportSchema = z.object({
  publicationId: z.string().trim().min(1).optional(),
  postId: z.string().trim().min(1).optional(),
  commentId: z.string().trim().min(1).optional(),
  reason: z.nativeEnum(ReportReason),
  details: z.string().trim().max(2000).optional(),
});

async function getReportThreshold(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "MODERATION_DISTINCT_REPORTER_THRESHOLD" },
  });
  const parsed = Number.parseInt(setting?.value ?? "3", 10);
  if (Number.isNaN(parsed)) return 3;
  return Math.max(1, Math.min(10, parsed));
}

export async function reportsRoutes(app: FastifyInstance) {
  // POST /api/v1/reports
  app.post(
    "/api/v1/reports",
    {
      preHandler: requireAuth,
      config: { rateLimit: { max: 20, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      const authUser = request.authUser!;
      const parsed = createReportSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hitamo impamvu yemewe n'inyandiko cyangwa igitekerezo umenyesha.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const rawPubKey = parsed.data.publicationId ?? parsed.data.postId;
      const rawCommentId = parsed.data.commentId;

      if ((rawPubKey && rawCommentId) || (!rawPubKey && !rawCommentId)) {
        return reply.code(400).send({
          error: {
            code: "INVALID_TARGET",
            message: "Hitamo inyandiko imwe cyangwa igitekerezo kimwe gusa umenyesha.",
          },
        });
      }

      const reason = parsed.data.reason;
      const details = parsed.data.details || null;
      const isTier1 = TIER_1_REASONS.has(reason);

      if (rawPubKey) {
        const publication = await prisma.publication.findFirst({
          where: { OR: [{ id: rawPubKey }, { slug: rawPubKey }] },
          select: { id: true, title: true, authorId: true, status: true },
        });

        if (!publication) {
          return reply.code(404).send({
            error: {
              code: "POST_NOT_FOUND",
              message: "Inyandiko umenyesha ntiyabonetse.",
            },
          });
        }

        const existing = await prisma.report.findFirst({
          where: {
            reporterId: authUser.id,
            publicationId: publication.id,
          },
          select: { id: true },
        });
        if (existing) {
          return reply.code(409).send({
            error: {
              code: "DUPLICATE_REPORT",
              message: "Usanzwe waramenyesheje ikibazo kuri iyi nyandiko.",
            },
          });
        }

        const threshold = await getReportThreshold();

        const created = await prisma.report.create({
          data: {
            reporterId: authUser.id,
            publicationId: publication.id,
            reason,
            details,
            status: ReportStatus.OPEN,
            autoHidden: isTier1,
          },
        });

        const openReporters = await prisma.report.findMany({
          where: {
            publicationId: publication.id,
            status: ReportStatus.OPEN,
          },
          select: { reporterId: true },
          distinct: ["reporterId"],
        });
        const distinctReporterCount = openReporters.length;
        const shouldAutoHide = isTier1 || distinctReporterCount >= threshold;

        if (shouldAutoHide && publication.status === PublicationStatus.PUBLISHED) {
          await prisma.$transaction(async (tx) => {
            await tx.publication.update({
              where: { id: publication.id },
              data: {
                status: PublicationStatus.AUTO_HIDDEN,
                autoHideReason: isTier1
                  ? `TIER_1_${reason}`
                  : `REPORT_THRESHOLD_${threshold}`,
              },
            });
            await tx.report.updateMany({
              where: {
                publicationId: publication.id,
                status: ReportStatus.OPEN,
              },
              data: { autoHidden: true },
            });
            await tx.notification.create({
              data: {
                userId: publication.authorId,
                type: NotificationType.MODERATION_ACTION,
                title: "Inyandiko yawe yahishwe by'agateganyo",
                message: `Inyandiko "${publication.title}" yahishwe by'agateganyo mu gihe iri gusuzumwa n'ubuyobozi.`,
                entityType: "PUBLICATION",
                entityId: publication.id,
                isRead: false,
              },
            });
          });
        }

        return reply.code(201).send({
          report: {
            ...created,
            autoHidden: shouldAutoHide || created.autoHidden,
          },
          autoHidden: shouldAutoHide,
          distinctReporterCount,
          threshold,
        });
      }

      // Comment report
      const comment = await prisma.comment.findUnique({
        where: { id: rawCommentId! },
        select: { id: true, publicationId: true, authorId: true },
      });
      if (!comment) {
        return reply.code(404).send({
          error: {
            code: "COMMENT_NOT_FOUND",
            message: "Igitekerezo umenyesha ntikibonetse.",
          },
        });
      }

      const existingCommentReport = await prisma.report.findFirst({
        where: {
          reporterId: authUser.id,
          commentId: comment.id,
        },
        select: { id: true },
      });
      if (existingCommentReport) {
        return reply.code(409).send({
          error: {
            code: "DUPLICATE_REPORT",
            message: "Usanzwe waramenyesheje ikibazo kuri iki gitekerezo.",
          },
        });
      }

      const threshold = await getReportThreshold();
      const created = await prisma.report.create({
        data: {
          reporterId: authUser.id,
          commentId: comment.id,
          reason,
          details,
          status: ReportStatus.OPEN,
          autoHidden: isTier1,
        },
      });

      const openReporters = await prisma.report.findMany({
        where: {
          commentId: comment.id,
          status: ReportStatus.OPEN,
        },
        select: { reporterId: true },
        distinct: ["reporterId"],
      });
      const distinctReporterCount = openReporters.length;
      const shouldAutoHide = isTier1 || distinctReporterCount >= threshold;

      if (shouldAutoHide) {
        await prisma.report.updateMany({
          where: { commentId: comment.id, status: ReportStatus.OPEN },
          data: { autoHidden: true },
        });
      }

      return reply.code(201).send({
        report: {
          ...created,
          autoHidden: shouldAutoHide || created.autoHidden,
        },
        autoHidden: shouldAutoHide,
        distinctReporterCount,
        threshold,
      });
    }
  );
}
