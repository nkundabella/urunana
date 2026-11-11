"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  getCurrentUser,
} from "@/lib/auth";
import { AccountStatus, UserRole } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function registerAction(formData: FormData) {
  try {
    const username = (formData.get("username") as string)?.trim().toLowerCase();
    const displayName = (formData.get("displayName") as string)?.trim();
    const emailOrPhone = (formData.get("emailOrPhone") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const statedAgeBand = (formData.get("statedAgeBand") as string) || "18+";
    const preferredLanguage = (formData.get("preferredLanguage") as string) || "rw";
    const communityRulesAccepted = formData.get("communityRulesAccepted") === "on" || formData.get("communityRulesAccepted") === "true";

    // Validation
    if (!username || username.length < 3 || username.length > 30) {
      return { error: "Username must be between 3 and 30 characters." };
    }
    if (!displayName || displayName.length < 2) {
      return { error: "Please provide a valid display name." };
    }
    if (!emailOrPhone) {
      return { error: "Email or phone number is required." };
    }
    if (!password || password.length < 6) {
      return { error: "Password must be at least 6 characters." };
    }
    if (!communityRulesAccepted) {
      return { error: "You must accept the Community Rules to register (FR-AUTH-5)." };
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { emailOrPhone }],
      },
    });

    if (existing) {
      if (existing.username === username) {
        return { error: "This username is already taken." };
      }
      return { error: "An account with this email or phone number already exists." };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        emailOrPhone,
        passwordHash,
        role: UserRole.USER,
        preferredLanguage,
        statedAgeBand,
        communityRulesAccepted: true,
        communityRulesAcceptedAt: new Date(),
        accountStatus: AccountStatus.ACTIVE,
      },
    });

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

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred during registration." };
  }
}

export async function loginAction(formData: FormData) {
  try {
    const identifier = (formData.get("identifier") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!identifier || !password) {
      return { error: "Please enter your username/email and password." };
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { emailOrPhone: identifier }],
      },
    });

    if (!user || !user.passwordHash) {
      return { error: "Invalid credentials." };
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      return { error: "This account has been suspended due to community rule violations." };
    }

    if (user.accountStatus === AccountStatus.GHOST) {
      return { error: "This account has been closed." };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { error: "Invalid credentials." };
    }

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

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred during login." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  revalidatePath("/");
  return { success: true };
}

export async function updatePreferredLanguageAction(language: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  await prisma.user.update({
    where: { id: user.id },
    data: { preferredLanguage: language },
  });

  revalidatePath("/");
  return { success: true };
}

export async function acceptCommunityRulesAction() {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      communityRulesAccepted: true,
      communityRulesAcceptedAt: new Date(),
    },
  });

  revalidatePath("/");
  return { success: true };
}

/**
 * FR-AUTH-7 & FR-AUTH-8: Instant self-service account deletion converts account to Ghost Account.
 * Erases personal credentials and PII, disabling login, while preserving publications
 * and discussions for the collective cultural record.
 * Optionally files an automatic content removal request (14-day SLA).
 */
export async function deleteAccountToGhostAction(alsoRemoveContent: boolean = false) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  if (alsoRemoveContent) {
    await prisma.removalRequest.create({
      data: {
        userId: user.id,
        requesterIdentifier: user.emailOrPhone || user.username,
        notes: "Requested total permanent removal of all publications and comments during account deletion.",
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accountStatus: AccountStatus.GHOST,
      passwordHash: null,
      emailOrPhone: null,
      bio: null,
      profilePhotoUrl: null,
      displayName: `Ghost Contributor (${user.username})`,
      deletedAt: new Date(),
    },
  });

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  revalidatePath("/");
  return { success: true };
}

export async function updateAccountProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const displayName = (formData.get("displayName") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim() || null;
  const preferredLanguage = (formData.get("preferredLanguage") as string) || user.preferredLanguage;
  const researchUseConsent = formData.get("researchUseConsent") === "on" || formData.get("researchUseConsent") === "true";

  if (!displayName || displayName.length < 2) {
    return { error: "Amazina agomba kugira nibura inyuguti 2." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName,
      bio,
      preferredLanguage,
      researchUseConsent,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function changePasswordAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword) {
    return { error: "Shyiramo ijambobanga rya none n'irishya." };
  }

  if (newPassword.length < 6) {
    return { error: "Ijambobanga rishya rigomba kugira nibura inyuguti 6." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Amagambobanga mashya ntabwo asa." };
  }

  // Fetch full user with passwordHash
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!fullUser?.passwordHash) {
    return { error: "Konti yawe nta jambobanga ifite." };
  }

  const isMatch = await verifyPassword(currentPassword, fullUser.passwordHash);
  if (!isMatch) {
    return { error: "Ijambobanga rya none wanditse ntabwo ari ryo." };
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) {
    return { error: "Shyiramo imeri yawe." };
  }

  const existing = await prisma.user.findFirst({
    where: { emailOrPhone: email },
  });

  // For security, do not leak whether account exists or not
  if (!existing) {
    return { success: true, message: "Niba iyi meri iri muri sisitemu, ubutumwa bwo guhindura ijambobanga bwoherejwe." };
  }

  // In production, an email delivery service dispatches the token
  console.log(`[PASSWORD RESET] Token request for user: ${existing.username} (${existing.emailOrPhone})`);

  return { success: true, message: "Niba iyi meri iri muri sisitemu, ubutumwa bwo guhindura ijambobanga bwoherejwe." };
}

/**
 * FR-AUTH-8: Request permanent removal of publications and comments (14-day SLA).
 */
export async function requestPermanentContentRemovalAction(notes?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  await prisma.removalRequest.create({
    data: {
      userId: user.id,
      requesterIdentifier: user.emailOrPhone || user.username,
      notes: notes || "Requested permanent removal of all published content and comments.",
    },
  });

  return { success: true };
}



export async function saveOnboardingProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  const bio = (formData.get("bio") as string)?.trim() || null;
  const regionalRoots = (formData.get("regionalRoots") as string)?.trim() || null;
  const communityIntent = (formData.get("communityIntent") as string)?.trim() || null;
  const areasOfInterest = formData.getAll("areasOfInterest") as string[];

  // Append regional roots or intent into bio if provided
  let fullBio = bio;
  const additions: string[] = [];
  if (regionalRoots) additions.push(`📍 Inkomoko: ${regionalRoots}`);
  if (communityIntent) additions.push(`🎯 Intego: ${communityIntent}`);

  if (additions.length > 0) {
    fullBio = fullBio ? `${fullBio}\n\n${additions.join(" | ")}` : additions.join(" | ");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      bio: fullBio,
      areasOfInterest,
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true };
}
