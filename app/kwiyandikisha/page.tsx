import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import SplitAuth from "@/components/SplitAuth";
import RegisterForm from "@/components/RegisterForm";
import styles from "./kwiyandikisha.module.css";

export const metadata = {
  title: "Kwiyandikisha — Urunana",
  description: "Fungura konti nshya ya Urunana.",
};

export default function KwiyandikishaPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="C" />
      <main className={styles.main}>
        <SplitAuth
          imageSide="left"
          imageLayout="clusters"
          imageSrc="/assets/maroon-baskets.jpg"
          imageAlt="Agaseke gatukura — ubukoranyi bwa Rwanda"
          caption={{
            eyebrow: "ABISHYIZE HAMWE",
            title: "Injira mu muryango w'abanditsi n'abakunda umuco.",
          }}
          form={<RegisterForm />}
        />
      </main>
      <Footer />
    </div>
  );
}
