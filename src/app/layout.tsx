import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";

export const metadata: Metadata = {
  title: "ReceiptVault - Snap. Tag. Report. Done.",
  description: "Mobile-first expense tracking for freelancers and small business owners",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#004d61",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
