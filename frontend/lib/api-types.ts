import type { StoryItem, StoryTag } from "@/components/StoryCard";

export type PublicationStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "REMOVED"
  | "AUTO_HIDDEN";

export type ContentType =
  | "ARTICLE"
  | "STORY"
  | "LANGUAGE_EXPLANATION"
  | "ORAL_TRADITION"
  | "PERSONAL_EXPERIENCE"
  | "INTERVIEW"
  | "EVENT_NOTICE"
  | "RESEARCH_PIECE"
  | "OPINION_INTERPRETATION";

export type KnowledgeSourceType =
  | "PERSONAL_EXPERIENCE"
  | "FAMILY_ORAL_TRADITION"
  | "COMMUNITY_PRACTICE"
  | "DOCUMENTED_HISTORY"
  | "RESEARCH_BASED"
  | "INTERVIEW_BASED"
  | "INTERPRETATION_OPINION";

export type ContentLanguage = "KINYARWANDA" | "ENGLISH" | "FRENCH" | "MIXED";

export type PostRemovalReason = "IKOSA" | "AMAKURU_BWITE" | "IKINDI";

export interface TopicCategoryDto {
  id: string;
  slug: string;
  nameRw: string;
  nameEn: string;
  nameFr: string;
  description: string | null;
  isHealthOrMedicine: boolean;
  publicationCount?: number;
}

export interface CommunityRuleDto {
  ruleCode: string;
  number: string;
  titleRw: string;
  titleEn: string;
  titleFr: string;
  descriptionRw: string;
  descriptionEn: string;
  descriptionFr: string;
  tier: number;
  updatedAt: string;
}

export interface WordOfTheWeekDto {
  id: string;
  word: string;
  pronunciation: string | null;
  explanationRw: string;
  explanationEn: string;
  explanationFr: string | null;
  culturalContext: string | null;
  exampleSentenceRw: string | null;
  exampleSentenceTranslation: string | null;
  startDate: string;
  endDate: string;
}

export interface AuthorSummaryDto {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  isFoundingContributor: boolean;
  publicationCount?: number;
}

export interface PostDto {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  excerpt: string;
  body?: string;
  status: PublicationStatus;
  contentType: ContentType;
  contentTypeLabel: string;
  knowledgeSources: KnowledgeSourceType[];
  knowledgeSourceLabels: string[];
  contentLanguage: ContentLanguage;
  contentLanguageLabel: string;
  sourceCitation: string | null;
  hostingLicenseGranted: boolean;
  researchUseConsent: boolean;
  images: string[];
  relatedVersionsNote: string | null;
  isFeatured: boolean;
  isEdited: boolean;
  lastEditedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isHealthOrMedicine: boolean;
  author: AuthorSummaryDto;
  categories: TopicCategoryDto[];
  tags: StoryTag[];
  commentCount: number;
  saved: boolean;
  isFollowingAuthor: boolean;
  isAuthor: boolean;
  canDelete: boolean;
  hoursLeft: number;
  hasPendingRemoval: boolean;
}

export interface HomeResponse {
  wordOfTheWeek: WordOfTheWeekDto | null;
  featuredPrompt: string;
  authorOfTheWeek: AuthorSummaryDto | null;
  categories: TopicCategoryDto[];
  featuredStories: PostDto[];
}

export interface PostsListResponse {
  posts: PostDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor: string | null;
}

export interface CommentAuthorDto {
  id: string;
  username: string;
  displayName: string;
  profilePhotoUrl: string | null;
  isFoundingContributor: boolean;
}

export interface CommentReplyDto {
  id: string;
  publicationId: string;
  parentId: string | null;
  body: string;
  deleted: boolean;
  status: "VISIBLE" | "REMOVED_PLACEHOLDER";
  isAlternativeVersion: boolean;
  isEdited: boolean;
  lastEditedAt: string | null;
  createdAt: string;
  author: CommentAuthorDto | null;
  authorId: string;
  isPostAuthor: boolean;
  role: string | null;
}

export interface CommentDto extends CommentReplyDto {
  replies: CommentReplyDto[];
}

export interface CommentsResponse {
  comments: CommentDto[];
  totalCount: number;
}

export interface BookmarksResponse {
  savedPosts: PostDto[];
  followingPosts: PostDto[];
  drafts: PostDto[];
}

export interface PublicProfileUserDto {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  role: "USER" | "ADMIN";
  isModerator: boolean;
  preferredLanguage: string;
  isFoundingContributor: boolean;
  foundingJoinDate: string | null;
  accountStatus: string;
  profilePhotoUrl: string | null;
  areasOfInterest: string[];
  createdAt: string;
  badge: string;
}

export interface ProfileResponse {
  user: PublicProfileUserDto;
  isOwner: boolean;
  isFollowing: boolean;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  posts: PostDto[];
  savedPosts: PostDto[];
}

export interface PersonListItemDto {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  isFoundingContributor: boolean;
  storiesCount: number;
  isFollowing: boolean;
}

export interface PeopleListResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
  };
  people: PersonListItemDto[];
}

export function postToStoryItem(post: PostDto): StoryItem {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    author: post.author.displayName,
    comments: post.commentCount,
    tags: post.tags,
  };
}

const KINYARWANDA_MONTHS = [
  "Mutarama",
  "Gashyantare",
  "Werurwe",
  "Mata",
  "Gicurasi",
  "Kamena",
  "Nyakanga",
  "Kanama",
  "Nzeri",
  "Ukwakira",
  "Ugushyingo",
  "Ukuboza",
];

export function formatKinyarwandaDate(input?: string | Date | null): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const month = KINYARWANDA_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
