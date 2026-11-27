export type StoredStoryEdit = {
  title: string;
  body: string;
  contentType: string;
  sources: string[];
  topics: string[];
  language: string;
  updatedLabel: string;
};

const STORAGE_KEY = "urunana_story_edits";

const KINYARWANDA_MONTHS = [
  "Mutarama",
  "Gashyantare",
  "Werurwe",
  "Mata",
  "Gicurasi",
  "Kamena",
  "Nyakanga",
  "Kanama",
  "Nzeri",
  "Ukwakira",
  "Ugushyingo",
  "Ukuboza",
];

export function formatKinyarwandaDate(date = new Date()): string {
  const day = date.getDate();
  const month = KINYARWANDA_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function getStoryEdit(slug: string): StoredStoryEdit | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, StoredStoryEdit>;
    return map[slug] ?? null;
  } catch {
    return null;
  }
}

export function saveStoryEdit(
  slug: string,
  edit: Omit<StoredStoryEdit, "updatedLabel">
): StoredStoryEdit {
  const record: StoredStoryEdit = {
    ...edit,
    updatedLabel: `Byavuguruwe ku wa ${formatKinyarwandaDate()}`,
  };
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, StoredStoryEdit>) : {};
      map[slug] = record;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore storage quota errors
    }
  }
  return record;
}
