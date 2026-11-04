"use client";

import Link from "next/link";
import { useState } from "react";
import { SuccessToaster } from "@/components/Toaster";
import PageHeader from "@/core/comman/PageHeader";
import StatCard from "@/core/comman/StatCard";
import type { Candidate, CvFileType } from "@/data/candidates";
import type { Job } from "@/data/jobs";
import { formatDate } from "@/utils/format";
import CandidateRanking from "./components/CandidateRanking";
import CriteriaSummary from "./components/CriteriaSummary";
import CvUploader from "./components/CvUploader";

interface JobDetailsProps {
  job: Job;
  initialCandidates: Candidate[];
}

export default function JobDetails({ job, initialCandidates }: JobDetailsProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);

  const stats = {
    total: candidates.length,
    analyzed: candidates.filter((c) => c.status === "completed").length,
    inProgress: candidates.filter((c) => c.status === "queued" || c.status === "processing").length,
    failed: candidates.filter((c) => c.status === "failed").length,
  };

  /**
   * Static stand-in for POST /jobs/:id/cvs: the API stores the files, queues one
   * RabbitMQ job per CV and answers immediately. New rows start as "Queued";
   * here we only simulate the worker picking them up.
   */
  const handleUpload = (files: { file: File; type: CvFileType }[]) => {
    const batchId = Date.now();
    const newRows: Candidate[] = files.map(({ file, type }, index) => ({
      id: `upload-${batchId}-${index}`,
      jobId: job.id,
      fileName: file.name,
      fileType: type,
      fileSizeKb: file.size / 1024,
      cvUrl: "",
      status: "queued",
      uploadedAt: new Date().toISOString(),
    }));
    const ids = new Set(newRows.map((row) => row.id));

    setCandidates((prev) => [...prev, ...newRows]);
    SuccessToaster(`${files.length} CV${files.length > 1 ? "s" : ""} uploaded and queued for AI analysis.`);

    setTimeout(() => {
      setCandidates((prev) => prev.map((c) => (ids.has(c.id) && c.status === "queued" ? { ...c, status: "processing" } : c)));
    }, 2500);
  };

  return (
    <>
      <PageHeader
        title={job.title}
        description={job.description || `Created ${formatDate(job.createdAt)}`}
        actions={
          <>
            <Link href={`/jobs/${job.id}/edit`} className="btn btn-light border d-inline-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-sliders" aria-hidden="true" />
              Edit Criteria
            </Link>
            <a href="#upload" className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
              Upload CVs
            </a>
          </>
        }
      />

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard label="Total CVs" value={stats.total} icon="bi-files" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Analyzed" value={stats.analyzed} icon="bi-check2-circle" tone="success" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="In Progress" value={stats.inProgress} icon="bi-arrow-repeat" tone="info" hint="Queued or processing" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard label="Failed" value={stats.failed} icon="bi-exclamation-triangle" tone="danger" />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-5 col-xxl-4">
          <CriteriaSummary job={job} />
        </div>
        <div id="upload" className="col-12 col-xl-7 col-xxl-8 hf-anchor">
          <CvUploader existingFileNames={candidates.map((c) => c.fileName)} onUpload={handleUpload} />
        </div>
      </div>

      <div id="ranking" className="hf-anchor">
        <CandidateRanking job={job} candidates={candidates} />
      </div>
    </>
  );
}
