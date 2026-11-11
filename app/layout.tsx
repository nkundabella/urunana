import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Urunana — Ihuriro ry'Umuco, Ururimi, n'Umurage w'u Rwanda",
  description:
    "A community-driven digital platform for Rwandan culture, language, oral traditions, and heritage.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  let unreadCount = 0;
  if (currentUser) {
    unreadCount = await prisma.notification.count({
      where: {
        userId: currentUser.id,
        isRead: false,
      },
    });
  }

  return (
    <html lang="rw" className="h-full">
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#fbfbf9] text-stone-900 antialiased font-sans"
      >
        <Navbar currentUser={currentUser} unreadCount={unreadCount} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
