import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import NotificationsList, {
  FormattedNotification,
} from "@/components/NotificationsList";
import { Bell, Shield } from "lucide-react";

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/notifications");
  }

  // 1. Fetch raw notifications
  const rawNotifications = await prisma.notification.findMany({
    where: {
      userId: currentUser.id,
    },
    include: {
      actor: {
        select: {
          username: true,
          displayName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 2. Collect referenced entity IDs to batch resolve URLs
  const publicationIds = new Set<string>();
  const commentIds = new Set<string>();

  rawNotifications.forEach((n) => {
    if (n.entityType === "PUBLICATION" && n.entityId) {
      publicationIds.add(n.entityId);
    } else if (n.entityType === "COMMENT" && n.entityId) {
      commentIds.add(n.entityId);
    }
  });

  // Batch query publications
  const publicationMap = new Map<string, string>();
  if (publicationIds.size > 0) {
    const pubs = await prisma.publication.findMany({
      where: { id: { in: Array.from(publicationIds) } },
      select: { id: true, slug: true },
    });
    pubs.forEach((p) => publicationMap.set(p.id, p.slug));
  }

  // Batch query comments to get their parent publication slug
  const commentMap = new Map<string, string>();
  if (commentIds.size > 0) {
    const comments = await prisma.comment.findMany({
      where: { id: { in: Array.from(commentIds) } },
      select: {
        id: true,
        publication: {
          select: { slug: true },
        },
      },
    });
    comments.forEach((c) => {
      if (c.publication?.slug) {
        commentMap.set(c.id, c.publication.slug);
      }
    });
  }

  // 3. Format notifications with target links
  const formattedNotifications: FormattedNotification[] = rawNotifications.map(
    (n) => {
      let targetHref: string | null = null;

      if (n.type === "FOLLOW" && n.actor?.username) {
        targetHref = `/profile/${n.actor.username}`;
      } else if (n.entityType === "PUBLICATION" && n.entityId) {
        const slug = publicationMap.get(n.entityId);
        if (slug) targetHref = `/publications/${slug}#discussion`;
      } else if (n.entityType === "COMMENT" && n.entityId) {
        const pubSlug = commentMap.get(n.entityId);
        if (pubSlug) targetHref = `/publications/${pubSlug}#discussion`;
      }

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
        targetHref,
        actor: n.actor,
      };
    }
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Editorial Header */}
      <header className="space-y-2 border-b border-stone-200 pb-6">
        <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
          <Bell className="w-3.5 h-3.5" />
          <span>Ibiheruka kumenyeshwa</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 leading-tight">
          Ubutumwa n&apos;Amakuru
        </h1>
        <p className="font-serif text-sm sm:text-base text-stone-600 italic">
          Kumenyeshwa igihe abasomyi bashimye inkuru yawe, batanze ibitekerezo,
          cyangwa bakurikira ibyo wanditse.
        </p>
      </header>

      {/* Notifications list client component */}
      <NotificationsList initialNotifications={formattedNotifications} />
    </div>
  );
}

