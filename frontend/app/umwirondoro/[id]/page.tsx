import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import ProfileView from "@/components/ProfileView";
import { serverApiFetch } from "@/lib/api";
import type { ProfileResponse } from "@/lib/api-types";
import styles from "./profile.module.css";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const cookieHeader = (await headers()).get("cookie");
  try {
    const data = await serverApiFetch<ProfileResponse>(
      `/api/v1/users/${encodeURIComponent(id)}`,
      cookieHeader
    );
    return {
      title: `${data.user.displayName} — Urunana`,
      description: data.user.bio || `Umwirondoro wa ${data.user.displayName} kuri Urunana.`,
    };
  } catch {
    return {
      title: "Umwirondoro — Urunana",
      description: "Umwirondoro w'umwanditsi kuri Urunana.",
    };
  }
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const cookieHeader = (await headers()).get("cookie");

  let profileData: ProfileResponse;
  try {
    profileData = await serverApiFetch<ProfileResponse>(
      `/api/v1/users/${encodeURIComponent(id)}`,
      cookieHeader
    );
  } catch {
    notFound();
  }

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <div className={styles.banner} aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src="/assets/bw-discs.jpg"
              alt=""
              className={styles.bannerTile}
            />
          ))}
        </div>
        <ProfileView initialData={profileData} />
      </main>
      <Footer />
    </div>
  );
}
