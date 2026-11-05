import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailPage from "@/containers/VerifyEmail";

export const metadata: Metadata = { title: "Verify Email | HireFlow AI" };

export default function VerifyEmail() {
  // The page reads ?email= from the URL, which needs a Suspense boundary in Next.js
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage />
    </Suspense>
  );
}
