import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniStudy AI — Interactive Study & Quiz Generator",
  description: "Transform free-form notes and topics into interactive flashcards, diagnostic quizzes with re-testing, and key takeaways.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
