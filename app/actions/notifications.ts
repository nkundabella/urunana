"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markNotificationAsReadAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { error: "Failed to mark notification as read." };
  }
}

export async function markAllNotificationsAsReadAction() {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { error: "Failed to mark all notifications as read." };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch {
    return { error: "Failed to delete notification." };
  }
}

