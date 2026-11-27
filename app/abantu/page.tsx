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
          <p className={styles.eyebrow}>KALISA MUGISHA</p>
          <h1 className={styles.title}>Abantu</h1>
          <Suspense fallback={null}>
            <PeopleListView />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
