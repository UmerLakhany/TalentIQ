const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

/** "2026-10-28" -> "Oct 28, 2026" */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

/** "2026-11-04T09:40:00Z" -> "Nov 4, 9:40 AM" */
export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}

/** 1536 (KB) -> "1.5 MB" */
export function formatFileSize(sizeKb: number): string {
  return sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`;
}

/** 4.5 -> "4.5 yrs", 1 -> "1 yr" */
export function formatYears(years: number): string {
  return `${years} ${years === 1 ? "yr" : "yrs"}`;
}

const AVATAR_TONES = ["primary", "success", "info", "warning", "danger", "secondary"];

/** Stable avatar colour per name (Bootstrap colour name) */
export function getAvatarTone(name: string): string {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/** "Sarah Mitchell" -> "SM" */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
