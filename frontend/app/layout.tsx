
"use client";

import Layout from "./layout_main";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
