"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { SuccessToaster } from "@/components/Toaster";
import PageHeader from "@/core/comman/PageHeader";
import type { Job } from "@/data/jobs";
import { SCORE_WEIGHTS } from "@/utils/scoring";
import { EMPTY_JOB_FORM, jobFormSchema, jobToFormValues, type JobFormValues } from "./schema";

interface JobFormProps {
  /** Present when editing */
  job?: Job;
  /** CVs already analyzed for this job (edit mode) */
  analyzedCount?: number;
}

function FormSection({ icon, title, description, children }: { icon: string; title: string; description: string; children: ReactNode }) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex gap-3 mb-3">
          <span className="hf-icon-circle rounded-3 bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center">
            <i className={`bi ${icon}`} aria-hidden="true" />
          </span>
          <div>
            <h2 className="h6 fw-semibold text-body-emphasis mb-0">{title}</h2>
            <p className="small text-secondary mb-0">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function JobForm({ job, analyzedCount = 0 }: JobFormProps) {
  const router = useRouter();
  const isEdit = Boolean(job);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: job ? jobToFormValues(job) : EMPTY_JOB_FORM,
  });

  const skills = useFieldArray({ control, name: "skills" });
  const others = useFieldArray({ control, name: "otherRequirements" });
  const values = useWatch({ control });

  // Live summary for the side panel
  const allTypes = [
    values.experienceType,
    ...(values.skills ?? []).map((s) => s?.type),
    ...(values.education?.name?.trim() ? [values.education.type] : []),
    ...(values.otherRequirements ?? []).map((o) => o?.type),
  ];
  const counts = {
    mandatory: allTypes.filter((t) => t === "mandatory").length,
    preferred: allTypes.filter((t) => t === "preferred").length,
    notRequired: allTypes.filter((t) => t === "not_required").length,
  };

  const onSubmit = (data: JobFormValues) => {
    // Static for now — will POST /jobs or PUT /jobs/:id once the API is connected
    if (job) {
      SuccessToaster(
        data.reanalyze && analyzedCount > 0
          ? `Criteria updated. ${analyzedCount} CVs queued for re-analysis.`
          : "Criteria updated."
      );
      router.push(`/jobs/${job.id}`);
    } else {
      SuccessToaster(`Job "${data.title}" created.`);
      router.push("/jobs");
    }
  };

  const cancelHref = job ? `/jobs/${job.id}` : "/jobs";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader
        title={isEdit ? `Edit Criteria · ${job?.title}` : "Create Job"}
        description={
          isEdit
            ? "Update the requirements the AI uses to evaluate CVs for this job."
            : "Define the position and the requirements the AI will evaluate each CV against."
        }
      />

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          {/* Re-analysis notice (edit mode, CVs already scored) */}
          {isEdit && analyzedCount > 0 && (
            <div className="alert alert-warning d-flex gap-3 mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill fs-5" aria-hidden="true" />
              <div>
                <div className="fw-semibold">
                  {analyzedCount} CVs were already analyzed with the current criteria.
                </div>
                <div className="small mb-2">Their scores won&apos;t reflect your changes unless they are re-analyzed.</div>
                <div className="form-check mb-0">
                  <input className="form-check-input" type="checkbox" id="reanalyze" {...register("reanalyze")} />
                  <label className="form-check-label small fw-medium" htmlFor="reanalyze">
                    Re-analyze existing CVs with the updated criteria
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 1. Job details */}
          <FormSection icon="bi-briefcase" title="Job details" description="The position you are hiring for.">
            <div className="mb-3">
              <label htmlFor="title" className="form-label fw-medium">
                Job position <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                className={`form-control ${errors.title ? "is-invalid" : ""}`}
                placeholder="e.g. Full-Stack Developer"
                {...register("title")}
              />
              {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
            </div>
            <div>
              <label htmlFor="description" className="form-label fw-medium">
                Description <span className="text-secondary fw-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                className={`form-control ${errors.description ? "is-invalid" : ""}`}
                placeholder="A short summary of the role"
                {...register("description")}
              />
              {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
            </div>
          </FormSection>

          {/* 2. Experience */}
          <FormSection icon="bi-hourglass-split" title="Experience" description="Minimum years of professional experience.">
            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <label htmlFor="minExperience" className="form-label fw-medium">
                  Minimum years <span className="text-danger">*</span>
                </label>
                <input
                  id="minExperience"
                  type="number"
                  min={0}
                  step={0.5}
                  className={`form-control ${errors.minExperience ? "is-invalid" : ""}`}
                  {...register("minExperience", { valueAsNumber: true })}
                />
                {errors.minExperience && <div className="invalid-feedback">{errors.minExperience.message}</div>}
              </div>
              <div className="col-12 col-sm-6">
                <label htmlFor="experienceType" className="form-label fw-medium">
                  Requirement type
                </label>
                <select id="experienceType" className="form-select" {...register("experienceType")}>
                  <option value="mandatory">Mandatory</option>
                  <option value="preferred">Preferred</option>
                </select>
              </div>
            </div>
          </FormSection>

          {/* 3. Technical skills */}
          <FormSection
            icon="bi-code-slash"
            title="Technical skills"
            description="Mark each skill Mandatory, Preferred, or Not required (the AI ignores Not required skills)."
          >
            <div className="d-flex flex-column gap-2">
              {skills.fields.map((field, index) => (
                <div key={field.id} className="row g-2 align-items-start">
                  <div className="col-12 col-sm-7">
                    <input
                      className={`form-control ${errors.skills?.[index]?.name ? "is-invalid" : ""}`}
                      placeholder="e.g. TypeScript, or React.js or Next.js"
                      aria-label={`Skill ${index + 1} name`}
                      {...register(`skills.${index}.name`)}
                    />
                    {errors.skills?.[index]?.name && (
                      <div className="invalid-feedback">{errors.skills[index]?.name?.message}</div>
                    )}
                  </div>
                  <div className="col">
                    <select className="form-select" aria-label={`Skill ${index + 1} type`} {...register(`skills.${index}.type`)}>
                      <option value="mandatory">Mandatory</option>
                      <option value="preferred">Preferred</option>
                      <option value="not_required">Not required</option>
                    </select>
                  </div>
                  <div className="col-auto">
                    <button
                      type="button"
                      className="btn btn-outline-danger hf-icon-btn"
                      onClick={() => skills.remove(index)}
                      disabled={skills.fields.length === 1}
                      aria-label={`Remove skill ${index + 1}`}
                      title="Remove"
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.skills?.root?.message && <div className="text-danger small mt-2">{errors.skills.root.message}</div>}
            {errors.skills?.message && <div className="text-danger small mt-2">{errors.skills.message}</div>}
            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-3"
              onClick={() => skills.append({ name: "", type: "mandatory" })}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Add skill
            </button>
          </FormSection>

          {/* 4. Education */}
          <FormSection icon="bi-mortarboard" title="Education" description="Leave blank if there is no education requirement.">
            <div className="row g-2">
              <div className="col-12 col-sm-8">
                <input
                  className="form-control"
                  placeholder="e.g. Bachelor's degree in Computer Science or related field"
                  aria-label="Education requirement"
                  {...register("education.name")}
                />
              </div>
              <div className="col-12 col-sm-4">
                <select className="form-select" aria-label="Education requirement type" {...register("education.type")}>
                  <option value="mandatory">Mandatory</option>
                  <option value="preferred">Preferred</option>
                </select>
              </div>
            </div>
          </FormSection>

          {/* 5. Other requirements */}
          <FormSection
            icon="bi-list-check"
            title="Other requirements"
            description="Anything else the AI should check, e.g. “Experience building scalable applications”."
          >
            {others.fields.length === 0 && <p className="small text-secondary mb-0">No other requirements added.</p>}
            <div className="d-flex flex-column gap-2">
              {others.fields.map((field, index) => (
                <div key={field.id} className="row g-2 align-items-start">
                  <div className="col-12 col-sm-7">
                    <input
                      className={`form-control ${errors.otherRequirements?.[index]?.name ? "is-invalid" : ""}`}
                      placeholder="Describe the requirement"
                      aria-label={`Requirement ${index + 1}`}
                      {...register(`otherRequirements.${index}.name`)}
                    />
                    {errors.otherRequirements?.[index]?.name && (
                      <div className="invalid-feedback">{errors.otherRequirements[index]?.name?.message}</div>
                    )}
                  </div>
                  <div className="col">
                    <select
                      className="form-select"
                      aria-label={`Requirement ${index + 1} type`}
                      {...register(`otherRequirements.${index}.type`)}
                    >
                      <option value="mandatory">Mandatory</option>
                      <option value="preferred">Preferred</option>
                    </select>
                  </div>
                  <div className="col-auto">
                    <button
                      type="button"
                      className="btn btn-outline-danger hf-icon-btn"
                      onClick={() => others.remove(index)}
                      aria-label={`Remove requirement ${index + 1}`}
                      title="Remove"
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-3"
              onClick={() => others.append({ name: "", type: "preferred" })}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Add requirement
            </button>
          </FormSection>
        </div>

        {/* Summary + actions (sticky on large screens) */}
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm hf-sticky-panel">
            <div className="card-body p-3 p-lg-4">
              <h2 className="h6 fw-semibold text-body-emphasis mb-3">Criteria summary</h2>
              <ul className="list-group list-group-flush mb-3">
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span>Mandatory</span>
                  <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis">{counts.mandatory}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span>Preferred</span>
                  <span className="badge rounded-pill bg-info-subtle text-info-emphasis">{counts.preferred}</span>
                </li>
                <li className="list-group-item px-0 d-flex justify-content-between">
                  <span>Not required (ignored)</span>
                  <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis">{counts.notRequired}</span>
                </li>
              </ul>
              <div className="small text-secondary bg-body border rounded-3 p-3 mb-3">
                <div className="fw-semibold text-body-emphasis mb-1">
                  <i className="bi bi-stars text-primary me-1" aria-hidden="true" />
                  How candidates are scored
                </div>
                The AI checks each requirement against evidence in the CV. The match score weights mandatory requirements{" "}
                {SCORE_WEIGHTS.mandatory}% and preferred {SCORE_WEIGHTS.preferred}%. Any mandatory requirement that
                isn&apos;t met is flagged separately, so a high score can&apos;t hide it.
              </div>
              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  <i className="bi bi-check2 me-1" aria-hidden="true" />
                  {isEdit ? "Save Criteria" : "Create Job"}
                </button>
                <Link href={cancelHref} className="btn btn-light border">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
