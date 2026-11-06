"use client";

import { ReactNode, useEffect } from "react";

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  /** While true (e.g. waiting for the API) the buttons are disabled and the dialog can't be closed. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Bootstrap modal markup, controlled by React. Used before destructive actions. */
export default function ConfirmDialog({
  show,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancel = () => {
    if (!loading) onCancel();
  };

  useEffect(() => {
    if (!show) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    document.body.classList.add("overflow-hidden");
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [show, onCancel, loading]);

  if (!show) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        tabIndex={-1}
        onClick={cancel}
      >
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-body p-4">
              <div className="d-flex gap-3">
                <span
                  className={`hf-icon-circle rounded-circle d-inline-flex align-items-center justify-content-center bg-${variant}-subtle text-${variant}`}
                >
                  <i className={`bi ${variant === "danger" ? "bi-exclamation-triangle" : "bi-info-circle"}`} />
                </span>
                <div>
                  <h5 id="confirm-dialog-title" className="fs-6 fw-semibold text-body-emphasis mb-1">
                    {title}
                  </h5>
                  <div className="text-secondary">{message}</div>
                </div>
              </div>
            </div>
            {/* Buttons stack full-width on phones, sit side by side from 576px */}
            <div className="d-flex flex-column-reverse flex-sm-row justify-content-sm-end gap-2 px-4 pb-4">
              <button type="button" className="btn btn-light border" onClick={cancel} disabled={loading}>
                {cancelLabel}
              </button>
              <button type="button" className={`btn btn-${variant}`} onClick={onConfirm} disabled={loading} autoFocus>
                {loading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
