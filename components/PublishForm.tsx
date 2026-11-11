"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPublicationAction } from "@/app/actions/publications";
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  PenTool,
  AlertTriangle,
  Send,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  Quote,
  Bold,
  Italic,
  Heading2,
  List,
  Flame,
  UserCheck,
  Compass,
  Scroll,
  ShieldAlert,
  Image as ImageIcon,
  Eye,
  Edit3,
  X,
  Minus,
  Check,
} from "lucide-react";

interface CategoryOption {
  id: string;
  slug: string;
  nameRw: string;
  nameEn: string;
  isHealthOrMedicine: boolean;
}

interface PublishFormProps {
  categories: CategoryOption[];
}

const KNOWLEDGE_SOURCES = [
  {
    id: "FAMILY_ORAL_TRADITION",
    label: "Ubuvanganzo bwo mu Muryango",
    sub: "Family & Oral Tradition",
    desc: "Inkuru, imigani n'amateka byahererekanyijwe mu miryango kuva kera mu kanwa.",
    icon: Flame,
    color: "border-amber-200 bg-amber-50/60 text-amber-950",
  },
  {
    id: "PERSONAL_EXPERIENCE",
    label: "Uburambe bwanjye bwite",
    sub: "Personal Experience",
    desc: "Ibyo wiboneye n'amaso yawe cyangwa ubumenyi n'uburambe bwite byakubayeho.",
    icon: UserCheck,
    color: "border-blue-200 bg-blue-50/60 text-blue-950",
  },
  {
    id: "COMMUNITY_PRACTICE",
    label: "Imigenzo y'Abaturage",
    sub: "Community Practice",
    desc: "Imigenzo n'imihango ikorwa n'abaturage bo mu gace runaka k'u Rwanda.",
    icon: Compass,
    color: "border-emerald-200 bg-emerald-50/60 text-emerald-950",
  },
  {
    id: "DOCUMENTED_HISTORY",
    label: "Amateka Yanditse",
    sub: "Documented History",
    desc: "Amateka yanditswe mu bitabo, inyandiko z'ubushakashatsi cyangwa inyandiko zizwi.",
    icon: Scroll,
    color: "border-stone-300 bg-stone-100 text-stone-900",
  },
  {
    id: "RESEARCH_BASED",
    label: "Ubushakashatsi Bwimbitse",
    sub: "Research-Based",
    desc: "Inyandiko ishingiye ku bushakashatsi bw'inzobere, ibimenyetso n'isesengura.",
    icon: BookOpen,
    color: "border-purple-200 bg-purple-50/60 text-purple-950",
  },
  {
    id: "INTERVIEW_BASED",
    label: "Ibibazwa n'Ubuhamya",
    sub: "Interview-Based",
    desc: "Ubuhamya bwakusanyijwe mu kiganiro cyihariye n'abakambwe n'abazi amateka.",
    icon: Quote,
    color: "border-teal-200 bg-teal-50/60 text-teal-950",
  },
  {
    id: "INTERPRETATION_OPINION",
    label: "Igitekerezo / Inyito Bwite",
    sub: "Interpretation & Opinion",
    desc: "Uko wumva cyangwa usesengura iby'umuco, ururimi n'amateka y'u Rwanda.",
    icon: PenTool,
    color: "border-rose-200 bg-rose-50/60 text-rose-950",
  },
];

const CONTENT_TYPES = [
  { id: "STORY", label: "Inkuru (Story / Narrative)" },
  { id: "ORAL_TRADITION", label: "Ubuvanganzo Nyemvugo (Oral Tradition)" },
  { id: "ARTICLE", label: "Inyandiko Nyunguranabitekerezo (Article)" },
  { id: "LANGUAGE_EXPLANATION", label: "Ibisobanuro by'Ururimi n'Imigani (Language & Proverbs)" },
  { id: "PERSONAL_EXPERIENCE", label: "Uburambe bw'Umuryango (Personal / Family Account)" },
  { id: "RESEARCH_PIECE", label: "Inyandiko y'Ubushakashatsi (Historical / Research Piece)" },
  { id: "EVENT_NOTICE", label: "Irangamimerere ry'Ibirori n'Umuco (Cultural Event Notice)" },
  { id: "OPINION_INTERPRETATION", label: "Inyito n'Isesengura (Cultural Opinion / Interpretation)" },
];

const MEMORY_PROMPTS = [
  {
    id: "hearth",
    badge: "🔥 Inkuru zo ku Ziko",
    promptRw: "Ni iyihe nkuru cyangwa umugani wumvise bakiri ku ziko uri umwana utazigera wibagirwa mu buzima bwawe?",
    hintEn: "A memorable hearth story or fable heard around the fireplace as a child.",
    starterText: "Ubwo nari nkiri umwana, nigeze kumva inkuru yo ku ziko igira iti: ",
  },
  {
    id: "elders",
    badge: "👵 Ubuhamya bw'Abakambwe",
    promptRw: "Ese hari inyigisho, umuvugo, cyangwa amagambo y'ubuhanga umukambwe cyangwa umukecuru wo mu muryango wawe yakubwiye bikagukora ku mutima?",
    hintEn: "Profound advice, poems, or wisdom shared by an elder in your family.",
    starterText: "Mu muryango wacu, hari umukambwe wajyaga adusobanurira ko: ",
  },
  {
    id: "customs",
    badge: "🌿 Imigenzo n'Ibyirorere by'Iwanyu",
    promptRw: "Ni uwuhe mugenzo gakondo (nko mu gusaba no gukwa, kwita izina, cyangwa kuragiza) wabonye iwanyu mu gace ukomokamo utandukanye n'uko abandi babikora?",
    hintEn: "A traditional family ceremony or regional custom with a unique local twist.",
    starterText: "Mu gace k'iwacu, hari umugenzo gakondo wihariye mu gihe cyo: ",
  },
  {
    id: "expressions",
    badge: "📜 Ubusobanuro bw'Amagambo n'Ibisakuzo",
    promptRw: "Ni irihe jambo ry'Ikinyarwanda cy'umwimerere cyangwa igisakuzo waba uzi abantu benshi ba none badasobanukirwa inyito yaryo y'ukuri?",
    hintEn: "An archaic expression, proverb, or riddle that people today often misunderstand.",
    starterText: "Iri jambo cyangwa umugani w'imigenurano ukunze gukoreshwa nabi, nyamara ubusobanuro bwa kera bwereka ko: ",
  },
  {
    id: "landmarks",
    badge: "🛡️ Ibitare n'Ahantu Ndangamurage",
    promptRw: "Ni akahe gace, umusozi, cyangwa igitare cy'amateka (nk'ibyari ibya Ruganzu, ibisi bya Huye, n'ibindi) waba warasuye uzi amateka yako akomeye?",
    hintEn: "A historical landmark, rock, hill, or sacred site whose legend deserves telling.",
    starterText: "Aho nzi hafite amateka gakondo akomeye ni: ",
  },
];

const CULTURAL_PHOTO_PRESETS = [
  {
    name: "Inyambo z'i Nyanza",
    url: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1200&auto=format&fit=crop",
    caption: "Inyambo z'i Nyanza mu ngoro y'umwami i Rukari",
  },
  {
    name: "Imisozi y'u Rwanda",
    url: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?q=80&w=1200&auto=format&fit=crop",
    caption: "Ikirere n'imisozi y'igihugu cy'imisozi igihumbi",
  },
  {
    name: "Ibyatsi Gakondo",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop",
    caption: "Ibyatsi n'ibiti byifashishwa mu buvuzi gakondo",
  },
  {
    name: "Ingoma n'Umurishyo",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop",
    caption: "Ingoma gakondo n'umuco w'intore",
  },
];

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </>
  );
}

function renderEditorPreview(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let isFirstParagraph = true;

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imageMatch) {
      const rawAlt = imageMatch[1];
      const src = imageMatch[2];
      const parts = rawAlt.split("|").map((p) => p.trim());
      const caption = parts[0];
      const isWide = parts.some(
        (p) => p === "wide" || p === "full" || p === "cinema"
      );

      elements.push(
        <figure
          key={i}
          className={`my-6 ${isWide ? "-mx-2 sm:-mx-6" : ""}`}
        >
          <div className="overflow-hidden rounded-xl bg-stone-100 border border-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={caption || "Ifoto"}
              className="w-full h-auto object-cover max-h-[450px] mx-auto"
            />
          </div>
          {caption && (
            <figcaption className="text-center font-serif text-xs text-stone-500 italic mt-2 px-2">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-serif text-xl font-bold text-stone-900 mt-6 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-serif text-lg font-semibold text-stone-800 mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-emerald-800 pl-4 py-1.5 my-4 italic text-stone-700 font-serif text-base bg-stone-50 rounded-r-lg">
          {line.slice(2)}
        </blockquote>
      );
    } else if (line === "---" || line === "***") {
      elements.push(
        <div key={i} className="flex items-center justify-center space-x-2 my-6 text-stone-300">
          <span>❖</span>
          <span>❖</span>
          <span>❖</span>
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-5 list-disc text-stone-800 my-1 font-serif">
          {inlineFormat(line.slice(2))}
        </li>
      );
    } else if (line === "") {
      elements.push(<div key={i} className="h-3" />);
    } else {
      const isDropCap = isFirstParagraph;
      if (isFirstParagraph) isFirstParagraph = false;

      elements.push(
        <p
          key={i}
          className={`text-stone-800 leading-relaxed mb-3 text-sm font-serif ${
            isDropCap
              ? "first-letter:float-left first-letter:text-3xl first-letter:font-bold first-letter:text-emerald-900 first-letter:mr-2 first-letter:leading-none"
              : ""
          }`}
        >
          {inlineFormat(rawLine)}
        </p>
      );
    }
    i++;
  }

  return <>{elements}</>;
}

export default function PublishForm({ categories }: PublishFormProps) {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [contentType, setContentType] = useState("STORY");
  const [contentLanguage, setContentLanguage] = useState("KINYARWANDA");
  const [selectedSources, setSelectedSources] = useState<string[]>(["FAMILY_ORAL_TRADITION"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sourceCitation, setSourceCitation] = useState("");
  const [researchConsent, setResearchConsent] = useState(false);

  // UI helpers
  const [showPrompts, setShowPrompts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle helpers
  function toggleSource(id: string) {
    if (selectedSources.includes(id)) {
      if (selectedSources.length > 1) {
        setSelectedSources(selectedSources.filter((s) => s !== id));
      }
    } else {
      setSelectedSources([...selectedSources, id]);
    }
  }

  function toggleCategory(id: string) {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  }

  function handlePromptClick(starterText: string) {
    if (!body) {
      setBody(starterText);
    } else {
      setBody((prev) => `${prev}\n\n${starterText}`);
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Substack-style image insertion & preview states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageLayout, setImageLayout] = useState<"standard" | "wide">("standard");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  function insertAtCursor(textToInsert: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => prev + textToInsert);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = body.substring(0, start);
    const after = body.substring(end);
    setBody(before + textToInsert + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + textToInsert.length,
        start + textToInsert.length
      );
    }, 50);
  }

  function insertFormatting(prefix: string, suffix: string = "") {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => `${prev}${prefix}Inyandiko${suffix}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end) || "Inyandiko";
    const replacement = `${prefix}${selectedText}${suffix}`;
    const before = body.substring(0, start);
    const after = body.substring(end);
    setBody(before + replacement + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 50);
  }

  function handleInsertImage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!imageUrl.trim()) return;

    const captionPart = imageCaption.trim() ? imageCaption.trim() : "Ifoto";
    const layoutModifier = imageLayout === "wide" ? "|wide" : "";
    const markdownImage = `\n\n![${captionPart}${layoutModifier}](${imageUrl.trim()})\n\n`;

    insertAtCursor(markdownImage);
    setImageUrl("");
    setImageCaption("");
    setImageLayout("standard");
    setIsImageModalOpen(false);
  }

  // Check if any selected category is health-related (triggers FR-MOD-13 preview)
  const isHealthCategorySelected = categories
    .filter((c) => selectedCategories.includes(c.id))
    .some((c) => c.isHealthOrMedicine);

  async function handleSubmit(isDraft: boolean) {
    setErrorMessage(null);

    if (!title.trim() || title.trim().length < 5) {
      setErrorMessage("Umutwe w'inyandiko ugomba kugira nibura inyuguti 5.");
      return;
    }

    if (!isDraft && (!body.trim() || body.trim().length < 5)) {
      setErrorMessage("Andika nibura inyuguti 5 z'inkuru, umugani, cyangwa igisakuzo (ntihagomba kuba hejuru).");
      return;
    }

    if (selectedSources.length === 0) {
      setErrorMessage("Hitamo nibura inkomoko y'ubumenyi imwe (Mandatory Knowledge Source).");
      return;
    }

    if (selectedCategories.length === 0) {
      setErrorMessage("Hitamo nibura insanganyamatsiko imwe.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("body", body.trim());
    formData.set("summary", summary.trim());
    formData.set("contentType", contentType);
    formData.set("contentLanguage", contentLanguage);
    formData.set("sourceCitation", sourceCitation.trim());
    formData.set("isDraft", isDraft ? "true" : "false");
    formData.set("researchConsent", researchConsent ? "true" : "false");

    selectedSources.forEach((s) => formData.append("knowledgeSources", s));
    selectedCategories.forEach((c) => formData.append("categoryIds", c));

    try {
      const res = await createPublicationAction(formData);
      if (res.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else {
        router.push(isDraft ? "/saved" : `/publications/${res.slug}`);
        router.refresh();
      }
    } catch {
      setErrorMessage("Habaye ikosa ryo gutangaza inyandiko. Ongera ugerageze.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: Knowledge-Source & Language Provenance */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Intambwe ya 1: Inkomoko y&apos;Ubumenyi n&apos;Ururimi</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Aho Amakuru n&apos;Inkuru Bikomoka (Knowledge Provenance)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Urunana ruha agaciro inkomoko y&apos;ubumenyi gakondo. Hitamo inkomoko ijyanye n&apos;inyandiko yawe:
          </p>
        </div>

        {/* Knowledge Source Pill Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {KNOWLEDGE_SOURCES.map((source) => {
            const isSelected = selectedSources.includes(source.id);
            const Icon = source.icon;
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => toggleSource(source.id)}
                className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 ${
                  isSelected
                    ? "border-emerald-800 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-800/30"
                    : "border-stone-200 bg-[#fcfcfb] hover:border-stone-300"
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isSelected ? "bg-emerald-800 text-white" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">{source.label}</span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Yahiswemo
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-stone-500 italic mb-1">
                    {source.sub}
                  </div>
                  <div className="text-[11px] text-stone-600 leading-relaxed">
                    {source.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Type & Language Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Ubwoko bw&apos;Inyandiko (Content Type)
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              {CONTENT_TYPES.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Ururimi rw&apos;Inyandiko (Content Language)
            </label>
            <select
              value={contentLanguage}
              onChange={(e) => setContentLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              <option value="KINYARWANDA">🇷🇼 Ikinyarwanda (Default / Ibanze)</option>
              <option value="ENGLISH">🇬🇧 English</option>
              <option value="FRENCH">🇫🇷 Français</option>
              <option value="MIXED">🌐 Mixed (Kinyarwanda + Other)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Cultural Memory Prompts (Piquing the brain / sparking storytelling) */}
      <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-800" />
            <h3 className="font-serif text-base font-bold">
              Ibikangura Intekerezo n&apos;Inkuru zo ku Ziko (Cultural Memory Sparks)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPrompts(!showPrompts)}
            className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center space-x-1"
          >
            <span>{showPrompts ? "Hisha" : "Garagaza"}</span>
            {showPrompts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showPrompts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {MEMORY_PROMPTS.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full inline-block mb-1.5">
                    {p.badge}
                  </span>
                  <p className="text-xs text-stone-900 font-serif leading-relaxed mb-1">
                    {p.promptRw}
                  </p>
                  <p className="text-[10px] text-stone-500 italic">
                    {p.hintEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePromptClick(p.starterText)}
                  className="mt-3 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center space-x-1"
                >
                  <PenTool className="w-3 h-3" />
                  <span>Koresha iki gitekerezo mu nyandiko &rarr;</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Title & Story Editor */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <PenTool className="w-4 h-4" />
            <span>Intambwe ya 2: Inyandiko Yawe</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Umutwe n&apos;Imbata y&apos;Inkuru
          </h2>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Umutwe w&apos;Inyandiko (Title) *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="urugero: Umurage wa Ruganzu Ndoli cyangwa Sakwe Sakwe..."
            maxLength={150}
            className="w-full px-4 py-3 rounded-xl border border-stone-300 text-base font-serif font-bold text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-[#fcfcfb]"
          />
          <div className="flex justify-between text-[11px] text-stone-400 mt-1">
            <span>Byibura inyuguti 5</span>
            <span>{title.length} / 150</span>
          </div>
        </div>

        {/* Short Summary (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Incamake y&apos;Inyandiko (Brief Summary - Optional)
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Interuro 1 ivuga muri make ibyo iyi nyandiko igarukaho..."
            className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-[#fcfcfb]"
          />
        </div>

        {/* Story Body with Formatting Toolbar */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Imbata y&apos;Inyandiko (Story Content) *
            </label>

            {/* Substack-style Formatting Toolbar */}
            <div className="flex items-center flex-wrap gap-1 bg-stone-100 rounded-xl p-1 border border-stone-200">
              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                title="Bold (**nyandiko**)"
                className="p-1.5 text-stone-700 hover:bg-stone-200 rounded-lg transition"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                title="Italic (*nyandiko*)"
                className="p-1.5 text-stone-700 hover:bg-stone-200 rounded-lg transition"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n## ", "\n")}
                title="Heading (## Umutwe muto)"
                className="p-1.5 text-stone-700 hover:bg-stone-200 rounded-lg transition"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n> ", "\n")}
                title="Quote (> Igitekerezo)"
                className="p-1.5 text-stone-700 hover:bg-stone-200 rounded-lg transition"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("\n- ", "\n")}
                title="List (- Ingingo)"
                className="p-1.5 text-stone-700 hover:bg-stone-200 rounded-lg transition"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertAtCursor("\n\n---\n\n")}
                title="Divider (---)"
                className="p-1.5 text-stone-700 hover:bg-stone-200 rounded-lg transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="w-px h-4 bg-stone-300 mx-0.5" />

              {/* Substack Image Button */}
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-950 hover:bg-emerald-200 border border-emerald-300 transition"
                title="Shyiramo ifoto n'ibisobanuro (Insert Inline Photo)"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-800" />
                <span>Ongeramo Ifoto</span>
              </button>

              {/* Preview Toggle */}
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  isPreviewMode
                    ? "bg-stone-900 text-white"
                    : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
                }`}
                title="Reba uko inkuru izasomwa"
              >
                {isPreviewMode ? (
                  <Edit3 className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                <span>{isPreviewMode ? "Andika (Edit)" : "Kureba (Preview)"}</span>
              </button>
            </div>
          </div>

          {/* Editor or Live Preview */}
          {isPreviewMode ? (
            <div className="p-6 rounded-2xl border border-stone-300 bg-[#fbfbf9] min-h-[300px] shadow-2xs">
              <div className="flex items-center space-x-2 text-xs text-stone-400 pb-3 border-b border-stone-200 mb-4">
                <Eye className="w-3.5 h-3.5 text-emerald-800" />
                <span>Uko inyandiko izagaragara ku basomyi (Reader Preview):</span>
              </div>
              <div className="font-serif">
                {body.trim() ? (
                  renderEditorPreview(body)
                ) : (
                  <p className="text-xs text-stone-400 italic">
                    Nta kintu kirandikwa muri iyi nyandiko...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Andika inkuru yawe hano... Ushobora gukoresha amashusho, ibisakuzo, imigani, cyangwa inkuru ndende z'amateka."
              className="w-full p-4 rounded-xl border border-stone-300 font-serif text-sm text-stone-900 leading-relaxed placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-[#fcfcfb]"
            />
          )}

          <div className="flex justify-between items-center text-[11px] text-stone-400 mt-1.5">
            <span>
              Amagambo: {body.trim() ? body.trim().split(/\s+/).length : 0} | Inyuguti: {body.length}
            </span>
            <span className="text-emerald-800 font-medium">
              💡 Ushobora gushyira amafoto aho ushaka hose mu nkuru ukoresheje buto ya &ldquo;Ongeramo Ifoto&rdquo;.
            </span>
          </div>
        </div>

        {/* Substack Inline Image Modal */}
        {isImageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-300 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center space-x-2 text-emerald-800">
                  <ImageIcon className="w-5 h-5" />
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Ongeramo Ifoto mu Nkuru (Insert Inline Photo)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInsertImage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-1">
                    Ihuza ry&apos;Ifoto (Image URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://urugero.com/ifoto.jpg cyangwa ihuza ryose"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-1">
                    Ibisobanuro & Inkomoko (Caption / Credit)
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="urugero: Inyambo z'i Nyanza mu birori by'umuganura | Ifoto: Umurage Archive"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-[#fcfcfb] focus:ring-2 focus:ring-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider mb-1">
                    Uburyo bwo Kugaragara (Image Layout)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                        imageLayout === "standard"
                          ? "border-emerald-800 bg-emerald-50/70 text-emerald-950 font-semibold"
                          : "border-stone-200 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="layout"
                        value="standard"
                        checked={imageLayout === "standard"}
                        onChange={() => setImageLayout("standard")}
                        className="text-emerald-800 focus:ring-emerald-800"
                      />
                      <span>Biringaniye (Standard Column)</span>
                    </label>

                    <label
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                        imageLayout === "wide"
                          ? "border-emerald-800 bg-emerald-50/70 text-emerald-950 font-semibold"
                          : "border-stone-200 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="layout"
                        value="wide"
                        checked={imageLayout === "wide"}
                        onChange={() => setImageLayout("wide")}
                        className="text-emerald-800 focus:ring-emerald-800"
                      />
                      <span>Ubugari Bwose (Wide Cinematic)</span>
                    </label>
                  </div>
                </div>

                {/* Cultural Presets Helper */}
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                    Amafoto y&apos;Icyitegererezo (Sample Cultural Imagery)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CULTURAL_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setImageCaption(preset.caption);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 text-[11px] font-medium border border-stone-200 transition"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Kureka
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition shadow-xs"
                  >
                    Ongeramo Ifoto mu Nkuru
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Topics & Citations */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Intambwe ya 3: Insanganyamatsiko & Aho Amakuru Yavuye</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Hitamo Insanganyamatsiko (Topics)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Hitamo nibura insanganyamatsiko imwe ifasha abasomyi kubona inkuru yawe:
          </p>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isSelected
                    ? "bg-emerald-800 text-white shadow-2xs font-semibold"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200"
                }`}
              >
                {cat.nameRw}
              </button>
            );
          })}
        </div>

        {/* Mandatory Health Disclaimer Preview (FR-MOD-13) */}
        {isHealthCategorySelected && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900">
                Itangazo Ryamagana Ubuvuzi Bw&apos;Abaganga (FR-MOD-13):
              </div>
              <p className="mt-0.5 leading-relaxed text-amber-900">
                Kubera ko wahisemo insanganyamatsiko y&apos;ubumenyi n&apos;ubuvuzi gakondo, iri tangazo rizakurikira
                inyandiko yawe ku buryo budasibwa kugira ngo ryibutse abasomyi ko iyi ari inyandiko y&apos;umuco gusa,
                atari inama z&apos;abaganga babifitiye ububasha.
              </p>
            </div>
          </div>
        )}

        {/* Citation Input (FR-PUB-13) */}
        <div className="pt-4 border-t border-stone-100">
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Aho Amakuru Yavuye (Source / Elder Citation - Optional)
          </label>
          <input
            type="text"
            value={sourceCitation}
            onChange={(e) => setSourceCitation(e.target.value)}
            placeholder="urugero: Byabwiwe sekuru wa Kalisa i Nyanza mu 1982, cyangwa igitabo 'Amateka y'u Rwanda'..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 bg-[#fcfcfb]"
          />
        </div>
      </div>

      {/* SECTION 5: Rights, Research Consent & Publishing Actions */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900">
            Uruhushya rwo Gutangaza & Gukoresha Inyandiko
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Ubwirangure n&apos;umutungo mu by&apos;ubwenge biguma ku mwanditsi (FR-PUB-16).
          </p>
        </div>

        {/* Research / Language Tech Opt-In Checkbox (FR-PUB-16, CON-6) */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={researchConsent}
              onChange={(e) => setResearchConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-emerald-800 border-stone-300 focus:ring-emerald-800"
            />
            <span className="text-xs text-stone-700 leading-relaxed">
              <span className="font-semibold text-stone-900 block mb-0.5">
                Ubwitange mu Bushakashatsi bw&apos;Ururimi rw&apos;Ikinyarwanda (Optional):
              </span>
              Nemeye ku bushake ko iyi nyandiko ishobora kuzakoreshwa mu gihe kizaza mu bushakashatsi bw&apos;ururimi
              rw&apos;Ikinyarwanda cyangwa mu guteza imbere ikoranabuhanga ry&apos;ururimi rwacu.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:border-stone-400 hover:bg-stone-50 transition flex items-center justify-center space-x-2 shadow-2xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Bika nk&apos;Agateganyo (Save as Draft)</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-95 transition flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Biratunganywa...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Tangaza Ubu (Publish Story)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

