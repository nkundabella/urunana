import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  ContentLanguage,
  ContentType,
  KnowledgeSourceType,
  PostRemovalReason,
  PublicationStatus,
  RemovalRequestStatus,
  UserRole,
  type Prisma,
} from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, resolveAuthUser } from "../../plugins/auth-guard.js";
import {
  computeGraceWindow,
  generateUniquePostSlug,
  normalizeContentLanguageInput,
  normalizeContentTypeInput,
  normalizeKnowledgeSourceInput,
  POST_INCLUDE,
  resolveTopicSlugOrKey,
  serializePost,
} from "./post.presenter.js";

function splitMultiParam(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .flatMap((v) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function mapTypeFilterToEnums(values: string[]): ContentType[] {
  const result = new Set<ContentType>();
  for (const raw of values) {
    if (Object.values(ContentType).includes(raw as ContentType)) {
      result.add(raw as ContentType);
      continue;
    }
    const lower = raw.toLowerCase();
    if (lower === "inkuru" || lower.includes("story")) {
      result.add(ContentType.STORY);
      result.add(ContentType.ORAL_TRADITION);
      result.add(ContentType.PERSONAL_EXPERIENCE);
    } else if (lower === "article") {
      result.add(ContentType.ARTICLE);
      result.add(ContentType.LANGUAGE_EXPLANATION);
      result.add(ContentType.RESEARCH_PIECE);
      result.add(ContentType.OPINION_INTERPRETATION);
    } else {
      result.add(normalizeContentTypeInput(raw));
    }
  }
  return [...result];
}

function mapSourceFilterToEnums(values: string[]): KnowledgeSourceType[] {
  const result = new Set<KnowledgeSourceType>();
  for (const raw of values) {
    if (Object.values(KnowledgeSourceType).includes(raw as KnowledgeSourceType)) {
      result.add(raw as KnowledgeSourceType);
      continue;
    }
    const lower = raw.toLowerCase();
    if (lower.includes("personal")) {
      result.add(KnowledgeSourceType.PERSONAL_EXPERIENCE);
    } else if (lower.includes("oral") || lower.includes("family")) {
      result.add(KnowledgeSourceType.FAMILY_ORAL_TRADITION);
      result.add(KnowledgeSourceType.COMMUNITY_PRACTICE);
    } else if (lower.includes("research") || lower.includes("documented")) {
      result.add(KnowledgeSourceType.RESEARCH_BASED);
      result.add(KnowledgeSourceType.DOCUMENTED_HISTORY);
    } else if (lower.includes("interpretation") || lower.includes("opinion")) {
      result.add(KnowledgeSourceType.INTERPRETATION_OPINION);
    } else {
      const mapped = normalizeKnowledgeSourceInput(raw);
      if (mapped) result.add(mapped);
    }
  }
  return [...result];
}

function mapLanguageFilterToEnums(values: string[]): ContentLanguage[] {
  const result = new Set<ContentLanguage>();
  for (const raw of values) {
    if (Object.values(ContentLanguage).includes(raw as ContentLanguage)) {
      result.add(raw as ContentLanguage);
      continue;
    }
    const lower = raw.toLowerCase();
    if (lower === "rw" || lower.includes("kinyarwanda")) {
      result.add(ContentLanguage.KINYARWANDA);
    } else if (lower === "en" || lower.includes("english")) {
      result.add(ContentLanguage.ENGLISH);
      result.add(ContentLanguage.MIXED);
    } else if (lower === "fr" || lower.includes("fran")) {
      result.add(ContentLanguage.FRENCH);
    } else if (lower.includes("mixed")) {
      result.add(ContentLanguage.MIXED);
    }
  }
  return [...result];
}

async function resolveCategoryIds(inputs: string[]): Promise<string[]> {
  if (inputs.length === 0) return [];
  const normalized = inputs.map((item) => resolveTopicSlugOrKey(item));
  const lowerSet = new Set([
    ...inputs.map((s) => s.trim().toLowerCase()),
    ...normalized.map((s) => s.toLowerCase()),
  ]);

  const categories = await prisma.topicCategory.findMany({
    where: { isArchived: false },
    select: { id: true, slug: true, nameRw: true, nameEn: true, nameFr: true },
  });

  const matchedIds = new Set<string>();
  for (const cat of categories) {
    if (
      lowerSet.has(cat.id.toLowerCase()) ||
      lowerSet.has(cat.slug.toLowerCase()) ||
      lowerSet.has(cat.nameRw.toLowerCase()) ||
      lowerSet.has(cat.nameEn.toLowerCase()) ||
      lowerSet.has(cat.nameFr.toLowerCase())
    ) {
      matchedIds.add(cat.id);
    }
  }

  return [...matchedIds];
}

const draftBodySchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().max(150).optional(),
  body: z.string().max(20000).optional(),
  summary: z.string().max(400).optional().nullable(),
  contentType: z.string().optional(),
  knowledgeSources: z.array(z.string()).optional(),
  contentLanguage: z.string().optional(),
  sourceCitation: z.string().max(600).optional().nullable(),
  hostingLicenseGranted: z.boolean().optional(),
  researchUseConsent: z.boolean().optional(),
  images: z.array(z.string().max(500)).max(5).optional(),
  relatedVersionsNote: z.string().max(600).optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});

const publishOverrideSchema = z
  .object({
    title: z.string().max(150).optional(),
    body: z.string().max(20000).optional(),
    summary: z.string().max(400).optional().nullable(),
    contentType: z.string().optional(),
    knowledgeSources: z.array(z.string()).optional(),
    contentLanguage: z.string().optional(),
    sourceCitation: z.string().max(600).optional().nullable(),
    hostingLicenseGranted: z.boolean().optional(),
    researchUseConsent: z.boolean().optional(),
    images: z.array(z.string().max(500)).max(5).optional(),
    relatedVersionsNote: z.string().max(600).optional().nullable(),
    categoryIds: z.array(z.string()).optional(),
    topics: z.array(z.string()).optional(),
  })
  .optional();

const updatePostSchema = z.object({
  title: z.string().max(150).optional(),
  body: z.string().max(20000).optional(),
  summary: z.string().max(400).optional().nullable(),
  contentType: z.string().optional(),
  knowledgeSources: z.array(z.string()).optional(),
  contentLanguage: z.string().optional(),
  sourceCitation: z.string().max(600).optional().nullable(),
  researchUseConsent: z.boolean().optional(),
  images: z.array(z.string().max(500)).max(5).optional(),
  relatedVersionsNote: z.string().max(600).optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
});

const removalRequestSchema = z.object({
  reason: z.enum(["IKOSA", "AMAKURU_BWITE", "IKINDI"]),
  note: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function postsRoutes(app: FastifyInstance) {
  // GET /api/v1/posts
  app.get("/api/v1/posts", async (request) => {
    const viewer = await resolveAuthUser(request);
    const query = request.query as Record<string, unknown>;

    const q = typeof query.q === "string" ? query.q.trim() : "";
    const topicInputs = [
      ...splitMultiParam(query.topic),
      ...splitMultiParam(query.category),
    ];
    const typeInputs = splitMultiParam(query.type);
    const sourceInputs = splitMultiParam(query.source);
    const languageInputs = splitMultiParam(query.language);
    const authorFilter =
      typeof query.author === "string" ? query.author.trim() : "";
    const sort = typeof query.sort === "string" ? query.sort.trim() : "recent";
    const cursor =
      typeof query.cursor === "string" && query.cursor.trim().length > 0
        ? query.cursor.trim()
        : undefined;

    const rawLimit = Number.parseInt(String(query.limit ?? "20"), 10);
    const limit = Number.isNaN(rawLimit)
      ? 20
      : Math.max(1, Math.min(50, rawLimit));
    const rawPage = Number.parseInt(String(query.page ?? "1"), 10);
    const page = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);

    const andConditions: Prisma.PublicationWhereInput[] = [
      { status: PublicationStatus.PUBLISHED },
    ];

    if (q) {
      andConditions.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
          { author: { displayName: { contains: q, mode: "insensitive" } } },
          {
            categories: {
              some: {
                category: {
                  OR: [
                    { nameRw: { contains: q, mode: "insensitive" } },
                    { nameEn: { contains: q, mode: "insensitive" } },
                    { nameFr: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
        ],
      });
    }

    if (topicInputs.length > 0) {
      const normalizedSlugs = topicInputs.map((t) => resolveTopicSlugOrKey(t));
      andConditions.push({
        categories: {
          some: {
            category: {
              OR: [
                { slug: { in: normalizedSlugs, mode: "insensitive" } },
                { id: { in: topicInputs } },
                { nameRw: { in: topicInputs, mode: "insensitive" } },
                { nameEn: { in: topicInputs, mode: "insensitive" } },
              ],
            },
          },
        },
      });
    }

    if (typeInputs.length > 0) {
      const mappedTypes = mapTypeFilterToEnums(typeInputs);
      if (mappedTypes.length > 0) {
        andConditions.push({ contentType: { in: mappedTypes } });
      }
    }

    if (sourceInputs.length > 0) {
      const mappedSources = mapSourceFilterToEnums(sourceInputs);
      if (mappedSources.length > 0) {
        andConditions.push({ knowledgeSources: { hasSome: mappedSources } });
      }
    }

    if (languageInputs.length > 0) {
      const mappedLangs = mapLanguageFilterToEnums(languageInputs);
      if (mappedLangs.length > 0) {
        andConditions.push({ contentLanguage: { in: mappedLangs } });
      }
    }

    if (authorFilter) {
      andConditions.push({
        OR: [
          { authorId: authorFilter },
          { author: { username: { equals: authorFilter, mode: "insensitive" } } },
        ],
      });
    }

    const where: Prisma.PublicationWhereInput = { AND: andConditions };

    const orderBy: Prisma.PublicationOrderByWithRelationInput[] =
      sort === "oldest"
        ? [{ publishedAt: "asc" }, { createdAt: "asc" }]
        : sort === "discussed"
          ? [{ comments: { _count: "desc" } }, { publishedAt: "desc" }]
          : [{ publishedAt: "desc" }, { createdAt: "desc" }];

    const [total, rawPosts] = await Promise.all([
      prisma.publication.count({ where }),
      prisma.publication.findMany({
        where,
        include: POST_INCLUDE,
        orderBy,
        take: cursor ? limit + 1 : limit,
        ...(cursor
          ? { cursor: { id: cursor }, skip: 1 }
          : { skip: (page - 1) * limit }),
      }),
    ]);

    let nextCursor: string | null = null;
    const posts = cursor && rawPosts.length > limit ? rawPosts.slice(0, limit) : rawPosts;
    if (cursor && rawPosts.length > limit) {
      nextCursor = posts[posts.length - 1]?.id ?? null;
    } else if (!cursor && page * limit < total) {
      nextCursor = posts[posts.length - 1]?.id ?? null;
    }

    let savedIds = new Set<string>();
    let followingAuthorIds = new Set<string>();
    if (viewer && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const authorIds = [...new Set(posts.map((p) => p.authorId))];
      const [bookmarks, follows] = await Promise.all([
        prisma.bookmark.findMany({
          where: { userId: viewer.id, publicationId: { in: postIds } },
          select: { publicationId: true },
        }),
        prisma.follow.findMany({
          where: { followerId: viewer.id, followingId: { in: authorIds } },
          select: { followingId: true },
        }),
      ]);
      savedIds = new Set(bookmarks.map((b) => b.publicationId));
      followingAuthorIds = new Set(follows.map((f) => f.followingId));
    }

    return {
      posts: posts.map((post) =>
        serializePost(post, {
          savedIds,
          followingAuthorIds,
          viewerId: viewer?.id,
        })
      ),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      nextCursor,
    };
  });

  // GET /api/v1/posts/:idOrSlug
  app.get("/api/v1/posts/:idOrSlug", async (request, reply) => {
    const viewer = await resolveAuthUser(request);
    const { idOrSlug } = request.params as { idOrSlug: string };

    const post = await prisma.publication.findFirst({
      where: {
        OR: [{ slug: idOrSlug }, { id: idOrSlug }],
      },
      include: POST_INCLUDE,
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

    const [bookmark, follow, pendingRemoval] = await Promise.all([
      viewer
        ? prisma.bookmark.findUnique({
            where: {
              userId_publicationId: {
                userId: viewer.id,
                publicationId: post.id,
              },
            },
            select: { id: true },
          })
        : null,
      viewer && viewer.id !== post.authorId
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewer.id,
                followingId: post.authorId,
              },
            },
            select: { id: true },
          })
        : null,
      isOwner || isAdminOrMod
        ? prisma.removalRequest.findFirst({
            where: {
              publicationId: post.id,
              status: RemovalRequestStatus.PENDING,
            },
            select: { id: true },
          })
        : null,
    ]);

    return {
      post: serializePost(post, {
        includeBody: true,
        savedIds: bookmark ? new Set([post.id]) : new Set(),
        followingAuthorIds: follow ? new Set([post.authorId]) : new Set(),
        pendingRemovalPostIds: pendingRemoval ? new Set([post.id]) : new Set(),
        viewerId: viewer?.id,
      }),
    };
  });

  // POST /api/v1/posts/drafts
  app.post(
    "/api/v1/posts/drafts",
    { preHandler: requireAuth },
    async (request, reply) => {
      const parsed = draftBodySchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hari amakuru atuzuye neza.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const authUser = request.authUser!;
      const data = parsed.data;
      const rawTitle = (data.title ?? "").trim();
      const rawBody = data.body ?? "";
      const safeTitle = rawTitle || "Inyandiko itaratangazwa";

      const mappedSources = (data.knowledgeSources ?? [])
        .map((s) => normalizeKnowledgeSourceInput(s))
        .filter((s): s is KnowledgeSourceType => s !== null);

      const topicInputList = [...(data.categoryIds ?? []), ...(data.topics ?? [])];
      const resolvedCategoryIds =
        topicInputList.length > 0 ? await resolveCategoryIds(topicInputList) : [];

      if (data.id) {
        const existing = await prisma.publication.findFirst({
          where: { OR: [{ id: data.id }, { slug: data.id }] },
          select: { id: true, authorId: true, status: true },
        });
        if (!existing) {
          return reply.code(404).send({
            error: {
              code: "DRAFT_NOT_FOUND",
              message: "Inyandiko itaratangazwa ntiyabonetse.",
            },
          });
        }
        if (existing.authorId !== authUser.id) {
          return reply.code(403).send({
            error: {
              code: "FORBIDDEN",
              message: "Nta burenganzira ufite bwo guhindura iyi nyandiko.",
            },
          });
        }
        if (existing.status !== PublicationStatus.DRAFT) {
          return reply.code(400).send({
            error: {
              code: "NOT_A_DRAFT",
              message: "Iyi nyandiko yamaze gutangazwa; koresha guhindura inyandiko.",
            },
          });
        }

        const updated = await prisma.$transaction(async (tx) => {
          if (data.categoryIds !== undefined || data.topics !== undefined) {
            await tx.publicationTopic.deleteMany({
              where: { publicationId: existing.id },
            });
            if (resolvedCategoryIds.length > 0) {
              await tx.publicationTopic.createMany({
                data: resolvedCategoryIds.map((categoryId) => ({
                  publicationId: existing.id,
                  categoryId,
                })),
              });
            }
          }

          return tx.publication.update({
            where: { id: existing.id },
            data: {
              ...(data.title !== undefined ? { title: safeTitle } : {}),
              ...(data.body !== undefined ? { body: rawBody } : {}),
              ...(data.summary !== undefined
                ? { summary: data.summary?.trim() || null }
                : {}),
              ...(data.contentType !== undefined
                ? { contentType: normalizeContentTypeInput(data.contentType) }
                : {}),
              ...(data.knowledgeSources !== undefined
                ? { knowledgeSources: mappedSources }
                : {}),
              ...(data.contentLanguage !== undefined
                ? {
                    contentLanguage: normalizeContentLanguageInput(
                      data.contentLanguage
                    ),
                  }
                : {}),
              ...(data.sourceCitation !== undefined
                ? { sourceCitation: data.sourceCitation?.trim() || null }
                : {}),
              ...(data.hostingLicenseGranted !== undefined
                ? { hostingLicenseGranted: data.hostingLicenseGranted }
                : {}),
              ...(data.researchUseConsent !== undefined
                ? { researchUseConsent: data.researchUseConsent }
                : {}),
              ...(data.images !== undefined ? { images: data.images } : {}),
              ...(data.relatedVersionsNote !== undefined
                ? {
                    relatedVersionsNote:
                      data.relatedVersionsNote?.trim() || null,
                  }
                : {}),
            },
            include: POST_INCLUDE,
          });
        });

        return reply.code(200).send({
          post: serializePost(updated, {
            includeBody: true,
            viewerId: authUser.id,
          }),
        });
      }

      const draftSlug = `draft-${Date.now().toString(36)}-${crypto
        .randomBytes(3)
        .toString("hex")}`;

      const created = await prisma.publication.create({
        data: {
          title: safeTitle,
          slug: draftSlug,
          body: rawBody,
          summary: data.summary?.trim() || null,
          authorId: authUser.id,
          contentType: normalizeContentTypeInput(data.contentType),
          knowledgeSources: mappedSources,
          contentLanguage: normalizeContentLanguageInput(data.contentLanguage),
          sourceCitation: data.sourceCitation?.trim() || null,
          hostingLicenseGranted: data.hostingLicenseGranted ?? true,
          researchUseConsent: data.researchUseConsent ?? false,
          status: PublicationStatus.DRAFT,
          publishedAt: null,
          images: data.images ?? [],
          relatedVersionsNote: data.relatedVersionsNote?.trim() || null,
          ...(resolvedCategoryIds.length > 0
            ? {
                categories: {
                  create: resolvedCategoryIds.map((categoryId) => ({
                    categoryId,
                  })),
                },
              }
            : {}),
        },
        include: POST_INCLUDE,
      });

      return reply.code(201).send({
        post: serializePost(created, {
          includeBody: true,
          viewerId: authUser.id,
        }),
      });
    }
  );

  // POST /api/v1/posts/:id/publish
  app.post(
    "/api/v1/posts/:id/publish",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const parsedOverride = publishOverrideSchema.safeParse(request.body);
      if (!parsedOverride.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hari amakuru atuzuye neza mbere yo gutangaza.",
            fields: parsedOverride.error.flatten().fieldErrors,
          },
        });
      }

      const existing = await prisma.publication.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        include: POST_INCLUDE,
      });

      if (!existing) {
        return reply.code(404).send({
          error: {
            code: "POST_NOT_FOUND",
            message: "Inyandiko ntiyabonetse.",
          },
        });
      }

      if (existing.authorId !== authUser.id) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN",
            message: "Umwanditsi w'iyi nyandiko ni we gusa ushobora kuyitangaza.",
          },
        });
      }

      if (existing.status === PublicationStatus.PUBLISHED) {
        return reply.code(409).send({
          error: {
            code: "ALREADY_PUBLISHED",
            message: "Iyi nyandiko yamaze gutangazwa.",
          },
        });
      }

      const patch = parsedOverride.data ?? {};
      const finalTitle = (patch.title ?? existing.title).trim();
      const finalBody = (patch.body ?? existing.body).trim();
      const finalSources =
        patch.knowledgeSources !== undefined
          ? patch.knowledgeSources
              .map((s) => normalizeKnowledgeSourceInput(s))
              .filter((s): s is KnowledgeSourceType => s !== null)
          : existing.knowledgeSources;

      const patchTopics = [...(patch.categoryIds ?? []), ...(patch.topics ?? [])];
      const finalCategoryIds =
        patch.categoryIds !== undefined || patch.topics !== undefined
          ? await resolveCategoryIds(patchTopics)
          : existing.categories.map((c) => c.category.id);

      const hostingLicense =
        patch.hostingLicenseGranted ?? existing.hostingLicenseGranted;

      const validationErrors: Record<string, string[]> = {};
      if (finalTitle.length < 5 || finalTitle.length > 150) {
        validationErrors.title = [
          "Umutwe ugomba kuba ufite hagati y'inyuguti 5 na 150.",
        ];
      }
      if (finalBody.length < 100 || finalBody.length > 20000) {
        validationErrors.body = [
          "Umubiri w'inyandiko ugomba kuba ufite hagati y'inyuguti 100 na 20,000.",
        ];
      }
      if (finalSources.length < 1) {
        validationErrors.knowledgeSources = [
          "Hitamo nibura inkomoko imwe y'ubumenyi.",
        ];
      }
      if (finalCategoryIds.length < 1) {
        validationErrors.topics = ["Hitamo nibura insanganyamatsiko imwe."];
      }
      if (hostingLicense !== true) {
        validationErrors.hostingLicenseGranted = [
          "Ugomba kwemera uruhushya rwo kubika no kwerekana inyandiko kuri Urunana.",
        ];
      }

      if (Object.keys(validationErrors).length > 0) {
        return reply.code(400).send({
          error: {
            code: "PUBLISH_VALIDATION_FAILED",
            message: "Hari amakuru abura mbere yo gutangaza inyandiko.",
            fields: validationErrors,
          },
        });
      }

      const uniqueSlug = await generateUniquePostSlug(finalTitle, existing.id);
      const now = new Date();
      const finalSummary =
        (patch.summary !== undefined ? patch.summary : existing.summary)?.trim() ||
        finalBody.replace(/\s+/g, " ").slice(0, 180);

      const published = await prisma.$transaction(async (tx) => {
        if (patch.categoryIds !== undefined || patch.topics !== undefined) {
          await tx.publicationTopic.deleteMany({
            where: { publicationId: existing.id },
          });
          await tx.publicationTopic.createMany({
            data: finalCategoryIds.map((categoryId) => ({
              publicationId: existing.id,
              categoryId,
            })),
          });
        }

        return tx.publication.update({
          where: { id: existing.id },
          data: {
            title: finalTitle,
            slug: uniqueSlug,
            body: finalBody,
            summary: finalSummary,
            contentType:
              patch.contentType !== undefined
                ? normalizeContentTypeInput(patch.contentType)
                : existing.contentType,
            knowledgeSources: finalSources,
            contentLanguage:
              patch.contentLanguage !== undefined
                ? normalizeContentLanguageInput(patch.contentLanguage)
                : existing.contentLanguage,
            sourceCitation:
              patch.sourceCitation !== undefined
                ? patch.sourceCitation?.trim() || null
                : existing.sourceCitation,
            hostingLicenseGranted: true,
            researchUseConsent:
              patch.researchUseConsent ?? existing.researchUseConsent,
            images: patch.images ?? existing.images,
            relatedVersionsNote:
              patch.relatedVersionsNote !== undefined
                ? patch.relatedVersionsNote?.trim() || null
                : existing.relatedVersionsNote,
            status: PublicationStatus.PUBLISHED,
            publishedAt: now,
          },
          include: POST_INCLUDE,
        });
      });

      return reply.code(200).send({
        post: serializePost(published, {
          includeBody: true,
          viewerId: authUser.id,
        }),
      });
    }
  );

  // PATCH /api/v1/posts/:id
  app.patch(
    "/api/v1/posts/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const parsed = updatePostSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hari amakuru atuzuye neza.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const existing = await prisma.publication.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        include: POST_INCLUDE,
      });

      if (!existing) {
        return reply.code(404).send({
          error: {
            code: "POST_NOT_FOUND",
            message: "Inyandiko ntiyabonetse.",
          },
        });
      }

      if (existing.authorId !== authUser.id) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN",
            message: "Umwanditsi w'iyi nyandiko ni we gusa ushobora kuyihindura.",
          },
        });
      }

      const data = parsed.data;
      const nextTitle = data.title !== undefined ? data.title.trim() : existing.title;
      const nextBody = data.body !== undefined ? data.body.trim() : existing.body;
      const nextSources =
        data.knowledgeSources !== undefined
          ? data.knowledgeSources
              .map((s) => normalizeKnowledgeSourceInput(s))
              .filter((s): s is KnowledgeSourceType => s !== null)
          : existing.knowledgeSources;

      const topicInputList = [...(data.categoryIds ?? []), ...(data.topics ?? [])];
      const nextCategoryIds =
        data.categoryIds !== undefined || data.topics !== undefined
          ? await resolveCategoryIds(topicInputList)
          : existing.categories.map((c) => c.category.id);

      if (existing.status === PublicationStatus.PUBLISHED) {
        const validationErrors: Record<string, string[]> = {};
        if (nextTitle.length < 5 || nextTitle.length > 150) {
          validationErrors.title = [
            "Umutwe ugomba kuba ufite hagati y'inyuguti 5 na 150.",
          ];
        }
        if (nextBody.length < 100 || nextBody.length > 20000) {
          validationErrors.body = [
            "Umubiri w'inyandiko ugomba kuba ufite hagati y'inyuguti 100 na 20,000.",
          ];
        }
        if (nextSources.length < 1) {
          validationErrors.knowledgeSources = [
            "Hitamo nibura inkomoko imwe y'ubumenyi.",
          ];
        }
        if (nextCategoryIds.length < 1) {
          validationErrors.topics = ["Hitamo nibura insanganyamatsiko imwe."];
        }
        if (Object.keys(validationErrors).length > 0) {
          return reply.code(400).send({
            error: {
              code: "VALIDATION_ERROR",
              message: "Hari amakuru atujuje ibisabwa.",
              fields: validationErrors,
            },
          });
        }
      }

      const now = new Date();
      const updated = await prisma.$transaction(async (tx) => {
        if (data.categoryIds !== undefined || data.topics !== undefined) {
          await tx.publicationTopic.deleteMany({
            where: { publicationId: existing.id },
          });
          if (nextCategoryIds.length > 0) {
            await tx.publicationTopic.createMany({
              data: nextCategoryIds.map((categoryId) => ({
                publicationId: existing.id,
                categoryId,
              })),
            });
          }
        }

        return tx.publication.update({
          where: { id: existing.id },
          data: {
            title: nextTitle,
            body: nextBody,
            summary:
              data.summary !== undefined
                ? data.summary?.trim() || null
                : existing.summary || nextBody.replace(/\s+/g, " ").slice(0, 180),
            ...(data.contentType !== undefined
              ? { contentType: normalizeContentTypeInput(data.contentType) }
              : {}),
            knowledgeSources: nextSources,
            ...(data.contentLanguage !== undefined
              ? {
                  contentLanguage: normalizeContentLanguageInput(
                    data.contentLanguage
                  ),
                }
              : {}),
            ...(data.sourceCitation !== undefined
              ? { sourceCitation: data.sourceCitation?.trim() || null }
              : {}),
            ...(data.researchUseConsent !== undefined
              ? { researchUseConsent: data.researchUseConsent }
              : {}),
            ...(data.images !== undefined ? { images: data.images } : {}),
            ...(data.relatedVersionsNote !== undefined
              ? { relatedVersionsNote: data.relatedVersionsNote?.trim() || null }
              : {}),
            isEdited: true,
            lastEditedAt: now,
            version: { increment: 1 },
          },
          include: POST_INCLUDE,
        });
      });

      return reply.code(200).send({
        post: serializePost(updated, {
          includeBody: true,
          viewerId: authUser.id,
        }),
      });
    }
  );

  // DELETE /api/v1/posts/:id
  app.delete(
    "/api/v1/posts/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const existing = await prisma.publication.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        select: {
          id: true,
          authorId: true,
          status: true,
          publishedAt: true,
        },
      });

      if (!existing) {
        return reply.code(404).send({
          error: {
            code: "POST_NOT_FOUND",
            message: "Inyandiko ntiyabonetse.",
          },
        });
      }

      if (existing.authorId !== authUser.id) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN",
            message: "Umwanditsi w'iyi nyandiko ni we gusa ushobora kuyisiba.",
          },
        });
      }

      if (existing.status === PublicationStatus.DRAFT) {
        await prisma.publication.delete({ where: { id: existing.id } });
        return reply.code(200).send({ ok: true, deletedId: existing.id });
      }

      const grace = computeGraceWindow(existing.status, existing.publishedAt);
      if (!grace.canDelete) {
        return reply.code(403).send({
          error: {
            code: "GRACE_PERIOD_EXPIRED",
            message:
              "Amasaha 24 yo gusiba iyi nyandiko yararangiye. Ushobora gusaba ubuyobozi kuyikuraho.",
          },
        });
      }

      await prisma.publication.delete({ where: { id: existing.id } });
      return reply.code(200).send({ ok: true, deletedId: existing.id });
    }
  );

  // POST /api/v1/posts/:id/removal-requests
  app.post(
    "/api/v1/posts/:id/removal-requests",
    { preHandler: requireAuth },
    async (request, reply) => {
      const authUser = request.authUser!;
      const { id } = request.params as { id: string };

      const parsed = removalRequestSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hitamo impamvu yemewe yo gusaba gukuraho inyandiko.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const existing = await prisma.publication.findFirst({
        where: { OR: [{ id }, { slug: id }] },
        select: {
          id: true,
          title: true,
          authorId: true,
          status: true,
          publishedAt: true,
        },
      });

      if (!existing) {
        return reply.code(404).send({
          error: {
            code: "POST_NOT_FOUND",
            message: "Inyandiko ntiyabonetse.",
          },
        });
      }

      if (existing.authorId !== authUser.id) {
        return reply.code(403).send({
          error: {
            code: "FORBIDDEN",
            message:
              "Umwanditsi w'iyi nyandiko ni we gusa ushobora gusaba ko ikurwaho.",
          },
        });
      }

      if (existing.status !== PublicationStatus.PUBLISHED) {
        return reply.code(400).send({
          error: {
            code: "POST_NOT_PUBLISHED",
            message: "Ubusabe bwo gukuraho bureba inyandiko zatangajwe gusa.",
          },
        });
      }

      const grace = computeGraceWindow(existing.status, existing.publishedAt);
      if (grace.canDelete) {
        return reply.code(400).send({
          error: {
            code: "WITHIN_GRACE_PERIOD",
            message:
              "Ushobora gusiba iyi nyandiko ubwawe kuko amasaha 24 atarashira.",
          },
        });
      }

      const existingPending = await prisma.removalRequest.findFirst({
        where: {
          publicationId: existing.id,
          status: RemovalRequestStatus.PENDING,
        },
        select: { id: true },
      });

      if (existingPending) {
        return reply.code(409).send({
          error: {
            code: "DUPLICATE_REMOVAL_REQUEST",
            message: "Hari ubusabe busanzwe buri gusuzumwa kuri iyi nyandiko.",
          },
        });
      }

      const noteText = (parsed.data.note ?? parsed.data.notes ?? "").trim() || null;

      const removalRequest = await prisma.removalRequest.create({
        data: {
          userId: authUser.id,
          publicationId: existing.id,
          postTitleSnapshot: existing.title,
          requesterIdentifier: authUser.emailOrPhone ?? authUser.username,
          reason: parsed.data.reason as PostRemovalReason,
          notes: noteText,
          status: RemovalRequestStatus.PENDING,
        },
      });

      return reply.code(201).send({ removalRequest });
    }
  );
}
