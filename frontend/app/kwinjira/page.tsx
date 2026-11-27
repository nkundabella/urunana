import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import SplitAuth from "@/components/SplitAuth";
import LoginForm from "@/components/LoginForm";
import styles from "./kwinjira.module.css";

export const metadata = {
  title: "Kwinjira — Urunana",
  description: "Injira muri konti yawe ya Urunana.",
};

export default function KwinjiraPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="C" />
      <main className={styles.main}>
        <SplitAuth
          fit
          imageSide="right"
          imageSrc="/assets/blue-baskets.jpg"
          imageAlt="Agaseke — ubukoranyi bwa Rwanda"
          caption={{
            title: "Ubike inkuru ukunda.",
            sub: "Kuri Urunana, ushobora kubika inkuru gakondo, imigani n'amateka.",
          }}
          form={<LoginForm />}
        />
      </main>
      <Footer />
    </div>
  );
}
