import type { FastifyInstance } from "fastify";
import { NotificationType } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../plugins/auth-guard.js";

function notificationTone(type: NotificationType): "orange" | "navy" | "red" | "maroon" {
  switch (type) {
    case NotificationType.COMMENT:
    case NotificationType.REPLY:
      return "orange";
    case NotificationType.FOLLOW:
    case NotificationType.NEW_PUBLICATION:
      return "navy";
    case NotificationType.MODERATION_ACTION:
      return "red";
    case NotificationType.SYSTEM:
    default:
      return "maroon";
  }
}

export async function notificationsRoutes(app: FastifyInstance) {
  // GET /api/v1/notifications
  app.get(
    "/api/v1/notifications",
    { preHandler: requireAuth },
    async (request) => {
      const authUser = request.authUser!;

      const [rows, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: authUser.id },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            actor: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePhotoUrl: true,
              },
            },
          },
        }),
        prisma.notification.count({
          where: { userId: authUser.id, isRead: false },
        }),
      ]);

      return {
        notifications: rows.map((n) => ({
          id: n.id,
          type: n.type,
          tone: notificationTone(n.type),
          title: n.title,
          message: n.message,
          entityType: n.entityType,
          entityId: n.entityId,
          isRead: n.isRead,
          createdAt: n.createdAt,
          actor: n.actor,
        })),
        unreadCount,
      };
    }
  );

  // PATCH /api/v1/notifications/read-all
  app.patch(
    "/api/v1/notifications/read-all",
    { preHandler: requireAuth },
    async (request) => {
      const authUser = request.authUser!;
      const result = await prisma.notification.updateMany({
        where: { userId: authUser.id, isRead: false },
        data: { isRead: true },
      });

      return {
        ok: true,
        updatedCount: result.count,
        unreadCount: 0,
      };
    }
  );

  // PATCH /api/v1/notifications/:id/read
  app.patch(
    "/api/v1/notifications/:id/read",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const existing = await prisma.notification.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.code(404).send({
          error: {
            code: "NOTIFICATION_NOT_FOUND",
            message: "Imenyesha ntiryabonetse.",
          },
        });
      }

      if (existing.userId !== authUser.id) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN",
            message: "Nta burenganzira ufite kuri iri menyesha.",
          },
        });
      }

      const updated = await prisma.notification.update({
        where: { id: existing.id },
        data: { isRead: true },
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: authUser.id, isRead: false },
      });

      return reply.code(200).send({
        notification: {
          id: updated.id,
          type: updated.type,
          tone: notificationTone(updated.type),
          title: updated.title,
          message: updated.message,
          entityType: updated.entityType,
          entityId: updated.entityId,
          isRead: updated.isRead,
          createdAt: updated.createdAt,
        },
        unreadCount,
      });
    }
  );
}
