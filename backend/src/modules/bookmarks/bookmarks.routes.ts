import type { FastifyInstance } from "fastify";
import { PublicationStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../plugins/auth-guard.js";
import { POST_INCLUDE, serializePost } from "../posts/post.presenter.js";

export async function bookmarksRoutes(app: FastifyInstance) {
  // GET /api/v1/bookmarks -> { savedPosts, followingPosts, drafts }
  app.get(
    "/api/v1/bookmarks",
    { preHandler: requireAuth },
    async (request) => {
      const authUser = request.authUser!;

      const [bookmarks, follows, drafts] = await Promise.all([
        prisma.bookmark.findMany({
          where: {
            userId: authUser.id,
            publication: { status: PublicationStatus.PUBLISHED },
          },
          orderBy: { createdAt: "desc" },
          include: {
            publication: {
              include: POST_INCLUDE,
            },
          },
        }),
        prisma.follow.findMany({
          where: { followerId: authUser.id },
          select: { followingId: true },
        }),
        prisma.publication.findMany({
          where: {
            authorId: authUser.id,
            status: PublicationStatus.DRAFT,
          },
          orderBy: { updatedAt: "desc" },
          include: POST_INCLUDE,
        }),
      ]);

      const followingAuthorIds = new Set(follows.map((f) => f.followingId));
      const savedIds = new Set(bookmarks.map((b) => b.publicationId));

      const followingPostsRaw =
        followingAuthorIds.size > 0
          ? await prisma.publication.findMany({
              where: {
                authorId: { in: [...followingAuthorIds] },
                status: PublicationStatus.PUBLISHED,
              },
              orderBy: { publishedAt: "desc" },
              include: POST_INCLUDE,
            })
          : [];

      return {
        savedPosts: bookmarks.map((b) =>
          serializePost(b.publication, {
            savedIds,
            followingAuthorIds,
            viewerId: authUser.id,
          })
        ),
        followingPosts: followingPostsRaw.map((post) =>
          serializePost(post, {
            savedIds,
            followingAuthorIds,
            viewerId: authUser.id,
          })
        ),
        drafts: drafts.map((post) =>
          serializePost(post, {
            savedIds,
            followingAuthorIds,
            viewerId: authUser.id,
          })
        ),
      };
    }
  );

  // POST /api/v1/posts/:id/bookmark (toggle)
  app.post(
    "/api/v1/posts/:id/bookmark",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const post = await prisma.publication.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        select: { id: true, status: true },
      });

      if (!post || post.status !== PublicationStatus.PUBLISHED) {
        return reply.code(404).send({
          error: {
            code: "POST_NOT_FOUND",
            message: "Inyandiko ntiyabonetse.",
          },
        });
      }

      const existing = await prisma.bookmark.findUnique({
        where: {
          userId_publicationId: {
            userId: authUser.id,
            publicationId: post.id,
          },
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.bookmark.delete({ where: { id: existing.id } });
        return reply.code(200).send({ saved: false, publicationId: post.id });
      }

      await prisma.bookmark.create({
        data: {
          userId: authUser.id,
          publicationId: post.id,
        },
      });
      return reply.code(200).send({ saved: true, publicationId: post.id });
    }
  );
}
