export type DemoSession = {
  identifier: string;
  displayName: string;
  loggedInAt: string;
};

const SESSION_KEY = "urunana_session";

export function getSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function setSession(identifier: string, displayName?: string): DemoSession {
  const session: DemoSession = {
    identifier,
    displayName:
      displayName?.trim() ||
      (identifier.includes("@") ? identifier.split("@")[0] : identifier),
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export type UiLanguage = "rw" | "en" | "fr";

const LANG_KEY = "urunana_ui_lang";

export function getUiLanguage(): UiLanguage {
  if (typeof window === "undefined") return "rw";
  const raw = localStorage.getItem(LANG_KEY);
  if (raw === "en" || raw === "fr" || raw === "rw") return raw;
  return "rw";
}

export function setUiLanguage(lang: UiLanguage): void {
  localStorage.setItem(LANG_KEY, lang);
}
