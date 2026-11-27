import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import ReportIssueForm from "@/components/ReportIssueForm";
import styles from "./menyesha.module.css";

export const metadata = {
  title: "Menyesha ikibazo — Urunana",
  description: "Raporo yawe igera ku bayobozi. Nta wundi uzayibona.",
};

export default function MenyeshaPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="A" />
      <main className={styles.backdrop}>
        <Suspense fallback={null}>
          <ReportIssueForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
