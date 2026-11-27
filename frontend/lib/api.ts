export type UiLanguage = "rw" | "en" | "fr";
export type UserRole = "USER" | "ADMIN";
export type AccountStatus = "ACTIVE" | "WARNING" | "SUSPENDED" | "GHOST";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  emailOrPhone: string | null;
  role: UserRole;
  isModerator: boolean;
  preferredLanguage: UiLanguage;
  isFoundingContributor: boolean;
  foundingJoinDate: string | null;
  accountStatus: AccountStatus;
  statedAgeBand: string;
  profilePhotoUrl: string | null;
  areasOfInterest: string[];
  researchUseConsent: boolean;
  communityRulesAccepted: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export interface AuthMeResponse {
  user: AuthUser | null;
  unreadNotificationCount: number;
}

interface BackendErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[] | undefined>;
    attempts?: number;
    remainingAttempts?: number;
    maxAttempts?: number;
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string[] | undefined>;
  attempts?: number;
  remainingAttempts?: number;
  maxAttempts?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    extra?: {
      fields?: Record<string, string[] | undefined>;
      attempts?: number;
      remainingAttempts?: number;
      maxAttempts?: number;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = extra?.fields;
    this.attempts = extra?.attempts;
    this.remainingAttempts = extra?.remainingAttempts;
    this.maxAttempts = extra?.maxAttempts;
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
  body?: BodyInit | null;
  /** Optional raw Cookie header to forward during Next.js SSR / Server Components. */
  cookieHeader?: string | null;
}

function normalizePath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/api/")) {
    return path;
  }
  const clean = path.replace(/^\/+/, "");
  return `/api/v1/${clean}`;
}

function resolveApiUrl(path: string): string {
  const normalized = normalizePath(path);
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  if (typeof window !== "undefined") {
    return normalized;
  }
  const internalBase = (
    process.env.INTERNAL_API_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");
  return `${internalBase}${normalized}`;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { json, body, cookieHeader, headers: rawHeaders, ...rest } = options;
  const headers = new Headers(rawHeaders);

  let requestBody: BodyInit | null | undefined = body;
  if (json !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    requestBody = JSON.stringify(json);
  }

  if (typeof window === "undefined" && cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const url = resolveApiUrl(path);
  const response = await fetch(url, {
    ...rest,
    headers,
    body: requestBody,
    credentials: typeof window !== "undefined" ? "include" : rest.credentials,
    cache: rest.cache ?? (typeof window === "undefined" ? "no-store" : undefined),
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const envelope = (parsed as BackendErrorEnvelope | null)?.error;
    throw new ApiError(
      response.status,
      envelope?.code || `HTTP_${response.status}`,
      envelope?.message ||
        "Habaye ikibazo mu itumanaho. Ongera ugerageze nyuma y'akanya.",
      {
        fields: envelope?.fields,
        attempts: envelope?.attempts,
        remainingAttempts: envelope?.remainingAttempts,
        maxAttempts: envelope?.maxAttempts,
      }
    );
  }

  return parsed as T;
}

export async function serverApiFetch<T>(
  path: string,
  cookieHeader?: string | null,
  options: Omit<ApiFetchOptions, "cookieHeader"> = {}
): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    cookieHeader,
  });
}
