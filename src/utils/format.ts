const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "6 minutes ago", "yesterday", … */
export function formatRelativeTime(isoDate: string): string {
  const seconds = Math.round((new Date(isoDate).getTime() - Date.now()) / 1000);
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeFormatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return "just now";
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10-28" -> "Oct 28, 2026" */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
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
