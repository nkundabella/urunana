import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import PageHero from "@/components/PageHero";
import PublishEditor from "@/components/PublishEditor";
import storiesData from "@/src/data/stories.json";
import type { StoryItem } from "@/components/StoryCard";
import type { PostStatus } from "@/lib/store";
import styles from "./hindura.module.css";

type StoryRecord = StoryItem & {
  status?: PostStatus;
};

type Props = {
  params: Promise<{ id: string }>;
};

const DEFAULT_BODY =
  "Mu mateka y'u Rwanda rwo hambere, Umwami Ruganzu II Ndoli yibukwa nk'intwari yagaruye ingoma nyuma y'imyaka myinshi y'akaga n'amacakubiri. Avuye i Karagwe aho yari yarahungiye kwa nyirasenge Nyabunyana, yagarutse mu Rwanda afite icyerekezo cyo kongera guhuza abaturage.\n\nInkuru n'ibitekerezo by'abakurambere bigaragaza ko ubutwari bwe butari bushingiye ku rugamba gusa, ahubwo no ku buhanga bwo kunga imiryango, kubaka ubufatanye n'ibiganiro by'umuco byasigaye mu migani n'indirimbo kugeza uyu munsi.";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const stories = storiesData as StoryItem[];
  const story =
    stories.find((s) => s.slug === id || s.id === id) ?? stories[0];
  return {
    title: `Hindura: ${story.title} — Urunana`,
    description: "Hindura inkuru yawe kuri Urunana.",
  };
}

export default async function HinduraInkuruPage({ params }: Props) {
  const { id } = await params;
  const stories = storiesData as StoryRecord[];
  const matched = stories.find((s) => s.slug === id || s.id === id);

  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.main}>
        <PageHero
          eyebrow="HINDURA INYANDIKO"
          title="Hindura inkuru yawe"
          notice={
            'Iyi nyandiko yatangajwe. Impinduka zawe zizongeraho ikimenyetso "Byavuguruwe" n\'itariki.'
          }
          lead="Andika inkuru, ijambo cyangwa umugani wumvise mu muryango."
        />
        <PublishEditor
          storySlug={matched ? matched.slug : id}
          postStatus={matched ? (matched.status ?? "published") : "draft"}
          initialValues={
            matched
              ? {
                  title: matched.title,
                  body: DEFAULT_BODY,
                  contentType: "Inkuru (Story)",
                  sources: ["Family story / oral tradition"],
                  topics: ["History & heritage"],
                  language: "Ikinyarwanda",
                }
              : undefined
          }
          submitLabel={matched ? "Bika impinduka" : "Tangaza"}
        />
      </main>
      <Footer />
    </div>
  );
}
