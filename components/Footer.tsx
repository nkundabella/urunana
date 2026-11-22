import Link from "next/link";
import WovenStrip from "./WovenStrip";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.logo}>Urunana</p>
          <p className={styles.blurb}>
            Byubakiwe ijwi ry&apos;Abanyarwanda, bisangizwa isi yose
          </p>
        </div>
        <nav className={styles.links} aria-label="Amakuru y'ubufatanye">
          <Link href="/amategeko">Amategeko y&apos;Umuryango</Link>
          <Link href="/twandikire">Twandikire</Link>
        </nav>
      </div>
      <WovenStrip />
    </footer>
  );
}
