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

export function setSession(identifier: string): DemoSession {
  const session: DemoSession = {
    identifier,
    displayName: identifier.includes("@")
      ? identifier.split("@")[0]
      : identifier,
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
