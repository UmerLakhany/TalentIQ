import type { Metadata } from "next";
import { Suspense } from "react";
import ChangePasswordPage from "@/containers/Auth/ChangePassword";

export const metadata: Metadata = { title: "Change Password | HireFlow AI" };

export default function ChangePassword() {
  // The page reads ?token= from the URL, which needs a Suspense boundary in Next.js
  return (
    <Suspense fallback={null}>
      <ChangePasswordPage />
    </Suspense>
  );
}
