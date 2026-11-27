import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { AccountStatus, UserRole } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

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
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
