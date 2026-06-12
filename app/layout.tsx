import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech News Collage",
  description: "Daily tech news collage with AI topic summarization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}