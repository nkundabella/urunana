import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AccountStatus, UserRole } from "@/generated/prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "urunana-dev-super-secret-jwt-key-2026-very-secure"
);

export const SESSION_COOKIE_NAME = "urunana_session";

export interface SessionPayload {
  userId: string;
  username: string;
  displayName: string;
  role: UserRole;
  isModerator: boolean;
  isFoundingContributor: boolean;
  accountStatus: AccountStatus;
  preferredLanguage: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      emailOrPhone: true,
      role: true,
      isModerator: true,
      preferredLanguage: true,
      isFoundingContributor: true,
      foundingJoinDate: true,
      accountStatus: true,
      statedAgeBand: true,
      profilePhotoUrl: true,
      areasOfInterest: true,
      researchUseConsent: true,
      communityRulesAccepted: true,
      createdAt: true,
    },
  });

  if (!user || user.accountStatus === AccountStatus.SUSPENDED) {
    return null;
  }

  return user;
}
