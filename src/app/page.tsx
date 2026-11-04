import { redirect } from "next/navigation";

// The panel has no landing page — send visitors straight to the dashboard.
export default function Home() {
  redirect("/dashboard");
}
