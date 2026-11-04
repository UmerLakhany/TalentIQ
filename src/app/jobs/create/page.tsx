import type { Metadata } from "next";
import JobForm from "@/containers/JobForm";

export const metadata: Metadata = { title: "Create Job | HireFlow AI" };

export default function CreateJob() {
  return <JobForm />;
}
