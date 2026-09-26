import type { Metadata } from "next";
import { connection } from "next/server";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { siteUrl, description } from "@/lib/site";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Perpetual Labs — Ideas in motion",
    template: "%s | Perpetual Labs",
  },
  description,
  openGraph: {
    title: "Perpetual Labs — Ideas in motion",
    description,
    type: "website",
    siteName: "Perpetual Labs",
  },
  twitter: { card: "summary_large_image" },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body id="top">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
