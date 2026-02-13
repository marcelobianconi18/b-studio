
"use client";

import Layout from "./layout_main";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050505]">
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
