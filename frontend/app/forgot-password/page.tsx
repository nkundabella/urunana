import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";
import SplitAuth from "@/components/SplitAuth";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import styles from "./forgot-password.module.css";

export const metadata = {
  title: "Gusubiza Konti — Urunana",
  description: "Wibagiwe ijambobanga? Ohereza ihuzo ryo gushyiraho irindi jambobanga.",
};

export default function ForgotPasswordPage() {
  return (
    <div className={styles.page}>
      <WovenStrip />
      <Header variant="C" />
      <main className={styles.main}>
        <SplitAuth
          fit
          portraitSplit
          imageSide="left"
          imageLayout="cover"
          imagePosition="center 52%"
          imageSrc="/assets/patchwork.jpg"
          imageAlt="Imyenda gakondo y'umuco"
          caption={{
            title: "Ntugire impungenge.",
            sub: "Tuzakohereza ihuzo ryo gushyiraho irindi jambobanga.",
          }}
          form={<ForgotPasswordForm />}
        />
      </main>
      <Footer />
    </div>
  );
}
