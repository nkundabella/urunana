import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import PageHero from "@/components/PageHero";
import SearchExplorer, { type SearchStory } from "@/components/SearchExplorer";
import storiesData from "@/src/data/stories.json";
import styles from "./gushakisha.module.css";

export const metadata = {
  title: "Gushakisha — Urunana",
  description:
    "Shakisha imigani, inyandiko n'inkuru zo mu muryango n'ubumenyi gakondo bw'u Rwanda.",
};

export default function GushakishaPage() {
  const stories = storiesData as SearchStory[];

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
          <SearchExplorer stories={stories} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
