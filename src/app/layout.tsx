import type { Metadata } from "next";
import { AuthProvider } from "@/components/layout/auth-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHANTOM — Because showing up is optional.",
  description:
    "Phantom is an AI-powered student agent that attends class, writes drafts, tracks your GPA, and helps you graduate — all from the shadows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-phantom-bg font-sans text-phantom-text antialiased">
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
