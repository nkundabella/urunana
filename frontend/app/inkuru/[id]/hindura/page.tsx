import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import PageHero from "@/components/PageHero";
import PublishEditor from "@/components/PublishEditor";
import { serverApiFetch } from "@/lib/api";
import type { PostDto, TopicCategoryDto } from "@/lib/api-types";
import styles from "./hindura.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const cookieHeader = (await headers()).get("cookie");
  try {
    const { post } = await serverApiFetch<{ post: PostDto }>(
      `/api/v1/posts/${encodeURIComponent(id)}`,
      cookieHeader
    );
    return {
      title: `Hindura: ${post.title} — Urunana`,
      description: "Hindura inkuru yawe kuri Urunana.",
    };
  } catch {
    return {
      title: "Hindura Inkuru — Urunana",
      description: "Hindura inkuru yawe kuri Urunana.",
    };
  }
}

export default async function HinduraInkuruPage({ params }: Props) {
  const { id } = await params;
  const cookieHeader = (await headers()).get("cookie");

  let post: PostDto | null = null;
  let categories: TopicCategoryDto[] = [];

  try {
    const [postRes, catRes] = await Promise.all([
      serverApiFetch<{ post: PostDto }>(
        `/api/v1/posts/${encodeURIComponent(id)}`,
        cookieHeader
      ),
      serverApiFetch<{ categories: TopicCategoryDto[] }>(
        "/api/v1/categories",
        cookieHeader
      ).catch(() => ({ categories: [] })),
    ]);
    post = postRes.post;
    categories = catRes.categories;
  } catch {
    notFound();
  }

  const isPublished = post.status === "PUBLISHED";

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <PageHero
          eyebrow={isPublished ? "HINDURA INYANDIKO" : "INYANDIKO ITARATANGAZWA"}
          title={isPublished ? "Hindura inkuru yawe" : "Komeza wandike inkuru yawe"}
          notice={
            isPublished
              ? 'Iyi nyandiko yatangajwe. Impinduka zawe zizongeraho ikimenyetso "Byavuguruwe" n\'itariki.'
              : undefined
          }
          lead="Andika inkuru, ijambo cyangwa umugani wumvise mu muryango."
        />
        <PublishEditor
          initialPost={post}
          initialCategories={categories}
          submitLabel={isPublished ? "Bika impinduka" : "Tangaza"}
        />
      </main>
      <Footer />
    </div>
  );
}
