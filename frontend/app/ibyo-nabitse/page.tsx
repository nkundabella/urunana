import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import SavedStoriesView from "@/components/SavedStoriesView";
import { serverApiFetch } from "@/lib/api";
import type { BookmarksResponse } from "@/lib/api-types";
import styles from "./ibyo-nabitse.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ibyo Nabitse — Urunana",
  description: "Ibyo wabitse byose biri hano, ubisomere igihe cyose.",
};

export default async function IbyoNabitsePage() {
  const cookieHeader = (await headers()).get("cookie");
  let initialData: BookmarksResponse = {
    savedPosts: [],
    followingPosts: [],
    drafts: [],
  };

  try {
    initialData = await serverApiFetch<BookmarksResponse>(
      "/api/v1/bookmarks",
      cookieHeader
    );
  } catch {
    initialData = { savedPosts: [], followingPosts: [], drafts: [] };
  }

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="B" />
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>IBYO NABITSE</p>
          <h1 className={styles.title}>Inkuru wabitse</h1>
          <p className={styles.lead}>
            Ibyo wabitse byose biri hano, ubisomere igihe cyose.
          </p>
          <SavedStoriesView initialData={initialData} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
