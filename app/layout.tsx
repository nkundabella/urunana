import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

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

  return (
    <html lang="rw" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fbfbf9] text-stone-900 antialiased font-sans">
        <Navbar currentUser={currentUser} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
