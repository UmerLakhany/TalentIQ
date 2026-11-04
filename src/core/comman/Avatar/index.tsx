import { getAvatarTone, getInitials } from "@/utils/format";

/** Initials avatar with a stable colour per name. */
export default function Avatar({ name }: { name: string }) {
  const tone = getAvatarTone(name);
  return (
    <span
      className={`hf-avatar rounded-circle fw-semibold d-inline-flex align-items-center justify-content-center bg-${tone}-subtle text-${tone}-emphasis`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
