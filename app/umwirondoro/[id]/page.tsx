import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import ProfileView, { type ProfileData } from "@/components/ProfileView";
import profilesData from "@/src/data/profiles.json";
import storiesData from "@/src/data/stories.json";
import type { StoryItem } from "@/components/StoryCard";
import styles from "./profile.module.css";

type StoryRecord = StoryItem & {
  saved?: boolean;
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const profiles = profilesData as ProfileData[];
  const profile =
    profiles.find((p) => p.id === id) ?? profiles[0];
  return {
    title: `${profile.name} — Urunana`,
    description: profile.bio,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const profiles = profilesData as ProfileData[];
  const stories = storiesData as StoryRecord[];

  const matched = profiles.find((p) => p.id === id);
  const profile: ProfileData = matched ?? {
    id,
    name: "Kalisa Mugisha",
    badge: "Umwanditsi Washinze (Founding Contributor)",
    bio: "[Incamake y'umwanditsi]",
    interests: ["Amateka n'Umurage", "Imigani"],
    followers: null,
    following: null,
  };

  const authoredAll = stories.filter((s) => s.author === profile.name);
  // Display up to 2 cards cleanly by default matching the reference layout
  const authoredStories =
    authoredAll.length > 0 ? authoredAll.slice(0, 2) : stories.slice(0, 2);
  const savedStories = stories.filter((s) => s.saved);

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
        <ProfileView
          profile={profile}
          authoredStories={authoredStories}
          savedStories={savedStories}
        />
      </main>
      <Footer />
    </div>
  );
}
