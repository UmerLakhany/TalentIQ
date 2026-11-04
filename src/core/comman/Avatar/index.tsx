import { getAvatarTone, getInitials } from "@/utils/format";

/** Initials avatar with a stable colour per name. */
export default function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const tone = getAvatarTone(name);
  return (
    <span
      className={`hf-avatar ${size === "lg" ? "hf-avatar-lg" : ""} rounded-circle fw-semibold d-inline-flex align-items-center justify-content-center bg-${tone}-subtle text-${tone}-emphasis`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
