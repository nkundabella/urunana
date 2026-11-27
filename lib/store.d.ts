import type { StoryItem } from "@/components/StoryCard";

export type PostStatus = "draft" | "published" | "hidden";
export type RemovalReason = "ikosa" | "amakuru-bwite" | "ikindi";
export type RemovalAction = "emeza" | "siba" | "hagarika";
export type UiLanguage = "rw" | "en" | "fr";

export type StorePost = StoryItem & {
  authorId: string;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt?: string;
  body?: string;
  saved?: boolean;
  following?: boolean;
  feed?: boolean;
  category?: string;
  topic?: string;
  type?: string;
  source?: string;
  language?: string;
};

export type RemovalRequest = {
  id: string;
  postId: string;
  reason: RemovalReason;
  note: string;
  status: "pending" | "approved" | "deleted" | "rejected";
  createdAt: string;
  resolvedAction?: RemovalAction;
  resolvedAt?: string;
};

export type StoreReply = {
  id: string;
  author: string;
  authorId?: string;
  role?: string;
  body: string;
};

export type StoreComment = {
  id: string;
  author?: string;
  authorId?: string;
  date?: string;
  body?: string;
  deleted?: boolean;
  replies: StoreReply[];
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export const GRACE_HOURS: number;

export function slugifyTitle(
  title: string,
  existingPosts?: Array<{ id?: string; slug?: string }>,
  excludeId?: string | null
): string;
export function getPosts(): StorePost[];
export function getPostById(idOrSlug: string): StorePost | null;
export function filterVisiblePosts<T extends { status?: PostStatus; authorId?: string }>(
  posts: T[],
  viewerAuthorId?: string | null
): T[];
export function getVisiblePosts(viewerAuthorId?: string | null): StorePost[];
export function saveDraft(post: Partial<StorePost>): StorePost;
export function publishPost(id: string): StorePost | null;
export function updatePost(idOrSlug: string, patch: Partial<StorePost>): StorePost | null;
export function toggleSavePost(idOrSlug: string): StorePost | null;
export function canDelete(
  post: Pick<StorePost, "status" | "publishedAt"> | null | undefined
): boolean;
export function hoursLeft(
  post: Pick<StorePost, "status" | "publishedAt"> | null | undefined
): number;
export function deletePost(id: string): boolean;
export function requestRemoval(input: {
  postId: string;
  reason: RemovalReason;
  note?: string;
}): RemovalRequest;
export function listRemovalRequests(): RemovalRequest[];
export function resolveRequest(id: string, action: RemovalAction): RemovalRequest | null;
export function getComments(postIdOrSlug: string): StoreComment[];
export function addComment(
  postIdOrSlug: string,
  input: { author?: string; authorId?: string; body: string }
): StoreComment[] | null;
export function addCommentReply(
  postIdOrSlug: string,
  commentId: string,
  input: { author?: string; authorId?: string; role?: string; body: string }
): StoreComment[] | null;
export function editComment(
  postIdOrSlug: string,
  commentId: string,
  body: string
): StoreComment[] | null;
export function deleteComment(postIdOrSlug: string, commentId: string): StoreComment[];
export function listContactMessages(): ContactMessage[];
export function saveContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): ContactMessage;
export function getUiLanguage(): UiLanguage;
export function setUiLanguage(lang: UiLanguage): UiLanguage;
