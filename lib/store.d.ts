import type { StoryItem } from "@/components/StoryCard";

export type PostStatus = "draft" | "published" | "hidden";
export type RemovalReason = "ikosa" | "amakuru-bwite" | "ikindi";
export type RemovalAction = "emeza" | "siba" | "hagarika";

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

export const GRACE_HOURS: number;

export function getPosts(): StorePost[];
export function getPostById(idOrSlug: string): StorePost | null;
export function filterVisiblePosts<T extends { status?: PostStatus; authorId?: string }>(
  posts: T[],
  viewerAuthorId?: string | null
): T[];
export function getVisiblePosts(viewerAuthorId?: string | null): StorePost[];
export function saveDraft(post: Partial<StorePost>): StorePost;
export function publishPost(id: string): StorePost | null;
export function canDelete(post: Pick<StorePost, "status" | "publishedAt"> | null | undefined): boolean;
export function hoursLeft(post: Pick<StorePost, "status" | "publishedAt"> | null | undefined): number;
export function deletePost(id: string): boolean;
export function requestRemoval(input: {
  postId: string;
  reason: RemovalReason;
  note?: string;
}): RemovalRequest;
export function listRemovalRequests(): RemovalRequest[];
export function resolveRequest(id: string, action: RemovalAction): RemovalRequest | null;
