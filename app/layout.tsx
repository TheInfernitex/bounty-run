import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bounty Run",
  description: "The most therapeutic game you'll ever get to play...",
  icons: {
    icon: "/assets/star.png", // 👈 This sets your favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
