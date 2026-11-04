import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Buttons shown on the right (stack under the title on mobile) */
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="h4 fw-semibold text-body-emphasis mb-1">{title}</h2>
        {description && <p className="text-secondary mb-0">{description}</p>}
      </div>
      {/* Full-width stacked buttons on phones, inline from tablet up */}
      {actions && <div className="d-grid d-sm-flex flex-wrap gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
