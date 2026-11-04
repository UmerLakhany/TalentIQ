import { z } from "zod";
import type { Job } from "@/data/jobs";

const skillType = z.enum(["mandatory", "preferred", "not_required"]);
const weightedType = z.enum(["mandatory", "preferred"]);

export const jobFormSchema = z
  .object({
    title: z.string().trim().min(3, "Enter the job position (at least 3 characters)."),
    description: z.string().trim().max(500, "Keep the description under 500 characters."),
    minExperience: z
      .number({ error: "Enter the minimum years of experience." })
      .min(0, "Experience can't be negative.")
      .max(40, "Enter a realistic number of years."),
    experienceType: weightedType,
    skills: z
      .array(z.object({ name: z.string().trim().min(1, "Enter a skill name."), type: skillType }))
      .min(1, "Add at least one technical skill."),
    education: z.object({ name: z.string().trim().max(200), type: weightedType }),
    otherRequirements: z.array(
      z.object({ name: z.string().trim().min(1, "Describe the requirement."), type: weightedType })
    ),
    reanalyze: z.boolean(),
  })
  .superRefine((values, ctx) => {
    // Same skill listed twice would be evaluated twice
    const seen = new Map<string, number>();
    values.skills.forEach((skill, index) => {
      const key = skill.name.trim().toLowerCase();
      if (!key) return;
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", path: ["skills", index, "name"], message: "This skill is already listed." });
      }
      seen.set(key, index);
    });
  });

export type JobFormValues = z.infer<typeof jobFormSchema>;

export const EMPTY_JOB_FORM: JobFormValues = {
  title: "",
  description: "",
  minExperience: 0,
  experienceType: "mandatory",
  skills: [{ name: "", type: "mandatory" }],
  education: { name: "", type: "preferred" },
  otherRequirements: [],
  reanalyze: true,
};

/** Maps a stored job (requirements list) back into form fields. */
export function jobToFormValues(job: Job): JobFormValues {
  const experience = job.requirements.find((r) => r.category === "experience");
  const education = job.requirements.find((r) => r.category === "education");
  const asWeighted = (type: string) => (type === "preferred" ? "preferred" : "mandatory") as "mandatory" | "preferred";

  return {
    title: job.title,
    description: job.description,
    minExperience: job.minExperience,
    experienceType: asWeighted(experience?.type ?? "mandatory"),
    skills: job.requirements.filter((r) => r.category === "skill").map((r) => ({ name: r.name, type: r.type })),
    education: { name: education?.name ?? "", type: asWeighted(education?.type ?? "preferred") },
    otherRequirements: job.requirements
      .filter((r) => r.category === "other")
      .map((r) => ({ name: r.name, type: asWeighted(r.type) })),
    reanalyze: true,
  };
}
