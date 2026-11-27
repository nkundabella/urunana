import type { FastifyInstance } from "fastify";
import { PublicationStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { resolveAuthUser } from "../../plugins/auth-guard.js";
import { POST_INCLUDE, serializePost } from "../posts/post.presenter.js";

const DEFAULT_FEATURED_PROMPT =
  "Ikiganiro cy'icyumweru: Ni uwuhe mugani w'Ikinyarwanda wagufashije mu buzima?";

function parseRuleNumber(ruleCode: string): number {
  const digits = ruleCode.replace(/\D/g, "");
  const parsed = Number.parseInt(digits, 10);
  return Number.isNaN(parsed) ? 999 : parsed;
}

export async function metadataRoutes(app: FastifyInstance) {
  // GET /api/v1/categories
  app.get("/api/v1/categories", async () => {
    const categories = await prisma.topicCategory.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            publications: {
              where: {
                publication: { status: PublicationStatus.PUBLISHED },
              },
            },
          },
        },
      },
    });

    return {
      categories: categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        nameRw: cat.nameRw,
        nameEn: cat.nameEn,
        nameFr: cat.nameFr,
        description: cat.description,
        isHealthOrMedicine: cat.isHealthOrMedicine,
        publicationCount: cat._count.publications,
      })),
    };
  });

  // GET /api/v1/rules
  app.get("/api/v1/rules", async () => {
    const rules = await prisma.communityRule.findMany();
    rules.sort((a, b) => parseRuleNumber(a.ruleCode) - parseRuleNumber(b.ruleCode));

    return {
      rules: rules.map((r) => ({
        ruleCode: r.ruleCode,
        number: String(parseRuleNumber(r.ruleCode)).padStart(2, "0"),
        titleRw: r.titleRw,
        titleEn: r.titleEn,
        titleFr: r.titleFr,
        descriptionRw: r.descriptionRw,
        descriptionEn: r.descriptionEn,
        descriptionFr: r.descriptionFr,
        tier: r.tier,
        updatedAt: r.updatedAt,
      })),
    };
  });

  // GET /api/v1/home
  app.get("/api/v1/home", async (request) => {
    const viewer = await resolveAuthUser(request);

    const [
      wordOfTheWeek,
      promptSetting,
      featuredContributorRecord,
      categories,
      featuredPosts,
    ] = await Promise.all([
      prisma.wordOfTheWeek.findFirst({
        where: { isActive: true },
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.systemSetting.findUnique({
        where: { key: "FEATURED_DISCUSSION_PROMPT" },
      }),
      prisma.featuredItem.findFirst({
        where: { type: "CONTRIBUTOR", isActive: true },
        orderBy: { startDate: "desc" },
      }),
      prisma.topicCategory.findMany({
        where: { isArchived: false },
        orderBy: { createdAt: "asc" },
      }),
      prisma.publication.findMany({
        where: { status: PublicationStatus.PUBLISHED },
        include: POST_INCLUDE,
        orderBy: [
          { isFeatured: "desc" },
          { featuredAt: "desc" },
          { publishedAt: "desc" },
        ],
        take: 6,
      }),
    ]);

    let authorOfTheWeek = null;
    if (featuredContributorRecord) {
      authorOfTheWeek = await prisma.user.findUnique({
        where: { id: featuredContributorRecord.targetId },
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
      });
    }

    if (!authorOfTheWeek) {
      authorOfTheWeek = await prisma.user.findFirst({
        where: {
          accountStatus: "ACTIVE",
          publications: {
            some: { status: PublicationStatus.PUBLISHED },
          },
        },
        orderBy: [
          { isFoundingContributor: "desc" },
          { publications: { _count: "desc" } },
          { createdAt: "asc" },
        ],
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
      });
    }

    let savedIds = new Set<string>();
    let followingAuthorIds = new Set<string>();
    if (viewer && featuredPosts.length > 0) {
      const postIds = featuredPosts.map((p) => p.id);
      const authorIds = [...new Set(featuredPosts.map((p) => p.authorId))];
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
      wordOfTheWeek: wordOfTheWeek
        ? {
            id: wordOfTheWeek.id,
            word: wordOfTheWeek.word,
            pronunciation: wordOfTheWeek.pronunciation,
            explanationRw: wordOfTheWeek.explanationRw,
            explanationEn: wordOfTheWeek.explanationEn,
            explanationFr: wordOfTheWeek.explanationFr,
            culturalContext: wordOfTheWeek.culturalContext,
            exampleSentenceRw: wordOfTheWeek.exampleSentenceRw,
            exampleSentenceTranslation: wordOfTheWeek.exampleSentenceTranslation,
            startDate: wordOfTheWeek.startDate,
            endDate: wordOfTheWeek.endDate,
          }
        : null,
      featuredPrompt: promptSetting?.value || DEFAULT_FEATURED_PROMPT,
      authorOfTheWeek: authorOfTheWeek
        ? {
            id: authorOfTheWeek.id,
            username: authorOfTheWeek.username,
            displayName: authorOfTheWeek.displayName,
            bio: authorOfTheWeek.bio,
            profilePhotoUrl: authorOfTheWeek.profilePhotoUrl,
            isFoundingContributor: authorOfTheWeek.isFoundingContributor,
            publicationCount: authorOfTheWeek._count.publications,
          }
        : null,
      categories: categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        nameRw: c.nameRw,
        nameEn: c.nameEn,
        nameFr: c.nameFr,
        description: c.description,
        isHealthOrMedicine: c.isHealthOrMedicine,
      })),
      featuredStories: featuredPosts.map((post) =>
        serializePost(post, {
          savedIds,
          followingAuthorIds,
          viewerId: viewer?.id,
        })
      ),
    };
  });
}
