import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TSAUTH | Identity & Access Management",
  description: "Centralized authentication and multi-tenant authorization portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
