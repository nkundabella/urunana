"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  ContentLanguage,
  ContentType,
  KnowledgeSourceType,
  PostDto,
  TopicCategoryDto,
} from "@/lib/api-types";
import styles from "./PublishEditor.module.css";

const CONTENT_TYPE_OPTIONS: Array<{ value: ContentType; label: string }> = [
  { value: "STORY", label: "Inkuru (Story)" },
  { value: "ARTICLE", label: "Article" },
  { value: "ORAL_TRADITION", label: "Ubuvanganzo Nyemvugo (Oral tradition)" },
  { value: "LANGUAGE_EXPLANATION", label: "Umugani / Ururimi (Language)" },
  { value: "PERSONAL_EXPERIENCE", label: "Ubuhamya Bwite (Personal experience)" },
  { value: "INTERVIEW", label: "Ikiganiro (Interview / Discussion)" },
  { value: "RESEARCH_PIECE", label: "Ubushakashatsi (Research)" },
  { value: "OPINION_INTERPRETATION", label: "Igitekerezo (Interpretation)" },
  { value: "EVENT_NOTICE", label: "Itangazo ry'Igikorwa (Event notice)" },
];

const SOURCE_OPTIONS: Array<{ value: KnowledgeSourceType; label: string }> = [
  { value: "PERSONAL_EXPERIENCE", label: "Personal experience" },
  { value: "FAMILY_ORAL_TRADITION", label: "Family story / oral tradition" },
  { value: "COMMUNITY_PRACTICE", label: "Community practice" },
  { value: "DOCUMENTED_HISTORY", label: "Documented history" },
  { value: "RESEARCH_BASED", label: "Researched" },
  { value: "INTERVIEW_BASED", label: "Interview" },
  { value: "INTERPRETATION_OPINION", label: "Interpretation" },
];

const LANGUAGE_OPTIONS: Array<{ value: ContentLanguage; label: string }> = [
  { value: "KINYARWANDA", label: "Ikinyarwanda" },
  { value: "ENGLISH", label: "English" },
  { value: "FRENCH", label: "Français" },
  { value: "MIXED", label: "Ikinyarwanda / English (Mixed)" },
];

type Props = {
  initialPost?: PostDto;
  initialCategories?: TopicCategoryDto[];
  submitLabel?: string;
};

export default function PublishEditor({
  initialPost,
  initialCategories = [],
  submitLabel = "Tangaza",
}: Props) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftIdRef = useRef<string | undefined>(initialPost?.id);

  const [categories, setCategories] =
    useState<TopicCategoryDto[]>(initialCategories);
  const [title, setTitle] = useState(
    initialPost?.title === "Inyandiko itaratangazwa"
      ? ""
      : (initialPost?.title ?? "")
  );
  const [body, setBody] = useState(initialPost?.body ?? "");
  const [contentType, setContentType] = useState<ContentType>(
    initialPost?.contentType ?? "STORY"
  );
  const [sources, setSources] = useState<KnowledgeSourceType[]>(
    initialPost?.knowledgeSources ?? []
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialPost?.categories.map((c) => c.id) ?? []
  );
  const [language, setLanguage] = useState<ContentLanguage>(
    initialPost?.contentLanguage ?? "KINYARWANDA"
  );
  const [sourceCitation, setSourceCitation] = useState(
    initialPost?.sourceCitation ?? ""
  );
  const [researchConsent, setResearchConsent] = useState(
    initialPost?.researchUseConsent ?? false
  );

  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const [draftToast, setDraftToast] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditingPublished = initialPost?.status === "PUBLISHED";
  const showDraftButton = !isEditingPublished;

  useEffect(() => {
    if (categories.length > 0) return;
    let cancelled = false;
    apiFetch<{ categories: TopicCategoryDto[] }>("/api/v1/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.categories);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [categories.length]);

  const titleLen = title.trim().length;
  const bodyLen = body.trim().length;
  const isValid =
    titleLen >= 5 &&
    titleLen <= 150 &&
    bodyLen >= 100 &&
    bodyLen <= 20000 &&
    sources.length >= 1 &&
    selectedCategoryIds.length >= 1;

  function toggleValue<T extends string>(
    list: T[],
    value: T,
    setter: (v: T[]) => void
  ) {
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

  async function handleSaveDraft() {
    if (savingDraft || submitting) return;
    setSavingDraft(true);
    setFormError(null);
    try {
      const res = await apiFetch<{ post: PostDto }>("/api/v1/posts/drafts", {
        method: "POST",
        json: {
          ...(draftIdRef.current ? { id: draftIdRef.current } : {}),
          title: title.trim(),
          body,
          contentType,
          knowledgeSources: sources,
          categoryIds: selectedCategoryIds,
          contentLanguage: language,
          sourceCitation: sourceCitation.trim() || null,
          hostingLicenseGranted: true,
          researchUseConsent: researchConsent,
        },
      });
      draftIdRef.current = res.post.id;
      setDraftToast(true);
      setTimeout(() => setDraftToast(false), 2500);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Ntibyakunze kubika inyandiko itaratangazwa."
      );
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setFormError(null);

    const payload = {
      title: title.trim(),
      body: body.trim(),
      contentType,
      knowledgeSources: sources,
      categoryIds: selectedCategoryIds,
      contentLanguage: language,
      sourceCitation: sourceCitation.trim() || null,
      hostingLicenseGranted: true,
      researchUseConsent: researchConsent,
    };

    try {
      if (isEditingPublished && initialPost) {
        const res = await apiFetch<{ post: PostDto }>(
          `/api/v1/posts/${initialPost.id}`,
          {
            method: "PATCH",
            json: payload,
          }
        );
        setPublished(true);
        router.push(`/inkuru/${res.post.slug}`);
        router.refresh();
        return;
      }

      let targetDraftId = draftIdRef.current;
      if (!targetDraftId) {
        const created = await apiFetch<{ post: PostDto }>(
          "/api/v1/posts/drafts",
          {
            method: "POST",
            json: payload,
          }
        );
        targetDraftId = created.post.id;
        draftIdRef.current = targetDraftId;
      }

      const publishedRes = await apiFetch<{ post: PostDto }>(
        `/api/v1/posts/${targetDraftId}/publish`,
        {
          method: "POST",
          json: payload,
        }
      );

      setPublished(true);
      router.push(`/inkuru/${publishedRes.post.slug}`);
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Habaye ikibazo mu gutangaza inyandiko. Ongera ugerageze."
      );
    } finally {
      setSubmitting(false);
    }
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
              <div
                className={styles.toolbar}
                role="toolbar"
                aria-label="Imiterere y'inyandiko"
              >
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
              Inama: tangira n&apos;inkuru wumvise ku muryango. ({bodyLen}{" "}
              inyuguti)
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
              onChange={(e) => setContentType(e.target.value as ContentType)}
            >
              {CONTENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className={styles.metaFieldset}>
            <legend className={styles.label}>
              INKOMOKO (SOURCE &middot; BYIBURA 1)
            </legend>
            <div className={styles.sourceList}>
              {SOURCE_OPTIONS.map((source) => (
                <label key={source.value} className={styles.sourceRow}>
                  <input
                    type="checkbox"
                    className={styles.sourceCheck}
                    checked={sources.includes(source.value)}
                    onChange={() =>
                      toggleValue(sources, source.value, setSources)
                    }
                  />
                  <span className={styles.sourceText}>{source.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.metaFieldset}>
            <legend className={styles.label}>
              INSANGANYAMATSIKO (TOPIC &middot; BYIBURA 1)
            </legend>
            <div className={styles.topicChips}>
              {categories.map((cat) => {
                const checked = selectedCategoryIds.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`${styles.topicChip}${checked ? ` ${styles.topicChipActive}` : ""}`}
                  >
                    <input
                      type="checkbox"
                      className={styles.topicCheck}
                      checked={checked}
                      onChange={() =>
                        toggleValue(
                          selectedCategoryIds,
                          cat.id,
                          setSelectedCategoryIds
                        )
                      }
                    />
                    <span>{cat.nameRw}</span>
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
              onChange={(e) => setLanguage(e.target.value as ContentLanguage)}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.metaGroup}>
            <label htmlFor="source-citation" className={styles.label}>
              IBISOBANURO BY&apos;INKOMOKO (OPTIONAL)
            </label>
            <input
              id="source-citation"
              type="text"
              className={styles.input}
              value={sourceCitation}
              onChange={(e) => setSourceCitation(e.target.value)}
              placeholder="Urugero: Byabwiwe sekuru i Nyanza..."
              maxLength={600}
            />
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

        {formError ? (
          <p
            role="alert"
            style={{
              margin: "0.75rem 0 0",
              color: "#ffb4a2",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            {formError}
          </p>
        ) : null}

        <div className={styles.submitRow}>
          {showDraftButton ? (
            <button
              type="button"
              className={styles.draftBtn}
              disabled={savingDraft || submitting}
              onClick={handleSaveDraft}
            >
              {savingDraft
                ? "Kubika…"
                : "Bika nk'inyandiko itaratangazwa"}
            </button>
          ) : null}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!isValid || submitting}
          >
            {submitting ? "Gutunganya…" : submitLabel}
          </button>
          {draftToast ? (
            <span className={styles.toast} role="status" aria-live="polite">
              Byabitswe
            </span>
          ) : null}
          {published ? (
            <span
              className={styles.statusText}
              role="status"
              aria-live="polite"
            >
              {isEditingPublished
                ? "Impinduka zabitswe!"
                : "Inyandiko yawe yatangajwe!"}
            </span>
          ) : null}
        </div>
      </section>
    </form>
  );
}
