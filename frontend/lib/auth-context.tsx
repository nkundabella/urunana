"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  type AuthMeResponse,
  type AuthUser,
  type UiLanguage,
} from "@/lib/api";

export const PENDING_VERIFY_STORAGE_KEY = "urunana_pending_verify";
const UI_LANG_STORAGE_KEY = "urunana_ui_lang";

function readStoredUiLanguage(): UiLanguage {
  if (typeof window === "undefined") return "rw";
  try {
    const raw = localStorage.getItem(UI_LANG_STORAGE_KEY);
    if (raw === "en" || raw === "fr" || raw === "rw") return raw;
  } catch {
    // Ignore storage errors in private browsing modes.
  }
  return "rw";
}

function writeStoredUiLanguage(lang: UiLanguage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(UI_LANG_STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors.
  }
}

export function setPendingVerifyIdentifier(identifier: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_VERIFY_STORAGE_KEY, identifier);
  } catch {
    // Ignore storage errors in private browsing modes.
  }
}

export function getPendingVerifyIdentifier(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(PENDING_VERIFY_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function clearPendingVerifyIdentifier(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_VERIFY_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  unreadNotificationCount: number;
  language: UiLanguage;
  refreshAuth: () => Promise<AuthMeResponse | null>;
  logout: () => Promise<void>;
  setPreferredLanguage: (next: UiLanguage) => Promise<void>;
  setUser: (next: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeLang(value: string | null | undefined): UiLanguage {
  if (value === "en" || value === "fr" || value === "rw") {
    return value;
  }
  return "rw";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<UiLanguage>("rw");

  const applyUserState = useCallback((nextUser: AuthUser | null, unread = 0) => {
    setUserState(nextUser);
    setUnreadNotificationCount(unread);

    if (nextUser) {
      const nextLang = normalizeLang(nextUser.preferredLanguage);
      setLanguage(nextLang);
      writeStoredUiLanguage(nextLang);
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<AuthMeResponse | null> => {
    try {
      const data = await apiFetch<AuthMeResponse>("/api/v1/auth/me");
      applyUserState(data.user, data.unreadNotificationCount ?? 0);
      return data;
    } catch {
      applyUserState(null, 0);
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyUserState]);

  useEffect(() => {
    setLanguage(readStoredUiLanguage());
    void refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const logout = useCallback(async () => {
    try {
      await apiFetch<{ ok: boolean }>("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch {
      // Clear local auth state even if the network request fails.
    } finally {
      applyUserState(null, 0);
    }
  }, [applyUserState]);

  const setPreferredLanguage = useCallback(
    async (next: UiLanguage) => {
      setLanguage(next);
      writeStoredUiLanguage(next);

      if (!user) return;

      try {
        const res = await apiFetch<{
          preferredLanguage: UiLanguage;
          user: AuthUser;
        }>("/api/v1/users/me/language", {
          method: "PATCH",
          json: { language: next },
        });
        if (res.user) {
          setUserState(res.user);
        }
      } catch {
        // Keep local selection even if backend sync fails temporarily.
      }
    },
    [user]
  );

  const setUser = useCallback(
    (next: AuthUser | null) => {
      applyUserState(next, next ? unreadNotificationCount : 0);
    },
    [applyUserState, unreadNotificationCount]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      unreadNotificationCount,
      language,
      refreshAuth,
      logout,
      setPreferredLanguage,
      setUser,
    }),
    [
      user,
      loading,
      unreadNotificationCount,
      language,
      refreshAuth,
      logout,
      setPreferredLanguage,
      setUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}
