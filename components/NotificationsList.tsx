"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
} from "@/app/actions/notifications";
import { NotificationType } from "@/generated/prisma/client";
import {
  MessageSquare,
  UserCheck,
  BookOpen,
  ShieldAlert,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  Sparkles,
  Inbox,
  CornerDownRight,
} from "lucide-react";

export interface FormattedNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  targetHref: string | null;
  actor?: {
    username: string;
    displayName: string;
  } | null;
}

interface NotificationsListProps {
  initialNotifications: FormattedNotification[];
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ubu";
  if (mins < 60) return `min ${mins}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `amasaha ${hours}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `iminsi ${days}`;
  return new Date(date).toLocaleDateString("rw-RW", {
    month: "short",
    day: "numeric",
  });
}

function getIconForType(type: NotificationType) {
  switch (type) {
    case "COMMENT":
      return <MessageSquare className="w-4 h-4 text-emerald-700" />;
    case "REPLY":
      return <CornerDownRight className="w-4 h-4 text-teal-700" />;
    case "FOLLOW":
      return <UserCheck className="w-4 h-4 text-blue-700" />;
    case "NEW_PUBLICATION":
      return <BookOpen className="w-4 h-4 text-amber-700" />;
    case "MODERATION_ACTION":
      return <ShieldAlert className="w-4 h-4 text-rose-700" />;
    case "SYSTEM":
    default:
      return <Bell className="w-4 h-4 text-stone-700" />;
  }
}

export default function NotificationsList({
  initialNotifications,
}: NotificationsListProps) {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<FormattedNotification[]>(initialNotifications);
  const [tab, setTab] = useState<"ALL" | "UNREAD">("ALL");
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const displayedNotifications =
    tab === "UNREAD" ? notifications.filter((n) => !n.isRead) : notifications;

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await markNotificationAsReadAction(id);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsAsReadAction();
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotificationAction(id);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleItemClick(notif: FormattedNotification) {
    if (!notif.isRead) {
      await handleMarkRead(notif.id);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Controls: Tabs & Mark All as Read */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        {/* Tabs */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              tab === "ALL"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            Byose ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("UNREAD")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              tab === "UNREAD"
                ? "bg-emerald-800 text-white shadow-2xs"
                : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <span>Izitarasomwa</span>
            {unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  tab === "UNREAD"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Mark All Read Action */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition shadow-2xs self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Soma Byose ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {displayedNotifications.length > 0 ? (
        <div className="divide-y divide-stone-100 border border-stone-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs">
          {displayedNotifications.map((notif) => {
            const rowContent = (
              <div
                className={`group flex items-start gap-4 p-4 sm:p-5 transition ${
                  !notif.isRead
                    ? "bg-emerald-50/40 border-l-4 border-l-emerald-800"
                    : "hover:bg-stone-50/70 border-l-4 border-l-transparent"
                }`}
              >
                {/* Icon Circle */}
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 mt-0.5 border border-stone-200/60 shadow-2xs">
                  {getIconForType(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm ${
                        !notif.isRead
                          ? "font-semibold text-stone-900"
                          : "font-medium text-stone-700"
                      }`}
                    >
                      {notif.title}
                    </h3>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="flex items-center space-x-1 text-[10px] text-stone-400">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(notif.createdAt)}</span>
                      </span>

                      {!notif.isRead && (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-800"
                          title="Iki gitabo ntigirasomwa"
                        />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.targetHref && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-emerald-800 group-hover:underline inline-flex items-center space-x-1">
                        <span>Fungura ubutumwa →</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover Actions: Mark Read + Delete */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkRead(notif.id);
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-800 hover:bg-stone-100 transition"
                      title="Shyira mu byasomwe"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(notif.id);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition"
                    title="Siba ubu butumwa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );

            return notif.targetHref ? (
              <Link
                key={notif.id}
                href={notif.targetHref}
                onClick={() => handleItemClick(notif)}
                className="block"
              >
                {rowContent}
              </Link>
            ) : (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className="cursor-pointer"
              >
                {rowContent}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-stone-200/80 rounded-2xl space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              {tab === "UNREAD"
                ? "Nta butumwa butarasomwa uhasanzemo"
                : "Nta butumwa urabona kuri ubu"}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              Igihe abandi basomye inkuru zawe, bagatanzeho ibitekerezo cyangwa
              bagukurikiye, amakuru azaza ahangaha.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

