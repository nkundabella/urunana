import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  CommentStatus,
  NotificationType,
  PublicationStatus,
  UserRole,
} from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, resolveAuthUser } from "../../plugins/auth-guard.js";

const DELETED_PLACEHOLDER = "[igitekerezo cyakuweho]";

const COMMENT_AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  profilePhotoUrl: true,
  isFoundingContributor: true,
  role: true,
  isModerator: true,
} as const;

type RawCommentRow = {
  id: string;
  publicationId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  isAlternativeVersion: boolean;
  status: CommentStatus;
  isEdited: boolean;
  lastEditedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    profilePhotoUrl: string | null;
    isFoundingContributor: boolean;
    role: UserRole;
    isModerator: boolean;
  };
};

function serializeCommentNode(
  row: RawCommentRow,
  postAuthorId: string,
  replies: ReturnType<typeof serializeCommentLeaf>[]
) {
  const deleted = row.status === CommentStatus.REMOVED_PLACEHOLDER;
  return {
    id: row.id,
    publicationId: row.publicationId,
    parentId: row.parentId,
    body: deleted ? DELETED_PLACEHOLDER : row.body,
    deleted,
    status: row.status,
    isAlternativeVersion: row.isAlternativeVersion,
    isEdited: row.isEdited,
    lastEditedAt: row.lastEditedAt,
    createdAt: row.createdAt,
    author: deleted
      ? null
      : {
          id: row.author.id,
          username: row.author.username,
          displayName: row.author.displayName,
          profilePhotoUrl: row.author.profilePhotoUrl,
          isFoundingContributor: row.author.isFoundingContributor,
        },
    authorId: row.authorId,
    isPostAuthor: row.authorId === postAuthorId,
    role: row.authorId === postAuthorId ? "Umwanditsi" : null,
    replies,
  };
}

function serializeCommentLeaf(row: RawCommentRow, postAuthorId: string) {
  const deleted = row.status === CommentStatus.REMOVED_PLACEHOLDER;
  return {
    id: row.id,
    publicationId: row.publicationId,
    parentId: row.parentId,
    body: deleted ? DELETED_PLACEHOLDER : row.body,
    deleted,
    status: row.status,
    isAlternativeVersion: row.isAlternativeVersion,
    isEdited: row.isEdited,
    lastEditedAt: row.lastEditedAt,
    createdAt: row.createdAt,
    author: deleted
      ? null
      : {
          id: row.author.id,
          username: row.author.username,
          displayName: row.author.displayName,
          profilePhotoUrl: row.author.profilePhotoUrl,
          isFoundingContributor: row.author.isFoundingContributor,
        },
    authorId: row.authorId,
    isPostAuthor: row.authorId === postAuthorId,
    role: row.authorId === postAuthorId ? "Umwanditsi" : null,
  };
}

const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Andika igitekerezo cyawe.")
    .max(2000, "Igitekerezo ntigomba kurenza inyuguti 2,000."),
  parentId: z.string().trim().min(1).optional().nullable(),
  isAlternativeVersion: z.boolean().optional(),
});

const editCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Igitekerezo ntigishobora kuba ubusa.")
    .max(2000, "Igitekerezo ntigomba kurenza inyuguti 2,000."),
});

export async function commentsRoutes(app: FastifyInstance) {
  // GET /api/v1/posts/:idOrSlug/comments
  app.get("/api/v1/posts/:idOrSlug/comments", async (request, reply) => {
    const viewer = await resolveAuthUser(request);
    const { idOrSlug } = request.params as { idOrSlug: string };

    const post = await prisma.publication.findFirst({
      where: { OR: [{ slug: idOrSlug }, { id: idOrSlug }] },
      select: { id: true, authorId: true, status: true },
    });

    if (!post) {
      return reply.code(404).send({
        error: {
          code: "POST_NOT_FOUND",
          message: "Iyo nyandiko ntiyabonetse.",
        },
      });
    }

    const isOwner = Boolean(viewer && viewer.id === post.authorId);
    const isAdminOrMod = Boolean(
      viewer && (viewer.role === UserRole.ADMIN || viewer.isModerator)
    );
    if (post.status !== PublicationStatus.PUBLISHED && !isOwner && !isAdminOrMod) {
      return reply.code(404).send({
        error: {
          code: "POST_NOT_FOUND",
          message: "Iyo nyandiko ntiyabonetse.",
        },
      });
    }

    const rows = await prisma.comment.findMany({
      where: { publicationId: post.id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: COMMENT_AUTHOR_SELECT } },
    });

    const repliesByParent = new Map<string, ReturnType<typeof serializeCommentLeaf>[]>();
    const topLevel: RawCommentRow[] = [];

    for (const row of rows) {
      if (row.parentId) {
        const list = repliesByParent.get(row.parentId) ?? [];
        list.push(serializeCommentLeaf(row, post.authorId));
        repliesByParent.set(row.parentId, list);
      } else {
        topLevel.push(row);
      }
    }

    const comments = topLevel.map((row) =>
      serializeCommentNode(
        row,
        post.authorId,
        repliesByParent.get(row.id) ?? []
      )
    );

    const totalCount = rows.filter(
      (r) => r.status === CommentStatus.VISIBLE
    ).length;

    return { comments, totalCount };
  });

  // POST /api/v1/posts/:idOrSlug/comments
  app.post(
    "/api/v1/posts/:idOrSlug/comments",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { idOrSlug } = request.params as { idOrSlug: string };

      const parsed = createCommentSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Igitekerezo kigomba kuba gifite inyuguti nibura 1.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const post = await prisma.publication.findFirst({
        where: { OR: [{ slug: idOrSlug }, { id: idOrSlug }] },
        select: { id: true, title: true, authorId: true, status: true },
      });

      if (!post || post.status !== PublicationStatus.PUBLISHED) {
        return reply.code(404).send({
          error: {
            code: "POST_NOT_FOUND",
            message: "Inyandiko ntiyabonetse cyangwa ntiyatangajwe.",
          },
        });
      }

      let effectiveParentId: string | null = null;
      let notifyTargetUserId: string | null = null;
      let notificationType: NotificationType = NotificationType.COMMENT;

      if (parsed.data.parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: parsed.data.parentId },
          select: { id: true, publicationId: true, parentId: true, authorId: true },
        });
        if (!parent || parent.publicationId !== post.id) {
          return reply.code(404).send({
            error: {
              code: "PARENT_COMMENT_NOT_FOUND",
              message: "Igitekerezo ushaka gusubiza ntikibonetse.",
            },
          });
        }
        effectiveParentId = parent.parentId ?? parent.id;
        notifyTargetUserId = parent.authorId;
        notificationType = NotificationType.REPLY;
      } else {
        notifyTargetUserId = post.authorId;
        notificationType = NotificationType.COMMENT;
      }

      const created = await prisma.$transaction(async (tx) => {
        const comment = await tx.comment.create({
          data: {
            publicationId: post.id,
            authorId: authUser.id,
            parentId: effectiveParentId,
            body: parsed.data.body,
            isAlternativeVersion: parsed.data.isAlternativeVersion ?? false,
            status: CommentStatus.VISIBLE,
          },
          include: { author: { select: COMMENT_AUTHOR_SELECT } },
        });

        if (notifyTargetUserId && notifyTargetUserId !== authUser.id) {
          await tx.notification.create({
            data: {
              userId: notifyTargetUserId,
              actorId: authUser.id,
              type: notificationType,
              title:
                notificationType === NotificationType.REPLY
                  ? "Yasubije igitekerezo cyawe"
                  : "Igitekerezo gishya ku nkuru yawe",
              message:
                notificationType === NotificationType.REPLY
                  ? `${authUser.displayName} yasubije igitekerezo cyawe kuri "${post.title}".`
                  : `${authUser.displayName} yatanze igitekerezo kuri "${post.title}".`,
              entityType: "PUBLICATION",
              entityId: post.id,
              isRead: false,
            },
          });
        }

        return comment;
      });

      return reply.code(201).send({
        comment: effectiveParentId
          ? serializeCommentLeaf(created, post.authorId)
          : serializeCommentNode(created, post.authorId, []),
      });
    }
  );

  // PATCH /api/v1/comments/:id
  app.patch(
    "/api/v1/comments/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const parsed = editCommentSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Igitekerezo kigomba kuba gifite inyuguti nibura 1.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const existing = await prisma.comment.findUnique({
        where: { id },
        include: {
          publication: { select: { authorId: true } },
        },
      });

      if (!existing) {
        return reply.code(404).send({
          error: {
            code: "COMMENT_NOT_FOUND",
            message: "Igitekerezo ntikibonetse.",
          },
        });
      }

      if (existing.authorId !== authUser.id) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN",
            message: "Uwanditse iki gitekerezo ni we gusa ushobora kugihindura.",
          },
        });
      }

      if (existing.status !== CommentStatus.VISIBLE) {
        return reply.code(400).send({
          error: {
            code: "COMMENT_REMOVED",
            message: "Igitekerezo cyakuweho ntigishobora guhindurwa.",
          },
        });
      }

      const updated = await prisma.comment.update({
        where: { id: existing.id },
        data: {
          body: parsed.data.body,
          isEdited: true,
          lastEditedAt: new Date(),
        },
        include: { author: { select: COMMENT_AUTHOR_SELECT } },
      });

      return reply.code(200).send({
        comment: serializeCommentLeaf(updated, existing.publication.authorId),
      });
    }
  );

  // DELETE /api/v1/comments/:id (soft-delete placeholder preserving nested replies)
  app.delete(
    "/api/v1/comments/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const existing = await prisma.comment.findUnique({
        where: { id },
        include: {
          publication: { select: { authorId: true } },
        },
      });

      if (!existing) {
        return reply.code(404).send({
          error: {
            code: "COMMENT_NOT_FOUND",
            message: "Igitekerezo ntikibonetse.",
          },
        });
      }

      const canRemove =
        existing.authorId === authUser.id ||
        existing.publication.authorId === authUser.id ||
        authUser.role === UserRole.ADMIN ||
        authUser.isModerator;

      if (!canRemove) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN",
            message: "Nta burenganzira ufite bwo gusiba iki gitekerezo.",
          },
        });
      }

      const updated = await prisma.comment.update({
        where: { id: existing.id },
        data: {
          status: CommentStatus.REMOVED_PLACEHOLDER,
          body: DELETED_PLACEHOLDER,
        },
        include: { author: { select: COMMENT_AUTHOR_SELECT } },
      });

      return reply.code(200).send({
        comment: serializeCommentLeaf(updated, existing.publication.authorId),
      });
    }
  );
}
