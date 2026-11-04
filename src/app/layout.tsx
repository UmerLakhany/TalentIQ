import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapJs from "@/components/bootstrap-js/bootstrapjs";
import { ToasterContainer } from "@/components/Toaster";
import DashboardLayout from "@/core/comman/DashboardLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HireFlow AI",
  description: "AI-powered CV screening and recruitment management platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-bs-theme="light"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DashboardLayout>{children}</DashboardLayout>
        <ToasterContainer />
        <BootstrapJs />
      </body>
    </html>
  );
}
