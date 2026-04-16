import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReceiptVault - Snap. Tag. Report. Done.",
  description: "Mobile-first expense tracking for freelancers and small business owners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        {children}
      </body>
    </html>
  );
}
