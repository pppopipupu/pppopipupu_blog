import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pppopipupu",
  description: "I'm the miserable...",
};

import DynamicGlassOverlay from "@/components/DynamicGlassOverlay";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <DynamicGlassOverlay />
        {children}
      </body>
    </html>
  );
}
