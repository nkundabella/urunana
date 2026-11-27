import { headers } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import PageHero from "@/components/PageHero";
import PublishEditor from "@/components/PublishEditor";
import { serverApiFetch } from "@/lib/api";
import type { TopicCategoryDto } from "@/lib/api-types";
import styles from "./kwandika.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kwandika Inkuru — Urunana",
  description: "Andika inkuru, ijambo cyangwa umugani wumvise mu muryango.",
};

export default async function KwandikaPage() {
  const cookieHeader = (await headers()).get("cookie");
  let categories: TopicCategoryDto[] = [];
  try {
    const res = await serverApiFetch<{ categories: TopicCategoryDto[] }>(
      "/api/v1/categories",
      cookieHeader
    );
    categories = res.categories;
  } catch {
    categories = [];
  }

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <PageHero
          eyebrow="KWANDIKA INKURU"
          title="Tangaza ubumenyi bwawe"
          lead="Andika inkuru, ijambo cyangwa umugani wumvise mu muryango."
        />
        <PublishEditor initialCategories={categories} />
      </main>
      <Footer />
    </div>
  );
}
