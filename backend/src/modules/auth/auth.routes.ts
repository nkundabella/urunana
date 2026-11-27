import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import {
  AccountStatus,
  AuthTokenType,
  UserRole,
} from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "../../lib/auth.js";
import { mailer } from "../../lib/mailer.js";
import { prisma } from "../../lib/prisma.js";
import {
  requireAuth,
  resolveAuthUser,
  SAFE_USER_SELECT,
  type SafeUser,
} from "../../plugins/auth-guard.js";

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_OTP_ATTEMPTS = 5;
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function generateSixDigitOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

function generateUsernameBase(displayName: string, identifier: string): string {
  const source = displayName || identifier.split("@")[0] || "umwanditsi";
  const base = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return base || `user_${Date.now().toString(36)}`;
}

async function issueSessionCookie(reply: FastifyReply, user: SafeUser) {
  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isModerator: user.isModerator,
    isFoundingContributor: user.isFoundingContributor,
    accountStatus: user.accountStatus,
    preferredLanguage: user.preferredLanguage,
  });

  reply.setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: env.IS_COOKIE_SECURE,
  });
}

const registerSchema = z.object({
  identifier: z.string().trim().min(3, "Imeri cyangwa telefoni birakenewe.").max(160),
  displayName: z.string().trim().min(2, "Izina ry'urubuga rirakenewe.").max(80),
  username: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_.-]+$/)
    .optional(),
  password: z
    .string()
    .min(6, "Ijambobanga rigomba kuba nibura inyuguti 6.")
    .max(128),
  preferredLanguage: z.enum(["rw", "en", "fr"]).default("rw"),
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Ugomba kwemeza ko ufite nibura imyaka 13." }),
  }),
  rulesAccepted: z.literal(true, {
    errorMap: () => ({ message: "Ugomba kwemera Amategeko y'Umuryango." }),
  }),
  inviteCode: z.string().trim().max(64).optional(),
});

const verifySchema = z.object({
  identifier: z.string().trim().min(2),
  code: z.string().trim().regex(/^\d{6}$/, "Kode igomba kuba imibare 6."),
});

const resendOtpSchema = z.object({
  identifier: z.string().trim().min(2),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Imeri cyangwa izina ry'urubuga birakenewe."),
  password: z.string().min(1, "Ijambobanga rirakenewe."),
});

const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(2, "Imeri cyangwa telefoni birakenewe."),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(16, "Ihuzo ryo gusubiza ijambobanga ntiryemewe."),
  newPassword: z
    .string()
    .min(6, "Ijambobanga rigomba kuba nibura inyuguti 6.")
    .max(128),
});

const updateLanguageSchema = z.object({
  language: z.enum(["rw", "en", "fr"]),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/register
  app.post(
    "/api/v1/auth/register",
    { config: { rateLimit: { max: 15, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hari amakuru atuzuye neza.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const {
        identifier,
        displayName,
        username: requestedUsername,
        password,
        preferredLanguage,
        inviteCode,
      } = parsed.data;

      const normalizedIdentifier = identifier.toLowerCase();

      const existingByIdentifier = await prisma.user.findFirst({
        where: {
          emailOrPhone: { equals: normalizedIdentifier, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (existingByIdentifier) {
        return reply.code(409).send({
          error: {
            code: "IDENTIFIER_TAKEN",
            message: "Iyo imeri cyangwa telefoni isanzwe ikoreshwa.",
          },
        });
      }

      let candidateUsername = requestedUsername
        ? requestedUsername.toLowerCase()
        : generateUsernameBase(displayName, normalizedIdentifier);

      if (requestedUsername) {
        const existingUsername = await prisma.user.findFirst({
          where: { username: { equals: candidateUsername, mode: "insensitive" } },
          select: { id: true },
        });
        if (existingUsername) {
          return reply.code(409).send({
            error: {
              code: "USERNAME_TAKEN",
              message: "Iryo zina ry'urubuga risanzwe rikoreshwa.",
            },
          });
        }
      } else {
        let suffix = 1;
        while (
          await prisma.user.findFirst({
            where: {
              username: { equals: candidateUsername, mode: "insensitive" },
            },
            select: { id: true },
          })
        ) {
          suffix += 1;
          candidateUsername = `${generateUsernameBase(displayName, normalizedIdentifier)}_${suffix}`;
        }
      }

      const passwordHash = await hashPassword(password);
      const otp = generateSixDigitOtp();
      const otpHash = sha256(otp);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

      try {
        const user = await prisma.$transaction(async (tx) => {
          let isFounding = false;

          if (inviteCode && inviteCode.length > 0) {
            const codeRecord = await tx.foundingInviteCode.findUnique({
              where: { code: inviteCode },
            });
            if (!codeRecord || codeRecord.usedById !== null) {
              throw new Error("INVALID_INVITE_CODE");
            }
            isFounding = true;
          }

          const created = await tx.user.create({
            data: {
              username: candidateUsername,
              displayName,
              emailOrPhone: normalizedIdentifier,
              passwordHash,
              role: UserRole.USER,
              preferredLanguage,
              isFoundingContributor: isFounding,
              foundingJoinDate: isFounding ? now : null,
              accountStatus: AccountStatus.ACTIVE,
              statedAgeBand: "13+",
              communityRulesAccepted: true,
              communityRulesAcceptedAt: now,
              verifiedAt: null,
            },
            select: SAFE_USER_SELECT,
          });

          if (inviteCode && inviteCode.length > 0) {
            const claimed = await tx.foundingInviteCode.updateMany({
              where: { code: inviteCode, usedById: null },
              data: { usedById: created.id, usedAt: now },
            });
            if (claimed.count !== 1) {
              throw new Error("INVALID_INVITE_CODE");
            }
          }

          await tx.authToken.create({
            data: {
              userId: created.id,
              identifier: normalizedIdentifier,
              type: AuthTokenType.EMAIL_VERIFY,
              codeHash: otpHash,
              expiresAt,
              attempts: 0,
            },
          });

          return created;
        });

        await mailer.sendVerificationOtp(normalizedIdentifier, otp);

        return reply.code(201).send({
          user,
          verificationRequired: true,
        });
      } catch (err) {
        if (err instanceof Error && err.message === "INVALID_INVITE_CODE") {
          return reply.code(400).send({
            error: {
              code: "INVALID_INVITE_CODE",
              message: "Kode y'ubutumire ntiyemewe cyangwa yarakoreshejwe.",
            },
          });
        }
        throw err;
      }
    }
  );

  // POST /api/v1/auth/verify
  app.post(
    "/api/v1/auth/verify",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = verifySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Andika kode y'imibare 6 yemewe.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const normalizedIdentifier = parsed.data.identifier.toLowerCase();
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { emailOrPhone: { equals: normalizedIdentifier, mode: "insensitive" } },
            { username: { equals: normalizedIdentifier, mode: "insensitive" } },
          ],
        },
        select: SAFE_USER_SELECT,
      });

      if (!user) {
        return reply.code(400).send({
          error: {
            code: "INVALID_CODE",
            message: "Kode yo kwemeza si yo cyangwa yararengeje igihe.",
          },
        });
      }

      const token = await prisma.authToken.findFirst({
        where: {
          userId: user.id,
          type: AuthTokenType.EMAIL_VERIFY,
          usedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });

      if (!token) {
        return reply.code(400).send({
          error: {
            code: "INVALID_CODE",
            message: "Nta kode iriho. Saba ko yongera yoherezwa.",
          },
        });
      }

      if (token.attempts >= MAX_OTP_ATTEMPTS) {
        return reply.code(429).send({
          error: {
            code: "TOO_MANY_ATTEMPTS",
            message:
              "Wagerageje kenshi birenze urugero. Saba kode nshya.",
            attempts: token.attempts,
            maxAttempts: MAX_OTP_ATTEMPTS,
          },
        });
      }

      const now = new Date();
      if (token.expiresAt < now) {
        return reply.code(400).send({
          error: {
            code: "CODE_EXPIRED",
            message: "Kode yararengeje igihe. Ongera usabe indi.",
          },
        });
      }

      const incomingHash = sha256(parsed.data.code);
      if (!timingSafeHexEqual(incomingHash, token.codeHash)) {
        const updatedToken = await prisma.authToken.update({
          where: { id: token.id },
          data: { attempts: { increment: 1 } },
          select: { attempts: true },
        });
        const remaining = Math.max(0, MAX_OTP_ATTEMPTS - updatedToken.attempts);
        return reply.code(400).send({
          error: {
            code: "INVALID_CODE",
            message:
              remaining > 0
                ? `Kode si yo. Usigaje kugerageza inshuro ${remaining}.`
                : "Wagerageje kenshi birenze urugero. Saba kode nshya.",
            attempts: updatedToken.attempts,
            remainingAttempts: remaining,
          },
        });
      }

      const verifiedUser = await prisma.$transaction(async (tx) => {
        await tx.authToken.update({
          where: { id: token.id },
          data: { usedAt: now },
        });
        return tx.user.update({
          where: { id: user.id },
          data: { verifiedAt: user.verifiedAt ?? now },
          select: SAFE_USER_SELECT,
        });
      });

      await issueSessionCookie(reply, verifiedUser);

      return reply.code(200).send({
        user: verifiedUser,
      });
    }
  );

  // POST /api/v1/auth/resend-otp
  app.post(
    "/api/v1/auth/resend-otp",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const parsed = resendOtpSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Imeri cyangwa telefoni birakenewe.",
          },
        });
      }

      const normalizedIdentifier = parsed.data.identifier.toLowerCase();
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { emailOrPhone: { equals: normalizedIdentifier, mode: "insensitive" } },
            { username: { equals: normalizedIdentifier, mode: "insensitive" } },
          ],
        },
        select: { id: true, emailOrPhone: true, verifiedAt: true },
      });

      if (user && !user.verifiedAt) {
        const otp = generateSixDigitOtp();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

        await prisma.$transaction(async (tx) => {
          await tx.authToken.updateMany({
            where: {
              userId: user.id,
              type: AuthTokenType.EMAIL_VERIFY,
              usedAt: null,
            },
            data: { usedAt: now },
          });
          await tx.authToken.create({
            data: {
              userId: user.id,
              identifier: user.emailOrPhone ?? normalizedIdentifier,
              type: AuthTokenType.EMAIL_VERIFY,
              codeHash: sha256(otp),
              expiresAt,
              attempts: 0,
            },
          });
        });

        await mailer.sendVerificationOtp(
          user.emailOrPhone ?? normalizedIdentifier,
          otp
        );
      }

      return reply.code(200).send({
        ok: true,
        message: "Kode nshya yoherejwe.",
      });
    }
  );

  // POST /api/v1/auth/login
  app.post(
    "/api/v1/auth/login",
    { config: { rateLimit: { max: 15, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Uzuza imeri cyangwa izina ry'urubuga n'ijambobanga.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const normalized = parsed.data.identifier.toLowerCase();
      const userWithHash = await prisma.user.findFirst({
        where: {
          OR: [
            { emailOrPhone: { equals: normalized, mode: "insensitive" } },
            { username: { equals: normalized, mode: "insensitive" } },
          ],
        },
        select: {
          ...SAFE_USER_SELECT,
          passwordHash: true,
        },
      });

      if (!userWithHash || !userWithHash.passwordHash) {
        return reply.code(401).send({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Imeri/izina ry'urubuga cyangwa ijambobanga si byo.",
          },
        });
      }

      const validPassword = await verifyPassword(
        parsed.data.password,
        userWithHash.passwordHash
      );
      if (!validPassword) {
        return reply.code(401).send({
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Imeri/izina ry'urubuga cyangwa ijambobanga si byo.",
          },
        });
      }

      if (
        userWithHash.accountStatus === AccountStatus.SUSPENDED ||
        userWithHash.accountStatus === AccountStatus.GHOST
      ) {
        return reply.code(403).send({
          error: {
            code: "ACCOUNT_SUSPENDED",
            message: "Konti yawe yahagaritswe. Vugisha ubuyobozi bwa Urunana.",
          },
        });
      }

      if (!userWithHash.verifiedAt) {
        return reply.code(403).send({
          error: {
            code: "ACCOUNT_NOT_VERIFIED",
            message: "Banza wemeze konti yawe ukoresheje kode wohererejwe.",
          },
        });
      }

      const { passwordHash: _passwordHash, ...safeUser } = userWithHash;
      void _passwordHash;

      await issueSessionCookie(reply, safeUser);

      return reply.code(200).send({ user: safeUser });
    }
  );

  // POST /api/v1/auth/logout
  app.post("/api/v1/auth/logout", async (_request, reply) => {
    reply.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: env.IS_COOKIE_SECURE,
    });
    return reply.code(200).send({ ok: true });
  });

  // GET /api/v1/auth/me
  app.get("/api/v1/auth/me", async (request, reply) => {
    const user = await resolveAuthUser(request);
    if (!user) {
      return reply.code(200).send({
        user: null,
        unreadNotificationCount: 0,
      });
    }

    const unreadNotificationCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return reply.code(200).send({
      user,
      unreadNotificationCount,
    });
  });

  // POST /api/v1/auth/forgot-password (always generic 200 to prevent enumeration)
  app.post(
    "/api/v1/auth/forgot-password",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const parsed = forgotPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Imeri cyangwa telefoni birakenewe.",
          },
        });
      }

      const normalized = parsed.data.identifier.toLowerCase();
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { emailOrPhone: { equals: normalized, mode: "insensitive" } },
            { username: { equals: normalized, mode: "insensitive" } },
          ],
          accountStatus: {
            notIn: [AccountStatus.SUSPENDED, AccountStatus.GHOST],
          },
        },
        select: { id: true, emailOrPhone: true },
      });

      if (user) {
        const rawToken = crypto.randomBytes(24).toString("hex");
        const now = new Date();
        const expiresAt = new Date(now.getTime() + RESET_TTL_MS);

        await prisma.$transaction(async (tx) => {
          await tx.authToken.updateMany({
            where: {
              userId: user.id,
              type: AuthTokenType.PASSWORD_RESET,
              usedAt: null,
            },
            data: { usedAt: now },
          });
          await tx.authToken.create({
            data: {
              userId: user.id,
              identifier: user.emailOrPhone ?? normalized,
              type: AuthTokenType.PASSWORD_RESET,
              codeHash: sha256(rawToken),
              expiresAt,
              attempts: 0,
            },
          });
        });

        await mailer.sendPasswordReset(
          user.emailOrPhone ?? normalized,
          rawToken
        );
      }

      return reply.code(200).send({
        ok: true,
        message:
          "Niba konti ihari, ihuzo ryo gushyiraho irindi jambobanga ryoherejwe.",
      });
    }
  );

  // POST /api/v1/auth/reset-password
  app.post(
    "/api/v1/auth/reset-password",
    { config: { rateLimit: { max: 15, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const parsed = resetPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Uzuza ihuzo n'ijambobanga rishya (nibura inyuguti 6).",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const tokenHash = sha256(parsed.data.token);
      const now = new Date();

      const tokenRecord = await prisma.authToken.findFirst({
        where: {
          codeHash: tokenHash,
          type: AuthTokenType.PASSWORD_RESET,
          usedAt: null,
          expiresAt: { gt: now },
        },
      });

      if (!tokenRecord) {
        return reply.code(400).send({
          error: {
            code: "INVALID_OR_EXPIRED_TOKEN",
            message:
              "Ihuzo ryo gusubiza ijambobanga ntiryemewe cyangwa ryararengeje igihe.",
          },
        });
      }

      const nextHash = await hashPassword(parsed.data.newPassword);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: tokenRecord.userId },
          data: { passwordHash: nextHash },
        });
        await tx.authToken.update({
          where: { id: tokenRecord.id },
          data: { usedAt: now },
        });
      });

      return reply.code(200).send({
        ok: true,
        message: "Ijambobanga ryawe ryahinduwe neza. Ushobora kwinjira ubu.",
      });
    }
  );

  // PATCH /api/v1/users/me/language
  app.patch(
    "/api/v1/users/me/language",
    { preHandler: requireAuth },
    async (request, reply) => {
      const parsed = updateLanguageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Hitamo ururimi rwemewe (rw, en, fr).",
          },
        });
      }

      const currentUser = request.authUser!;
      const updated = await prisma.user.update({
        where: { id: currentUser.id },
        data: { preferredLanguage: parsed.data.language },
        select: SAFE_USER_SELECT,
      });

      await issueSessionCookie(reply, updated);

      return reply.code(200).send({
        preferredLanguage: updated.preferredLanguage,
        user: updated,
      });
    }
  );
}
