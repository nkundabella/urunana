import {
  ContentLanguage,
  ContentType,
  KnowledgeSourceType,
  PublicationStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

export const GRACE_WINDOW_MS = 24 * 60 * 60 * 1000;

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  ARTICLE: "Article",
  STORY: "Inkuru (Story)",
  LANGUAGE_EXPLANATION: "Ubusobanuro bw'Ururimi",
  ORAL_TRADITION: "Ubuvanganzo Nyemvugo",
  PERSONAL_EXPERIENCE: "Ubuhamya Bwite",
  INTERVIEW: "Ikiganiro (Interview)",
  EVENT_NOTICE: "Itangazo ry'Igikorwa",
  RESEARCH_PIECE: "Ubushakashatsi",
  OPINION_INTERPRETATION: "Igitekerezo / Isesengura",
};

export const KNOWLEDGE_SOURCE_LABELS: Record<KnowledgeSourceType, string> = {
  PERSONAL_EXPERIENCE: "Personal experience",
  FAMILY_ORAL_TRADITION: "Family story / oral tradition",
  COMMUNITY_PRACTICE: "Community practice",
  DOCUMENTED_HISTORY: "Documented history",
  RESEARCH_BASED: "Researched",
  INTERVIEW_BASED: "Interview",
  INTERPRETATION_OPINION: "Interpretation",
};

export const LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  KINYARWANDA: "Ikinyarwanda",
  ENGLISH: "English",
  FRENCH: "Français",
  MIXED: "Ikinyarwanda / English",
};

export const TOPIC_SLUG_ALIASES: Record<string, string> = {
  "amateka-n-umurage": "history-heritage",
  "ururimi-rw-ikinyarwanda": "kinyarwanda-language",
  ururimi: "kinyarwanda-language",
  "imigani-n-ibisakuzo": "proverbs-riddles",
  "ubuvanganzo-n-inkuru": "oral-traditions-stories",
  "ubuvanganzo-nyemvugo-n-inkuru": "oral-traditions-stories",
  "imigenzo-gakondo": "traditional-practices",
  "imigenzo-n-ibyirorere-gakondo": "traditional-practices",
  "umuziki-n-imbyino-gakondo": "music-dance",
  "ibyokurya-n-imirire-gakondo": "food-dietary",
  "imyambarire-n-uburanga-gakondo": "clothing-adornment",
  "ubumenyi-n-ubuvuzi-gakondo": "traditional-knowledge-health",
  "ibirori-n-imihango-y-umuco": "cultural-events",
  "ubuzima-bw-umuco-bugezweho": "contemporary-cultural-life",
  "history & heritage": "history-heritage",
  "kinyarwanda language": "kinyarwanda-language",
  "proverbs & riddles": "proverbs-riddles",
  "oral traditions": "oral-traditions-stories",
  "oral traditions & stories": "oral-traditions-stories",
  "traditional practices": "traditional-practices",
  "music & dance": "music-dance",
  food: "food-dietary",
  "traditional food & diet": "food-dietary",
  clothing: "clothing-adornment",
  "traditional clothing & attire": "clothing-adornment",
  "traditional knowledge": "traditional-knowledge-health",
  "traditional knowledge & healing": "traditional-knowledge-health",
  "cultural events": "cultural-events",
  "contemporary life": "contemporary-cultural-life",
  "contemporary rwandan cultural life": "contemporary-cultural-life",
  "amateka n'umurage": "history-heritage",
  "ururimi rw'ikinyarwanda": "kinyarwanda-language",
  "imigani n'ibisakuzo": "proverbs-riddles",
  "ubuvanganzo n'inkuru": "oral-traditions-stories",
  "imigenzo gakondo": "traditional-practices",
};

export function normalizeContentTypeInput(raw?: string): ContentType {
  if (!raw) return ContentType.STORY;
  const trimmed = raw.trim();
  if (Object.values(ContentType).includes(trimmed as ContentType)) {
    return trimmed as ContentType;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes("article")) return ContentType.ARTICLE;
  if (lower.includes("umugani") || lower.includes("proverb") || lower.includes("language")) {
    return ContentType.LANGUAGE_EXPLANATION;
  }
  if (lower.includes("ikiganiro") || lower.includes("discussion") || lower.includes("interview")) {
    return ContentType.INTERVIEW;
  }
  if (lower.includes("oral") || lower.includes("nyemvugo")) {
    return ContentType.ORAL_TRADITION;
  }
  if (lower.includes("research") || lower.includes("bushakashatsi")) {
    return ContentType.RESEARCH_PIECE;
  }
  if (lower.includes("opinion") || lower.includes("interpretation")) {
    return ContentType.OPINION_INTERPRETATION;
  }
  if (lower.includes("event")) return ContentType.EVENT_NOTICE;
  if (lower.includes("personal")) return ContentType.PERSONAL_EXPERIENCE;
  return ContentType.STORY;
}

export function normalizeKnowledgeSourceInput(raw: string): KnowledgeSourceType | null {
  const trimmed = raw.trim();
  if (Object.values(KnowledgeSourceType).includes(trimmed as KnowledgeSourceType)) {
    return trimmed as KnowledgeSourceType;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes("personal")) return KnowledgeSourceType.PERSONAL_EXPERIENCE;
  if (lower.includes("family") || lower.includes("oral")) {
    return KnowledgeSourceType.FAMILY_ORAL_TRADITION;
  }
  if (lower.includes("community")) return KnowledgeSourceType.COMMUNITY_PRACTICE;
  if (lower.includes("documented") || lower.includes("history")) {
    return KnowledgeSourceType.DOCUMENTED_HISTORY;
  }
  if (lower.includes("research")) return KnowledgeSourceType.RESEARCH_BASED;
  if (lower.includes("interview")) return KnowledgeSourceType.INTERVIEW_BASED;
  if (lower.includes("interpretation") || lower.includes("opinion")) {
    return KnowledgeSourceType.INTERPRETATION_OPINION;
  }
  return null;
}

export function normalizeContentLanguageInput(raw?: string): ContentLanguage {
  if (!raw) return ContentLanguage.KINYARWANDA;
  const trimmed = raw.trim();
  if (Object.values(ContentLanguage).includes(trimmed as ContentLanguage)) {
    return trimmed as ContentLanguage;
  }
  const lower = trimmed.toLowerCase();
  if (lower === "en" || lower.includes("english")) return ContentLanguage.ENGLISH;
  if (lower === "fr" || lower.includes("fran")) return ContentLanguage.FRENCH;
  if (lower.includes("mixed")) return ContentLanguage.MIXED;
  return ContentLanguage.KINYARWANDA;
}

export function resolveTopicSlugOrKey(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  return TOPIC_SLUG_ALIASES[lower] ?? trimmed;
}

export function computeGraceWindow(
  status: PublicationStatus,
  publishedAt: Date | null
): { canDelete: boolean; hoursLeft: number } {
  if (status !== PublicationStatus.PUBLISHED || !publishedAt) {
    return { canDelete: false, hoursLeft: 0 };
  }
  const elapsedMs = Date.now() - publishedAt.getTime();
  if (elapsedMs < 0) {
    return { canDelete: true, hoursLeft: 24 };
  }
  if (elapsedMs >= GRACE_WINDOW_MS) {
    return { canDelete: false, hoursLeft: 0 };
  }
  const remainingMs = GRACE_WINDOW_MS - elapsedMs;
  return {
    canDelete: true,
    hoursLeft: Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000))),
  };
}

export function slugifyText(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `inkuru-${Date.now().toString(36)}`;
}

export async function generateUniquePostSlug(
  title: string,
  excludePostId?: string
): Promise<string> {
  const base = slugifyText(title);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.publication.findFirst({
      where: {
        slug: candidate,
        ...(excludePostId ? { NOT: { id: excludePostId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export const POST_INCLUDE = {
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      profilePhotoUrl: true,
      isFoundingContributor: true,
      role: true,
      isModerator: true,
    },
  },
  categories: {
    include: {
      category: {
        select: {
          id: true,
          slug: true,
          nameRw: true,
          nameEn: true,
          nameFr: true,
          isHealthOrMedicine: true,
        },
      },
    },
  },
  _count: {
    select: {
      comments: {
        where: { status: "VISIBLE" as const },
      },
    },
  },
} as const;

export type PostWithRelations = {
  id: string;
  title: string;
  slug: string;
  body: string;
  summary: string | null;
  authorId: string;
  contentType: ContentType;
  knowledgeSources: KnowledgeSourceType[];
  contentLanguage: ContentLanguage;
  sourceCitation: string | null;
  hostingLicenseGranted: boolean;
  researchUseConsent: boolean;
  status: PublicationStatus;
  images: string[];
  relatedVersionsNote: string | null;
  publishedAt: Date | null;
  isEdited: boolean;
  lastEditedAt: Date | null;
  isFeatured: boolean;
  featuredAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    bio: string | null;
    profilePhotoUrl: string | null;
    isFoundingContributor: boolean;
    role: string;
    isModerator: boolean;
  };
  categories: Array<{
    category: {
      id: string;
      slug: string;
      nameRw: string;
      nameEn: string;
      nameFr: string;
      isHealthOrMedicine: boolean;
    };
  }>;
  _count: {
    comments: number;
  };
};

export interface SerializePostOptions {
  includeBody?: boolean;
  savedIds?: Set<string>;
  followingAuthorIds?: Set<string>;
  pendingRemovalPostIds?: Set<string>;
  viewerId?: string | null;
}

export function buildExcerpt(summary: string | null, body: string): string {
  const source = (summary && summary.trim()) || body.trim();
  if (!source) return "";
  const singleLine = source.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 185) return singleLine;
  return `${singleLine.slice(0, 182).trimEnd()}…`;
}

export function serializePost(
  post: PostWithRelations,
  options: SerializePostOptions = {}
) {
  const categories = post.categories.map((pt) => pt.category);
  const primaryCategory = categories[0];
  const primarySource = post.knowledgeSources[0];
  const isHealthOrMedicine = categories.some((c) => c.isHealthOrMedicine);

  const tags: Array<{ label: string; tone: "orange" | "sand" | "ink" }> = [];
  if (post.status === PublicationStatus.DRAFT) {
    tags.push({ label: "Itaratangazwa", tone: "sand" });
  }
  if (primaryCategory) {
    tags.push({ label: primaryCategory.nameRw, tone: "orange" });
  }
  if (primarySource) {
    tags.push({
      label: KNOWLEDGE_SOURCE_LABELS[primarySource],
      tone: "sand",
    });
  }
  tags.push({
    label: LANGUAGE_LABELS[post.contentLanguage],
    tone: "ink",
  });

  const grace = computeGraceWindow(post.status, post.publishedAt);
  const isAuthor = Boolean(options.viewerId && options.viewerId === post.authorId);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: post.summary,
    excerpt: buildExcerpt(post.summary, post.body),
    ...(options.includeBody ? { body: post.body } : {}),
    status: post.status,
    contentType: post.contentType,
    contentTypeLabel: CONTENT_TYPE_LABELS[post.contentType],
    knowledgeSources: post.knowledgeSources,
    knowledgeSourceLabels: post.knowledgeSources.map(
      (s) => KNOWLEDGE_SOURCE_LABELS[s]
    ),
    contentLanguage: post.contentLanguage,
    contentLanguageLabel: LANGUAGE_LABELS[post.contentLanguage],
    sourceCitation: post.sourceCitation,
    hostingLicenseGranted: post.hostingLicenseGranted,
    researchUseConsent: post.researchUseConsent,
    images: post.images,
    relatedVersionsNote: post.relatedVersionsNote,
    isFeatured: post.isFeatured,
    isEdited: post.isEdited,
    lastEditedAt: post.lastEditedAt,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isHealthOrMedicine,
    author: {
      id: post.author.id,
      username: post.author.username,
      displayName: post.author.displayName,
      bio: post.author.bio,
      profilePhotoUrl: post.author.profilePhotoUrl,
      isFoundingContributor: post.author.isFoundingContributor,
    },
    categories,
    tags,
    commentCount: post._count.comments,
    saved: options.savedIds ? options.savedIds.has(post.id) : false,
    isFollowingAuthor: options.followingAuthorIds
      ? options.followingAuthorIds.has(post.authorId)
      : false,
    isAuthor,
    canDelete: grace.canDelete,
    hoursLeft: grace.hoursLeft,
    hasPendingRemoval: options.pendingRemovalPostIds
      ? options.pendingRemovalPostIds.has(post.id)
      : false,
  };
}
