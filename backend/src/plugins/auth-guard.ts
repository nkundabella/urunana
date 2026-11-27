import type { FastifyReply, FastifyRequest } from "fastify";
import { AccountStatus, UserRole } from "../generated/prisma/client.js";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export const SAFE_USER_SELECT = {
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
  verifiedAt: true,
  createdAt: true,
} as const;

export type SafeUser = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  emailOrPhone: string | null;
  role: UserRole;
  isModerator: boolean;
  preferredLanguage: string;
  isFoundingContributor: boolean;
  foundingJoinDate: Date | null;
  accountStatus: AccountStatus;
  statedAgeBand: string;
  profilePhotoUrl: string | null;
  areasOfInterest: string[];
  researchUseConsent: boolean;
  communityRulesAccepted: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
};

declare module "fastify" {
  interface FastifyRequest {
    authUser?: SafeUser | null;
  }
}

export async function resolveAuthUser(
  request: FastifyRequest
): Promise<SafeUser | null> {
  if (request.authUser !== undefined) {
    return request.authUser;
  }

  const token = request.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    request.authUser = null;
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload?.userId) {
    request.authUser = null;
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: SAFE_USER_SELECT,
  });

  if (
    !user ||
    user.accountStatus === AccountStatus.SUSPENDED ||
    user.accountStatus === AccountStatus.GHOST
  ) {
    request.authUser = null;
    return null;
  }

  request.authUser = user;
  return user;
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = await resolveAuthUser(request);
  if (!user) {
    return reply.code(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Banza winjire muri konti yawe.",
      },
    });
  }
}

export async function requireAdminOrMod(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = await resolveAuthUser(request);
  if (!user) {
    return reply.code(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Banza winjire muri konti yawe.",
      },
    });
  }
  if (user.role !== UserRole.ADMIN && !user.isModerator) {
    return reply.code(403).send({
      error: {
        code: "FORBIDDEN",
        message: "Nta burenganzira ufite kuri iki gikorwa.",
      },
    });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = await resolveAuthUser(request);
  if (!user) {
    return reply.code(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Banza winjire muri konti yawe.",
      },
    });
  }
  if (user.role !== UserRole.ADMIN) {
    return reply.code(403).send({
      error: {
        code: "FORBIDDEN",
        message: "Ubuyobozi bukuru gusa ni bwo bufite uburenganzira kuri iki gikorwa.",
      },
    });
  }
}
