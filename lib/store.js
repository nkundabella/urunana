import seedStories from "@/src/data/stories.json";
import seedRemovalRequests from "@/src/data/removalRequests.json";

export const GRACE_HOURS = 24;

const POSTS_KEY = "urunana_posts_v1";
const REQUESTS_KEY = "urunana_removal_requests_v1";
const CONTACT_KEY = "urunana_contact_messages_v1";
const VALID_REASONS = new Set(["ikosa", "amakuru-bwite", "ikindi"]);

let memoryPosts = null;
let memoryRequests = null;
let memoryContacts = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readPosts() {
  if (typeof window === "undefined") {
    if (!memoryPosts) memoryPosts = clone(seedStories);
    return memoryPosts;
  }
  try {
    const raw = window.localStorage.getItem(POSTS_KEY);
    if (!raw) {
      const initial = clone(seedStories);
      window.localStorage.setItem(POSTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return clone(seedStories);
  }
}

function writePosts(posts) {
  memoryPosts = posts;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch {
      // ignore storage quota errors
    }
  }
}

function readRequests() {
  if (typeof window === "undefined") {
    if (!memoryRequests) memoryRequests = clone(seedRemovalRequests);
    return memoryRequests;
  }
  try {
    const raw = window.localStorage.getItem(REQUESTS_KEY);
    if (!raw) {
      const initial = clone(seedRemovalRequests);
      window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return clone(seedRemovalRequests);
  }
}

function writeRequests(requests) {
  memoryRequests = requests;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    } catch {
      // ignore storage quota errors
    }
  }
}

export function getPosts() {
  return readPosts();
}

export function getPostById(idOrSlug) {
  return (
    readPosts().find((p) => p.id === idOrSlug || p.slug === idOrSlug) ?? null
  );
}

/**
 * Excludes "hidden" and "draft" posts by default.
 * When viewerAuthorId is provided, drafts authored by that viewer are included.
 */
export function filterVisiblePosts(posts, viewerAuthorId = null) {
  return posts.filter((post) => {
    const status = post.status ?? "published";
    if (status === "hidden") return false;
    if (status === "draft") {
      return Boolean(viewerAuthorId && post.authorId === viewerAuthorId);
    }
    return true;
  });
}

export function getVisiblePosts(viewerAuthorId = null) {
  return filterVisiblePosts(readPosts(), viewerAuthorId);
}

export function saveDraft(post) {
  const posts = readPosts();
  const id = post.id || `draft-${Date.now()}`;
  const slug =
    post.slug ||
    (post.title
      ? post.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : id);

  const idx = posts.findIndex((p) => p.id === id || p.slug === slug);
  const existing = idx >= 0 ? posts[idx] : null;

  const draft = {
    comments: 0,
    saved: false,
    following: false,
    feed: true,
    tags: [],
    ...existing,
    ...post,
    id: existing?.id ?? id,
    slug: existing?.slug ?? slug,
    authorId: post.authorId ?? existing?.authorId ?? "kalisa-mugisha",
    author: post.author ?? existing?.author ?? "Kalisa Mugisha",
    status: "draft",
    publishedAt: existing?.publishedAt ?? null,
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    posts[idx] = draft;
  } else {
    posts.unshift(draft);
  }
  writePosts(posts);
  return draft;
}

export function publishPost(id) {
  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === id || p.slug === id);
  if (idx < 0) return null;

  const updated = {
    ...posts[idx],
    status: "published",
    publishedAt: new Date().toISOString(),
  };
  posts[idx] = updated;
  writePosts(posts);
  return updated;
}

export function canDelete(post) {
  if (!post || post.status !== "published" || !post.publishedAt) return false;
  const publishedMs = new Date(post.publishedAt).getTime();
  if (Number.isNaN(publishedMs)) return false;
  const elapsedMs = Date.now() - publishedMs;
  return elapsedMs >= 0 && elapsedMs < GRACE_HOURS * 60 * 60 * 1000;
}

export function hoursLeft(post) {
  if (!canDelete(post)) return 0;
  const publishedMs = new Date(post.publishedAt).getTime();
  const remainingMs = GRACE_HOURS * 60 * 60 * 1000 - (Date.now() - publishedMs);
  return Math.max(0, Math.ceil(remainingMs / (60 * 60 * 1000)));
}

export function deletePost(id) {
  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === id || p.slug === id);
  if (idx < 0) return false;
  if (!canDelete(posts[idx])) return false;

  posts.splice(idx, 1);
  writePosts(posts);
  return true;
}

export function requestRemoval({ postId, reason, note = "" }) {
  const safeReason = VALID_REASONS.has(reason) ? reason : "ikindi";
  const requests = readRequests();
  const req = {
    id: `req-${Date.now()}`,
    postId,
    reason: safeReason,
    note: String(note || "").trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.unshift(req);
  writeRequests(requests);
  return req;
}

export function listRemovalRequests() {
  return readRequests();
}

/**
 * Resolves a removal request:
 * - "emeza": sets post.status = "hidden" (kept in archive)
 * - "siba": erases the post completely
 * - "hagarika": rejects and closes the request
 */
export function resolveRequest(id, action) {
  const requests = readRequests();
  const reqIdx = requests.findIndex((r) => r.id === id);
  if (reqIdx < 0) return null;

  const targetReq = requests[reqIdx];
  const posts = readPosts();
  const postIdx = posts.findIndex(
    (p) => p.id === targetReq.postId || p.slug === targetReq.postId
  );

  let nextStatus = targetReq.status;

  if (action === "emeza") {
    if (postIdx >= 0) {
      posts[postIdx] = { ...posts[postIdx], status: "hidden" };
      writePosts(posts);
    }
    nextStatus = "approved";
  } else if (action === "siba") {
    if (postIdx >= 0) {
      posts.splice(postIdx, 1);
      writePosts(posts);
    }
    nextStatus = "deleted";
  } else if (action === "hagarika") {
    nextStatus = "rejected";
  } else {
    return null;
  }

  const updated = {
    ...targetReq,
    status: nextStatus,
    resolvedAction: action,
    resolvedAt: new Date().toISOString(),
  };
  requests[reqIdx] = updated;
  writeRequests(requests);
  return updated;
}

function readContacts() {
  if (typeof window === "undefined") {
    if (!memoryContacts) memoryContacts = [];
    return memoryContacts;
  }
  try {
    const raw = window.localStorage.getItem(CONTACT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function listContactMessages() {
  return readContacts();
}

export function saveContactMessage({ name, email, message }) {
  const messages = readContacts();
  const entry = {
    id: `msg-${Date.now()}`,
    name: String(name || "").trim(),
    email: String(email || "").trim(),
    message: String(message || "").trim(),
    createdAt: new Date().toISOString(),
  };
  messages.unshift(entry);
  memoryContacts = messages;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONTACT_KEY, JSON.stringify(messages));
    } catch {
      // ignore storage quota errors
    }
  }
  return entry;
}
