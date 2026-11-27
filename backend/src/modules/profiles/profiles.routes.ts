import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  AccountStatus,
  NotificationType,
  PublicationStatus,
} from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import {
  requireAuth,
  resolveAuthUser,
  SAFE_USER_SELECT,
} from "../../plugins/auth-guard.js";
import { POST_INCLUDE, serializePost } from "../posts/post.presenter.js";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const PUBLIC_PROFILE_SELECT = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  role: true,
  isModerator: true,
  preferredLanguage: true,
  isFoundingContributor: true,
  foundingJoinDate: true,
  accountStatus: true,
  profilePhotoUrl: true,
  areasOfInterest: true,
  createdAt: true,
} as const;

async function findPublicUser(usernameOrId: string) {
  const trimmed = usernameOrId.trim();
  if (!trimmed) return null;

  const underscored = trimmed.replace(/-/g, "_");
  const exact = await prisma.user.findFirst({
    where: {
      accountStatus: { not: AccountStatus.GHOST },
      OR: [
        { id: trimmed },
        { username: { equals: trimmed, mode: "insensitive" } },
        ...(underscored !== trimmed
          ? [{ username: { equals: underscored, mode: "insensitive" as const } }]
          : []),
      ],
    },
    select: PUBLIC_PROFILE_SELECT,
  });

  if (exact) return exact;

  // Friendly fallback for legacy display-name slugs like "kalisa-mugisha"
  const spaced = trimmed.replace(/[-_]+/g, " ");
  if (spaced !== trimmed) {
    return prisma.user.findFirst({
      where: {
        accountStatus: { not: AccountStatus.GHOST },
        displayName: { equals: spaced, mode: "insensitive" },
      },
      select: PUBLIC_PROFILE_SELECT,
    });
  }

  return null;
}

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Izina rigomba kuba rifite nibura inyuguti 2.")
    .max(80, "Izina ntigomba kurenza inyuguti 80.")
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, "Incamake ntigomba kurenza inyuguti 500.")
    .nullable()
    .optional(),
  areasOfInterest: z
    .array(z.string().trim().min(1).max(60))
    .max(12)
    .optional(),
  preferredLanguage: z.enum(["rw", "en", "fr"]).optional(),
  profilePhotoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (val) =>
        val.startsWith("/") ||
        val.startsWith("http://") ||
        val.startsWith("https://"),
      "Ifoto igomba kuba ihuzo ryemewe."
    )
    .nullable()
    .optional(),
});

export async function profilesRoutes(app: FastifyInstance) {
  // PATCH /api/v1/users/me
  app.patch(
    "/api/v1/users/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const parsed = updateProfileSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hari amakuru atuzuye neza.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const data = parsed.data;
      const updated = await prisma.user.update({
        where: { id: authUser.id },
        data: {
          ...(data.displayName !== undefined
            ? { displayName: data.displayName }
            : {}),
          ...(data.bio !== undefined ? { bio: data.bio || null } : {}),
          ...(data.areasOfInterest !== undefined
            ? { areasOfInterest: data.areasOfInterest }
            : {}),
          ...(data.preferredLanguage !== undefined
            ? { preferredLanguage: data.preferredLanguage }
            : {}),
          ...(data.profilePhotoUrl !== undefined
            ? { profilePhotoUrl: data.profilePhotoUrl }
            : {}),
        },
        select: SAFE_USER_SELECT,
      });

      const token = await createSessionToken({
        userId: updated.id,
        username: updated.username,
        displayName: updated.displayName,
        role: updated.role,
        isModerator: updated.isModerator,
        isFoundingContributor: updated.isFoundingContributor,
        accountStatus: updated.accountStatus,
        preferredLanguage: updated.preferredLanguage,
      });

      reply.setCookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
        secure: env.NODE_ENV === "production",
      });

      return reply.code(200).send({ user: updated });
    }
  );

  // GET /api/v1/users/:usernameOrId
  app.get("/api/v1/users/:usernameOrId", async (request, reply) => {
    const viewer = await resolveAuthUser(request);
    const { usernameOrId } = request.params as { usernameOrId: string };

    const target = await findPublicUser(usernameOrId);
    if (!target) {
      return reply.code(404).send({
        error: {
          code: "USER_NOT_FOUND",
          message: "Umwanditsi ntiyabonetse.",
        },
      });
    }

    const isOwner = Boolean(viewer && viewer.id === target.id);

    const [followersCount, followingCount, posts, followRecord, ownerBookmarks] =
      await Promise.all([
        prisma.follow.count({ where: { followingId: target.id } }),
        prisma.follow.count({ where: { followerId: target.id } }),
        prisma.publication.findMany({
          where: {
            authorId: target.id,
            status: PublicationStatus.PUBLISHED,
          },
          orderBy: { publishedAt: "desc" },
          include: POST_INCLUDE,
        }),
        viewer && !isOwner
          ? prisma.follow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: viewer.id,
                  followingId: target.id,
                },
              },
              select: { id: true },
            })
          : null,
        isOwner
          ? prisma.bookmark.findMany({
              where: {
                userId: target.id,
                publication: { status: PublicationStatus.PUBLISHED },
              },
              orderBy: { createdAt: "desc" },
              include: {
                publication: { include: POST_INCLUDE },
              },
            })
          : [],
      ]);

    let viewerSavedIds = new Set<string>();
    if (viewer && posts.length > 0) {
      const bm = await prisma.bookmark.findMany({
        where: {
          userId: viewer.id,
          publicationId: { in: posts.map((p) => p.id) },
        },
        select: { publicationId: true },
      });
      viewerSavedIds = new Set(bm.map((b) => b.publicationId));
    }

    const followingAuthorIds = followRecord ? new Set([target.id]) : new Set<string>();

    return {
      user: {
        ...target,
        badge: target.isFoundingContributor
          ? "Umwanditsi Washinze (Founding Contributor)"
          : "Umwanditsi wa Urunana",
      },
      isOwner,
      isFollowing: Boolean(followRecord),
      stats: {
        postsCount: posts.length,
        followersCount,
        followingCount,
      },
      posts: posts.map((post) =>
        serializePost(post, {
          savedIds: viewerSavedIds,
          followingAuthorIds,
          viewerId: viewer?.id,
        })
      ),
      savedPosts: isOwner
        ? ownerBookmarks.map((b) =>
            serializePost(b.publication, {
              savedIds: new Set(ownerBookmarks.map((x) => x.publicationId)),
              viewerId: viewer?.id,
            })
          )
        : [],
    };
  });

  // GET /api/v1/users/:usernameOrId/followers
  app.get("/api/v1/users/:usernameOrId/followers", async (request, reply) => {
    const viewer = await resolveAuthUser(request);
    const { usernameOrId } = request.params as { usernameOrId: string };

    const target = await findPublicUser(usernameOrId);
    if (!target) {
      return reply.code(404).send({
        error: {
          code: "USER_NOT_FOUND",
          message: "Umwanditsi ntiyabonetse.",
        },
      });
    }

    const follows = await prisma.follow.findMany({
      where: {
        followingId: target.id,
        follower: { accountStatus: { not: AccountStatus.GHOST } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            profilePhotoUrl: true,
            isFoundingContributor: true,
            _count: {
              select: {
                publications: { where: { status: PublicationStatus.PUBLISHED } },
              },
            },
          },
        },
      },
    });

    const personIds = follows.map((f) => f.follower.id);
    const viewerFollows =
      viewer && personIds.length > 0
        ? new Set(
            (
              await prisma.follow.findMany({
                where: {
                  followerId: viewer.id,
                  followingId: { in: personIds },
                },
                select: { followingId: true },
              })
            ).map((f) => f.followingId)
          )
        : new Set<string>();

    return {
      user: {
        id: target.id,
        username: target.username,
        displayName: target.displayName,
      },
      people: follows.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        displayName: f.follower.displayName,
        bio: f.follower.bio,
        profilePhotoUrl: f.follower.profilePhotoUrl,
        isFoundingContributor: f.follower.isFoundingContributor,
        storiesCount: f.follower._count.publications,
        isFollowing: viewerFollows.has(f.follower.id),
      })),
    };
  });

  // GET /api/v1/users/:usernameOrId/following
  app.get("/api/v1/users/:usernameOrId/following", async (request, reply) => {
    const viewer = await resolveAuthUser(request);
    const { usernameOrId } = request.params as { usernameOrId: string };

    const target = await findPublicUser(usernameOrId);
    if (!target) {
      return reply.code(404).send({
        error: {
          code: "USER_NOT_FOUND",
          message: "Umwanditsi ntiyabonetse.",
        },
      });
    }

    const follows = await prisma.follow.findMany({
      where: {
        followerId: target.id,
        following: { accountStatus: { not: AccountStatus.GHOST } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            profilePhotoUrl: true,
            isFoundingContributor: true,
            _count: {
              select: {
                publications: { where: { status: PublicationStatus.PUBLISHED } },
              },
            },
          },
        },
      },
    });

    const personIds = follows.map((f) => f.following.id);
    const viewerFollows =
      viewer && personIds.length > 0
        ? new Set(
            (
              await prisma.follow.findMany({
                where: {
                  followerId: viewer.id,
                  followingId: { in: personIds },
                },
                select: { followingId: true },
              })
            ).map((f) => f.followingId)
          )
        : new Set<string>();

    return {
      user: {
        id: target.id,
        username: target.username,
        displayName: target.displayName,
      },
      people: follows.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        displayName: f.following.displayName,
        bio: f.following.bio,
        profilePhotoUrl: f.following.profilePhotoUrl,
        isFoundingContributor: f.following.isFoundingContributor,
        storiesCount: f.following._count.publications,
        isFollowing: viewerFollows.has(f.following.id),
      })),
    };
  });

  // POST /api/v1/users/:id/follow (toggle)
  app.post(
    "/api/v1/users/:id/follow",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const target = await findPublicUser(id);
      if (!target) {
        return reply.code(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "Umwanditsi ntiyabonetse.",
          },
        });
      }

      if (target.id === authUser.id) {
        return reply.code(400).send({
          error: {
            code: "CANNOT_FOLLOW_SELF",
            message: "Ntushobora kwikurikira wowe ubwawe.",
          },
        });
      }

      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: authUser.id,
            followingId: target.id,
          },
        },
        select: { id: true },
      });

      let following: boolean;
      if (existing) {
        await prisma.follow.delete({ where: { id: existing.id } });
        following = false;
      } else {
        await prisma.$transaction(async (tx) => {
          await tx.follow.create({
            data: {
              followerId: authUser.id,
              followingId: target.id,
            },
          });
          await tx.notification.create({
            data: {
              userId: target.id,
              actorId: authUser.id,
              type: NotificationType.FOLLOW,
              title: "Umuntu mushya agukurikira",
              message: `${authUser.displayName} yatangiye kugukurikira.`,
              entityType: "USER",
              entityId: authUser.id,
              isRead: false,
            },
          });
        });
        following = true;
      }

      const followersCount = await prisma.follow.count({
        where: { followingId: target.id },
      });

      return reply.code(200).send({
        following,
        targetUserId: target.id,
        followersCount,
      });
    }
  );
}
