import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import "./globals.css";

// PROVISIONAL: swap for the reference site's typefaces (or licensed equivalents) once analysed.
const body = Inter({ variable: "--font-body", subsets: ["latin", "latin-ext"] });
const heading = Inter_Tight({ variable: "--font-heading", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "One United Properties — Bucharest",
  description: "Sustainable residential and mixed-use developments in Bucharest.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${heading.variable} antialiased`}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
