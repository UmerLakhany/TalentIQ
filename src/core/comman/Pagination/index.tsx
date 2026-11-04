interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  /** e.g. "candidates" */
  itemLabel?: string;
}

/** Page numbers with ellipses, e.g. 1 … 4 5 6 … 12 */
function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export default function Pagination({ page, pageSize, totalItems, onPageChange, itemLabel = "results" }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
      <p className="small text-secondary mb-0">
        Showing <span className="fw-semibold text-body-emphasis">{from}–{to}</span> of {totalItems} {itemLabel}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination">
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button type="button" className="page-link" onClick={() => onPageChange(page - 1)} aria-label="Previous page">
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>
            </li>

            {/* Phones: compact "2 / 3" */}
            <li className="page-item disabled d-sm-none">
              <span className="page-link text-body">
                {page} / {totalPages}
              </span>
            </li>

            {/* Tablet and up: page numbers */}
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === "…" ? (
                <li key={`gap-${i}`} className="page-item disabled d-none d-sm-block">
                  <span className="page-link">…</span>
                </li>
              ) : (
                <li key={p} className={`page-item d-none d-sm-block ${p === page ? "active" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => onPageChange(p)}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </button>
                </li>
              )
            )}

            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
              <button type="button" className="page-link" onClick={() => onPageChange(page + 1)} aria-label="Next page">
                <i className="bi bi-chevron-right" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
