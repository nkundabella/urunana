import { Suspense } from "react";
import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import PageHero from "@/components/PageHero";
import SearchExplorer from "@/components/SearchExplorer";
import { serverApiFetch } from "@/lib/api";
import type { PostsListResponse, TopicCategoryDto } from "@/lib/api-types";
import styles from "./gushakisha.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gushakisha — Urunana",
  description:
    "Shakisha imigani, inyandiko n'inkuru zo mu muryango n'ubumenyi gakondo bw'u Rwanda.",
};

export default async function GushakishaPage() {
  const cookieHeader = (await headers()).get("cookie");
  let initialCategories: TopicCategoryDto[] = [];
  let initialPosts: PostsListResponse["posts"] = [];
  let initialTotal = 0;

  try {
    const [catRes, postsRes] = await Promise.all([
      serverApiFetch<{ categories: TopicCategoryDto[] }>(
        "/api/v1/categories",
        cookieHeader
      ),
      serverApiFetch<PostsListResponse>("/api/v1/posts?limit=20", cookieHeader),
    ]);
    initialCategories = catRes.categories;
    initialPosts = postsRes.posts;
    initialTotal = postsRes.total;
  } catch {
    initialCategories = [];
    initialPosts = [];
    initialTotal = 0;
  }

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <PageHero
          eyebrow="UBUSHAKASHATSI N'UBUVANGANZO"
          title={
            <>
              Gushakisha mu Murage w&apos;Ururimi
              <br />
              n&apos;Umuco
            </>
          }
          lead="Shakisha imigani, inyandiko n'inkuru zo mu muryango n'ubumenyi gakondo bw'u Rwanda."
        />
        <Suspense fallback={null}>
          <SearchExplorer
            initialCategories={initialCategories}
            initialPosts={initialPosts}
            initialTotal={initialTotal}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
