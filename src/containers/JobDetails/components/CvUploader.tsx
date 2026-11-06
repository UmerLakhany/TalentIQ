"use client";

import { DragEvent, useState } from "react";
import type { CvFileType } from "@/data/candidates";
import { formatFileSize } from "@/utils/format";

export const MAX_FILES_PER_BATCH = 15;
export const MAX_FILE_SIZE_MB = 5;

interface SelectedFile {
  id: string;
  file: File;
  type: CvFileType | null;
  error: string | null;
}

interface CvUploaderProps {
  /** File names already uploaded for this job (duplicate check) */
  existingFileNames: string[];
  /**
   * Uploads the files. Resolves with the files the server refused (with the reason), or null if
   * the upload failed as a whole (the selection is then kept so the user can try again).
   */
  onUpload: (files: { file: File; type: CvFileType }[]) => Promise<{ fileName: string; reason: string }[] | null>;
}

const fileTypeOf = (name: string): CvFileType | null => {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".docx")) return "DOCX";
  return null;
};

export default function CvUploader({ existingFileNames, onUpload }: CvUploaderProps) {
  const [selected, setSelected] = useState<SelectedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length || uploading) return;
    setSelected((prev) => {
      const next = [...prev];
      for (const file of Array.from(incoming)) {
        const type = fileTypeOf(file.name);
        const validCount = next.filter((f) => !f.error).length;
        let error: string | null = null;

        if (!type) error = "Only PDF and DOCX files are supported.";
        else if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) error = `File is larger than ${MAX_FILE_SIZE_MB} MB.`;
        else if (file.size === 0) error = "File is empty.";
        else if (next.some((f) => f.file.name === file.name && f.file.size === file.size)) error = "Duplicate: already selected.";
        else if (existingFileNames.includes(file.name)) error = "Duplicate: already uploaded for this job.";
        else if (validCount >= MAX_FILES_PER_BATCH) error = `Batch limit reached (${MAX_FILES_PER_BATCH} files).`;

        next.push({ id: `${file.name}-${file.size}-${next.length}-${file.lastModified}`, file, type, error });
      }
      return next;
    });
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const valid = selected.filter((f) => !f.error);
  const invalidCount = selected.length - valid.length;

  const handleUpload = async () => {
    setUploading(true);
    try {
      const rejected = await onUpload(valid.map((f) => ({ file: f.file, type: f.type as CvFileType })));
      if (rejected === null) return; // request failed: keep the selection to try again

      // Accepted files leave the list; files the server refused stay, showing its reason
      const reasonByName = new Map(rejected.map((r) => [r.fileName, r.reason]));
      setSelected((prev) =>
        prev
          .filter((f) => reasonByName.has(f.file.name))
          .map((f) => ({ ...f, error: `Rejected by server: ${reasonByName.get(f.file.name)}` }))
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white px-3 px-lg-4 py-3">
        <h2 className="h6 fw-semibold text-body-emphasis mb-0">Upload CVs</h2>
        <p className="small text-secondary mb-0">
          Up to {MAX_FILES_PER_BATCH} CVs per batch. Each CV is analyzed in the background, so you can keep working.
        </p>
      </div>
      <div className="card-body px-3 px-lg-4">
        {/* Hidden input sits before the drop zone so its keyboard focus can outline it (see globals.css) */}
        <input
          id="cv-input"
          type="file"
          className="visually-hidden"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // allow selecting the same file again after removing it
          }}
        />
        {/* Drop zone (label → click opens the file picker) */}
        <label
          htmlFor="cv-input"
          className={`hf-dropzone d-flex flex-column align-items-center justify-content-center text-center rounded-3 p-4 ${
            dragging ? "is-dragging" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <span className="hf-stat-icon rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center mb-2">
            <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
          </span>
          <span className="fw-semibold text-body-emphasis">
            Drag &amp; drop CVs here, or <span className="text-primary text-decoration-underline">browse</span>
          </span>
          <span className="small text-secondary">PDF or DOCX · max {MAX_FILE_SIZE_MB} MB each</span>
        </label>

        {/* Selected files */}
        {selected.length > 0 && (
          <>
            <ul className="list-group mt-3 hf-file-list">
              {selected.map((item) => (
                <li key={item.id} className="list-group-item d-flex align-items-center gap-3">
                  <i
                    className={`bi fs-4 ${
                      item.type === "PDF" ? "bi-file-earmark-pdf text-danger" : item.type === "DOCX" ? "bi-file-earmark-word text-primary" : "bi-file-earmark text-secondary"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex-grow-1 min-w-0">
                    <div className="text-truncate fw-medium text-body-emphasis">{item.file.name}</div>
                    <div className="small">
                      <span className="text-secondary">
                        {item.type ?? "Unknown"} · {formatFileSize(item.file.size / 1024)}
                      </span>
                      {item.error ? (
                        <span className="text-danger ms-2">
                          <i className="bi bi-x-circle me-1" aria-hidden="true" />
                          {item.error}
                        </span>
                      ) : (
                        <span className="text-success ms-2">
                          <i className="bi bi-check-circle me-1" aria-hidden="true" />
                          Ready
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn hf-icon-btn rounded-3 flex-shrink-0"
                    onClick={() => setSelected((prev) => prev.filter((f) => f.id !== item.id))}
                    disabled={uploading}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 mt-3">
              <div className="small text-secondary">
                <span className="fw-semibold text-success">{valid.length} ready</span>
                {invalidCount > 0 && <span className="text-danger"> · {invalidCount} invalid (will be skipped)</span>}
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light border flex-grow-1" onClick={() => setSelected([])} disabled={uploading}>
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-grow-1 text-nowrap"
                  onClick={handleUpload}
                  disabled={valid.length === 0 || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stars me-1" aria-hidden="true" />
                      Upload &amp; Analyze ({valid.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
