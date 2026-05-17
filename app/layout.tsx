import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pppopipupu",
  description: "I'm the miserable...",
};

import DynamicGlassOverlay from "@/components/DynamicGlassOverlay";
import DynamicArcaneCursorTrail from "@/components/DynamicArcaneCursorTrail";

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
        <DynamicArcaneCursorTrail />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  var basePath = '${process.env.NEXT_PUBLIC_BASE_PATH || ""}';
                  navigator.serviceWorker.register(basePath + '/sw.js', { scope: basePath + '/' });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
