"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoryEdit, saveStoryEdit } from "@/src/data/storyEdits";
import styles from "./PublishEditor.module.css";

const CONTENT_TYPES = [
  "Inkuru (Story)",
  "Article",
  "Umugani (Proverb)",
  "Ikiganiro (Discussion)",
];

const SOURCES = [
  "Personal experience",
  "Family story / oral tradition",
  "Researched",
  "Interpretation",
];

const TOPICS = [
  "History & heritage",
  "Kinyarwanda language",
  "Proverbs & riddles",
  "Oral traditions",
  "Traditional practices",
  "Music & dance",
  "Food",
  "Clothing",
  "Traditional knowledge",
  "Cultural events",
  "Contemporary life",
];

const LANGUAGES = ["Ikinyarwanda", "English", "Français"];

export type EditorInitialValues = {
  title: string;
  body: string;
  contentType: string;
  sources: string[];
  topics: string[];
  language: string;
};

type Props = {
  storySlug?: string;
  initialValues?: EditorInitialValues;
  submitLabel?: string;
};

export default function PublishEditor({
  storySlug,
  initialValues,
  submitLabel = "Tangaza",
}: Props) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [body, setBody] = useState(initialValues?.body ?? "");
  const [contentType, setContentType] = useState(
    initialValues?.contentType ?? CONTENT_TYPES[0]
  );
  const [sources, setSources] = useState<string[]>(initialValues?.sources ?? []);
  const [topics, setTopics] = useState<string[]>(initialValues?.topics ?? []);
  const [language, setLanguage] = useState(
    initialValues?.language ?? LANGUAGES[0]
  );
  const [researchConsent, setResearchConsent] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!storySlug) return;
    const saved = getStoryEdit(storySlug);
    if (saved) {
      setTitle(saved.title);
      setBody(saved.body);
      setContentType(saved.contentType);
      setSources(saved.sources);
      setTopics(saved.topics);
      setLanguage(saved.language);
    }
  }, [storySlug]);

  const titleLen = title.trim().length;
  const bodyLen = body.trim().length;
  const isValid =
    titleLen >= 5 &&
    titleLen <= 150 &&
    bodyLen >= 100 &&
    bodyLen <= 20000 &&
    sources.length >= 1 &&
    topics.length >= 1;

  function toggleItem(list: string[], value: string, setter: (v: string[]) => void) {
    setter(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  }

  function insertFormatting(prefix: string, suffix = "", placeholder = "") {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const selected = body.slice(start, end) || placeholder;
    const next =
      body.slice(0, start) + prefix + selected + suffix + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    insertFormatting(`\n![${file.name}](`, ")", "ifoto");
    e.target.value = "";
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    const targetSlug = storySlug ?? "umurage-wa-ruganzu-ii-ndoli";
    if (storySlug) {
      saveStoryEdit(storySlug, {
        title: title.trim(),
        body: body.trim(),
        contentType,
        sources,
        topics,
        language,
      });
    }
    setPublished(true);
    setTimeout(() => {
      router.push(`/inkuru/${targetSlug}`);
    }, 600);
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit} noValidate>
      <div className={styles.columns}>
        {/* Left paper editor card */}
        <section className={styles.editorCard} aria-label="Kwandika inkuru">
          <div className={styles.fieldGroup}>
            <label htmlFor="story-title" className={styles.label}>
              Umutwe (TITLE &middot; 5&ndash;150)
            </label>
            <input
              id="story-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Umutwe w'inkuru"
              maxLength={150}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="story-body" className={styles.label}>
              UMUBIRI (BODY &middot; 100&ndash;20,000)
            </label>

            <div className={styles.editorBox}>
              <div className={styles.toolbar} role="toolbar" aria-label="Imiterere y'inyandiko">
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting("**", "**", "ijambo")}
                  aria-label="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting("*", "*", "ijambo")}
                  aria-label="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting("\n# ", "", "Umutwe")}
                  aria-label="Heading 1"
                >
                  H1
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => insertFormatting("\n- ", "", "Ingingo")}
                >
                  &bull; Urutonde
                </button>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Ifoto
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className={styles.hiddenFile}
                  tabIndex={-1}
                />
              </div>

              <textarea
                id="story-body"
                ref={textareaRef}
                className={styles.textarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tangira wandike inkuru cyangwa igitekerezo cyawe..."
                maxLength={20000}
              />
            </div>

            <p className={styles.helper}>
              Inama: tangira n&apos;inkuru wumvise ku muryango.
            </p>
          </div>
        </section>

        {/* Right OffsetCard metadata */}
        <aside className={styles.metaCard} aria-label="Amakuru y'inyandiko">
          <div className={styles.metaGroup}>
            <label htmlFor="content-type" className={styles.label}>
              ubwoko (CONTENT TYPE)
            </label>
            <select
              id="content-type"
              className={styles.select}
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              {CONTENT_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <fieldset className={styles.metaFieldset}>
            <legend className={styles.label}>
              INKOMOKO (SOURCE &middot; BYIBURA 1)
            </legend>
            <div className={styles.sourceList}>
              {SOURCES.map((source) => (
                <label key={source} className={styles.sourceRow}>
                  <input
                    type="checkbox"
                    className={styles.sourceCheck}
                    checked={sources.includes(source)}
                    onChange={() => toggleItem(sources, source, setSources)}
                  />
                  <span className={styles.sourceText}>{source}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.metaFieldset}>
            <legend className={styles.label}>
              INSANGANYAMATSIKO (TOPIC &middot; BYIBURA 1)
            </legend>
            <div className={styles.topicChips}>
              {TOPICS.map((topic) => {
                const checked = topics.includes(topic);
                return (
                  <label
                    key={topic}
                    className={`${styles.topicChip}${checked ? ` ${styles.topicChipActive}` : ""}`}
                  >
                    <input
                      type="checkbox"
                      className={styles.topicCheck}
                      checked={checked}
                      onChange={() => toggleItem(topics, topic, setTopics)}
                    />
                    <span>{topic}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className={styles.metaGroup}>
            <label htmlFor="story-language" className={styles.label}>
              URURIMI (LANGUAGE)
            </label>
            <select
              id="story-language"
              className={styles.select}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </aside>
      </div>

      {/* Full-width dark publish panel */}
      <section className={styles.publishPanel} aria-label="Gutangaza inyandiko">
        <p className={styles.license}>
          Mu gutangaza, utanga uruhushya rudafitanye umwihariko rwo kubika no
          kwerekana inyandiko yawe kuri Urunana. (Non-exclusive hosting license.)
        </p>

        <label className={styles.consentRow}>
          <input
            type="checkbox"
            className={styles.consentCheck}
            checked={researchConsent}
            onChange={(e) => setResearchConsent(e.target.checked)}
          />
          <span>
            Nemera ko inyandiko yanjye yakoreshwa mu bushakashatsi cyangwa
            ikoranabuhanga ry&apos;ururimi (optional)
          </span>
        </label>

        <div className={styles.submitRow}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!isValid}
          >
            {submitLabel}
          </button>
          {published ? (
            <span className={styles.statusText} role="status" aria-live="polite">
              {storySlug ? "Impinduka zabitswe!" : "Inyandiko yawe yatangajwe!"}
            </span>
          ) : null}
        </div>
      </section>
    </form>
  );
}
