"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  const sections = [
    {
      title: "Introduction",
      content: "Welcome to ReceiptVault. By using our application, you agree to the terms outlined here. This app is designed to help you track and manage your business expenses efficiently."
    },
    {
      title: "Usage",
      content: "You are responsible for the accuracy of the data you enter. ReceiptVault is intended for personal and business expense tracking. Misuse or attempt to compromise the application's security is strictly prohibited."
    },
    {
      title: "Data & Privacy",
      content: "Your privacy is important to us. We collect your email for authentication and account management. Your expense data and receipts are stored securely and are only accessible by you. We do not sell your personal data to third parties."
    },
    {
      title: "Uploads",
      content: "Receipt images you upload are stored in secure cloud storage. You retain ownership of all images. We recommend not uploading sensitive personal identification documents."
    },
    {
      title: "Disclaimer",
      content: "ReceiptVault is provided 'as is' without warranties of any kind. While we strive for 100% uptime and data integrity, we are not liable for any data loss or financial discrepancies resulting from the use of this app."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-1 -ml-1 text-surface-600 hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-surface-900">Terms & Privacy</h1>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-md mx-auto px-5 py-6">
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider">
                {section.title}
              </h2>
              <p className="text-surface-700 leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-surface-200 text-center">
          <p className="text-xs text-surface-400">
            © {new Date().getFullYear()} ReceiptVault. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
