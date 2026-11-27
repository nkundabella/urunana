import seedStories from "@/src/data/stories.json";
import seedRemovalRequests from "@/src/data/removalRequests.json";

export const GRACE_HOURS = 24;

const POSTS_KEY = "urunana_posts_v1";
const REQUESTS_KEY = "urunana_removal_requests_v1";
const CONTACT_KEY = "urunana_contact_messages_v1";
const COMMENTS_KEY = "urunana_comments_v1";
const LANG_KEY = "urunana_ui_lang";
const VALID_REASONS = new Set(["ikosa", "amakuru-bwite", "ikindi"]);
const VALID_LANGS = new Set(["rw", "en", "fr"]);

const SEED_COMMENTS = {
  "umurage-wa-ruganzu-1": [
    {
      id: "c-1",
      author: "Mugabo Eric",
      authorId: "mugabo-eric",
      date: "15 Ukwakira 2026",
      body: "Urakoze cyane Kalisa! Sogokuru wanjye yakundaga kutubwira amateka ya Ruganzu Ndoli n'uburyo yagaruye ubumwe mu gihugu. Iyi nyandiko irasobanutse neza.",
      replies: [
        {
          id: "r-1",
          author: "Kalisa Mugisha",
          authorId: "kalisa-mugisha",
          role: "Umwanditsi",
          body: "Murakoze cyane Eric! Ni byiza ko dukomeza gusangira izi nkuru kugira ngo abato batazibagirwa.",
        },
      ],
    },
    {
      id: "c-2",
      deleted: true,
      body: "[igitekerezo cyakuweho]",
      replies: [
        {
          id: "r-2",
          author: "Uwase Aline",
          authorId: "uwase-aline",
          body: "Nanjye nemeranya nawe ko kubika izi nkuru mu Kinyarwanda ari umurage ukomeye cyane.",
        },
      ],
    },
  ],
};

let memoryPosts = null;
let memoryRequests = null;
let memoryContacts = null;
let memoryComments = null;
let memoryLang = "rw";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function slugifyTitle(title, existingPosts = [], excludeId = null) {
  const base = String(title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const root = base || `inkuru-${Date.now()}`;
  const used = new Set(
    existingPosts
      .filter((p) => !excludeId || (p.id !== excludeId && p.slug !== excludeId))
      .map((p) => p.slug)
  );
  if (!used.has(root)) return root;

  let n = 2;
  while (used.has(`${root}-${n}`)) {
    n += 1;
  }
  return `${root}-${n}`;
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

function readCommentsMap() {
  if (typeof window === "undefined") {
    if (!memoryComments) memoryComments = clone(SEED_COMMENTS);
    return memoryComments;
  }
  try {
    const raw = window.localStorage.getItem(COMMENTS_KEY);
    if (!raw) {
      const initial = clone(SEED_COMMENTS);
      window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return clone(SEED_COMMENTS);
  }
}

function writeCommentsMap(map) {
  memoryComments = map;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(map));
    } catch {
      // ignore storage quota errors
    }
  }
}

function resolvePostKey(idOrSlug) {
  const post = getPostById(idOrSlug);
  return post ? post.id : idOrSlug;
}

function syncPostCommentCount(postKey, commentList) {
  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === postKey || p.slug === postKey);
  if (idx < 0) return;
  const total = commentList.reduce(
    (sum, c) => sum + (c.deleted ? 0 : 1) + (Array.isArray(c.replies) ? c.replies.length : 0),
    0
  );
  posts[idx] = { ...posts[idx], comments: total };
  writePosts(posts);
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
  const existingIdx = post.id
    ? posts.findIndex((p) => p.id === post.id || p.slug === post.id)
    : post.slug
      ? posts.findIndex((p) => p.slug === post.slug || p.id === post.slug)
      : -1;
  const existing = existingIdx >= 0 ? posts[existingIdx] : null;

  const id = existing?.id || post.id || `draft-${Date.now()}`;
  const slug =
    post.slug ||
    (post.title
      ? slugifyTitle(post.title, posts, id)
      : existing?.slug || id);

  const defaultTags = [];
  if (post.topic || existing?.topic) {
    defaultTags.push({ label: post.topic || existing.topic, tone: "orange" });
  }
  if (post.source || existing?.source) {
    defaultTags.push({ label: post.source || existing.source, tone: "sand" });
  }
  if (post.language || existing?.language) {
    defaultTags.push({ label: post.language || existing.language, tone: "ink" });
  }

  const draft = {
    comments: 0,
    saved: false,
    following: false,
    feed: true,
    tags: defaultTags,
    ...existing,
    ...post,
    id,
    slug,
    tags:
      Array.isArray(post.tags) && post.tags.length > 0
        ? post.tags
        : Array.isArray(existing?.tags) && existing.tags.length > 0
          ? existing.tags
          : defaultTags,
    authorId: post.authorId ?? existing?.authorId ?? "kalisa-mugisha",
    author: post.author ?? existing?.author ?? "Kalisa Mugisha",
    status: "draft",
    publishedAt: existing?.publishedAt ?? null,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    posts[existingIdx] = draft;
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
    feed: posts[idx].feed ?? true,
    status: "published",
    publishedAt: new Date().toISOString(),
  };
  posts[idx] = updated;
  writePosts(posts);
  return updated;
}

export function updatePost(idOrSlug, patch) {
  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (idx < 0) return null;

  const current = posts[idx];
  const updated = {
    ...current,
    ...patch,
    id: current.id,
    slug: current.slug,
    status: current.status,
    publishedAt: current.publishedAt,
    updatedAt: new Date().toISOString(),
  };
  posts[idx] = updated;
  writePosts(posts);
  return updated;
}

export function toggleSavePost(idOrSlug) {
  const posts = readPosts();
  const idx = posts.findIndex((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (idx < 0) return null;

  const updated = {
    ...posts[idx],
    saved: !posts[idx].saved,
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

export function getComments(postIdOrSlug) {
  const key = resolvePostKey(postIdOrSlug);
  const map = readCommentsMap();
  return Array.isArray(map[key]) ? clone(map[key]) : [];
}

export function addComment(postIdOrSlug, { author, authorId, body }) {
  const trimmed = String(body || "").trim();
  if (!trimmed) return null;
  const key = resolvePostKey(postIdOrSlug);
  const map = readCommentsMap();
  const list = Array.isArray(map[key]) ? map[key] : [];
  const item = {
    id: `c-${Date.now()}`,
    author: author || "Kalisa Mugisha",
    authorId: authorId || "kalisa-mugisha",
    date: "Uyu munsi",
    body: trimmed,
    replies: [],
  };
  const nextList = [...list, item];
  map[key] = nextList;
  writeCommentsMap(map);
  syncPostCommentCount(key, nextList);
  return nextList;
}

export function addCommentReply(postIdOrSlug, commentId, { author, authorId, role, body }) {
  const trimmed = String(body || "").trim();
  if (!trimmed) return null;
  const key = resolvePostKey(postIdOrSlug);
  const map = readCommentsMap();
  const list = Array.isArray(map[key]) ? map[key] : [];
  const nextList = list.map((c) => {
    if (c.id !== commentId) return c;
    return {
      ...c,
      replies: [
        ...(Array.isArray(c.replies) ? c.replies : []),
        {
          id: `r-${Date.now()}`,
          author: author || "Kalisa Mugisha",
          authorId: authorId || "kalisa-mugisha",
          ...(role ? { role } : {}),
          body: trimmed,
        },
      ],
    };
  });
  map[key] = nextList;
  writeCommentsMap(map);
  syncPostCommentCount(key, nextList);
  return nextList;
}

export function editComment(postIdOrSlug, commentId, body) {
  const trimmed = String(body || "").trim();
  if (!trimmed) return null;
  const key = resolvePostKey(postIdOrSlug);
  const map = readCommentsMap();
  const list = Array.isArray(map[key]) ? map[key] : [];
  const nextList = list.map((c) =>
    c.id === commentId && !c.deleted ? { ...c, body: trimmed } : c
  );
  map[key] = nextList;
  writeCommentsMap(map);
  return nextList;
}

export function deleteComment(postIdOrSlug, commentId) {
  const key = resolvePostKey(postIdOrSlug);
  const map = readCommentsMap();
  const list = Array.isArray(map[key]) ? map[key] : [];
  const nextList = list.map((c) =>
    c.id === commentId
      ? { ...c, deleted: true, body: "[igitekerezo cyakuweho]" }
      : c
  );
  map[key] = nextList;
  writeCommentsMap(map);
  syncPostCommentCount(key, nextList);
  return nextList;
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

export function getUiLanguage() {
  if (typeof window === "undefined") return memoryLang;
  try {
    const raw = window.localStorage.getItem(LANG_KEY);
    if (raw && VALID_LANGS.has(raw)) return raw;
  } catch {
    // ignore storage errors
  }
  return "rw";
}

export function setUiLanguage(lang) {
  const next = VALID_LANGS.has(lang) ? lang : "rw";
  memoryLang = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore storage errors
    }
  }
  return next;
}
