import { redirect } from "next/navigation";

// The panel starts at the Dashboard.
export default function Home() {
  redirect("/dashboard");
}
