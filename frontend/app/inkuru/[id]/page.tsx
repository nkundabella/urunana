import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import StoryDetailView from "@/components/StoryDetailView";
import { ApiError, serverApiFetch } from "@/lib/api";
import type { CommentsResponse, PostDto } from "@/lib/api-types";
import styles from "./story.module.css";

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
      title: `${post.title} — Urunana`,
      description: post.excerpt,
    };
  } catch {
    return {
      title: "Inkuru — Urunana",
      description: "Soma inkuru n'ibitekerezo kuri Urunana.",
    };
  }
}

export default async function StoryDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieHeader = (await headers()).get("cookie");

  let post: PostDto | null = null;
  let initialComments: CommentsResponse["comments"] = [];

  try {
    const [postRes, commentsRes] = await Promise.all([
      serverApiFetch<{ post: PostDto }>(
        `/api/v1/posts/${encodeURIComponent(id)}`,
        cookieHeader
      ),
      serverApiFetch<CommentsResponse>(
        `/api/v1/posts/${encodeURIComponent(id)}/comments`,
        cookieHeader
      ).catch(() => ({ comments: [], totalCount: 0 })),
    ]);
    post = postRes.post;
    initialComments = commentsRes.comments;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    notFound();
  }

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <div className={styles.patternBand} aria-hidden="true" />
      <main className={styles.main}>
        <StoryDetailView
          initialPost={post}
          initialComments={initialComments}
        />
      </main>
      <Footer />
    </div>
  );
}
