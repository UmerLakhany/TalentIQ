import type { Metadata } from "next";
import LoginPage from "@/containers/Login";

export const metadata: Metadata = { title: "Login | HireFlow AI" };

export default function Login() {
  return <LoginPage />;
}
