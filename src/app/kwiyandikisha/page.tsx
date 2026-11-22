// src/app/kwiyandikisha/page.tsx
import "./kwiyandikisha.css";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function RegisterPage() {
  const [lang, setLang] = useState("rw"); // default Kinyarwanda

  // persist language pref
  useEffect(() => {
    const stored = localStorage.getItem("ui-lang");
    if (stored) setLang(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem("ui-lang", lang);
  }, [lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // mock: just log values
    const data = new FormData(e.currentTarget as HTMLFormElement);
    console.log(Object.fromEntries(data.entries()));
  };

  return (
    <>
      {/* Header variant C */}
      <header className="header header-c">
        <div className="logo">
          <h1>Urunana</h1>
          <span className="tagline">UMUCO N'URURIMI</span>
        </div>
        <nav className="nav-links">
          <a href="/">Ahabanza</a>
          <a href="/discover">Gushakisha</a>
          <a href="/saved">Ibyo Nabitse</a>
        </nav>
        <div className="right-actions">
          <a href="#" className="pill outline-cream">Kwandika Inkuru</a>
          <span className="lang-code">RW</span>
          <a href="/login" className="login-link">Kwinjira</a>
          <a href="/register" className="pill primary">Kwiyandikisha</a>
        </div>
      </header>

      {/* SplitAuth section */}
      <section className="split-auth">
        {/* Left maroon pane */}
        <div className="left-pane">
          <Image
            src="/assets/maroon-baskets.jpg"
            alt="" // decorative
            fill
            className="bg-image"
            priority
          />
          <div className="caption-box">
            <span className="eyebrow">ABISHYIZE HAMWE</span>
            <h2 className="title">Urunana</h2>
          </div>
        </div>
        {/* Right cream form pane */}
        <div className="right-pane">
          <form className="reg-form" onSubmit={handleSubmit}>
            <span className="eyebrow">URURIMI WIFUZA GUKORESHA</span>
            <div className="language-pills">
              <button
                type="button"
                className={"pill " + (lang === "rw" ? "primary" : "outline")}
                onClick={() => setLang("rw")}
                aria-pressed={lang === "rw"}
              >
                Ikinyarwanda
              </button>
              <button
                type="button"
                className={"pill " + (lang === "en" ? "primary" : "outline")}
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                English
              </button>
              <button
                type="button"
                className={"pill " + (lang === "fr" ? "primary" : "outline")}
                onClick={() => setLang("fr")}
                aria-pressed={lang === "fr"}
              >
                Français
              </button>
            </div>
            <h1 className="form-h1">Kwiyandikisha</h1>
            <label className="field-label" htmlFor="contact">
              E‑mail / Phone
            </label>
            <input id="contact" name="contact" type="text" required />
            <label className="field-label" htmlFor="displayName">
              Izina ryerekana (Display name)
            </label>
            <input id="displayName" name="displayName" type="text" required />
            <label className="field-label" htmlFor="password">
              Ijambo ry'ibanga (Password) <span className="helper">Byibura inyuguti 6</span>
            </label>
            <input id="password" name="password" type="password" required minLength={6} />
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" name="terms" required />
                Ndabyemeye (I agree to the Terms)
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" name="privacy" required />
                Nemeye (I accept the Privacy Policy)
              </label>
            </div>
            <button type="submit" className="pill full primary">
              Fungura Konti
            </button>
            <p className="bottom-link">
              <strong>Usanzwe ufite konti?</strong> <a href="/login" className="link-maroon">Injira</a>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
