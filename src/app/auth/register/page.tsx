import type { Metadata } from "next";
import RegisterPage from "@/containers/Register";

export const metadata: Metadata = { title: "Create Account | HireFlow AI" };

export default function Register() {
  return <RegisterPage />;
}
