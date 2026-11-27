import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import PeopleListView from "@/components/PeopleListView";
import styles from "./abantu.module.css";

export const metadata = {
  title: "Abantu — Urunana",
  description: "Abagukurikira n'abo ukurikira kuri Urunana.",
};

export default function AbantuPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="B" />
      <main className={styles.main}>
        <div className={styles.container}>
          <Suspense fallback={null}>
            <PeopleListView eyebrowClassName={styles.eyebrow} titleClassName={styles.title} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
