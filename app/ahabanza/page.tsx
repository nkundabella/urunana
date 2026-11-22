import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WovenStrip from "@/components/WovenStrip";

export const metadata = {
  title: "Ahabanza — Urunana",
};

export default function AhabanzaPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <WovenStrip />
      <Header variant="A" />
      <main style={{ flex: 1, background: "var(--cream)" }} />
      <Footer />
    </div>
  );
}
