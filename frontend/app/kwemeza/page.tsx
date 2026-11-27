import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import SplitAuth from "@/components/SplitAuth";
import VerifyForm from "@/components/VerifyForm";
import styles from "./kwemeza.module.css";

export const metadata = {
  title: "Kwemeza Konti — Urunana",
  description: "Andika kode wohererejwe kugira ngo wemeze konti yawe ya Urunana.",
};

export default function KwemezaPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="C" />
      <main className={styles.main}>
        <SplitAuth
          fit
          imageSide="left"
          imageLayout="clusters"
          imageSrc="/assets/maroon-baskets.jpg"
          imageAlt="Agaseke gatukura — ubukoranyi bwa Rwanda"
          caption={{
            title: "Hafi kurangiza.",
            sub: "Emeza imeri cyangwa telefoni yawe kugira ngo urangize kwiyandikisha.",
          }}
          form={
            <Suspense fallback={null}>
              <VerifyForm />
            </Suspense>
          }
        />
      </main>
      <Footer />
    </div>
  );
}
