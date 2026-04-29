"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    } else if (!validateEmail(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrors({ general: error.message || "Failed to send reset link" });
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-[280px] h-[180px] mb-8 relative">
            <img
              src="/icons/brand-identity.svg"
              alt="ReceiptVault"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="w-full max-w-sm text-center">
            <div className="bg-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-800 mb-2">Check Your Email</h1>
            <p className="text-surface-500 text-sm mb-6">
              We&apos;ve sent a password reset link to {email}
            </p>
            <p className="text-sm text-surface-500 mb-6">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setIsSuccess(false)}
                className="text-primary font-medium"
              >
                try again
              </button>
            </p>
            <Link
              href="/login"
              className="text-primary font-medium text-sm"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-[280px] h-[180px] mb-8 relative">
          <img
            src="/icons/brand-identity.svg"
            alt="ReceiptVault"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-surface-800 mb-1">Change Password</h1>
            <p className="text-surface-500 text-sm">
              Enter your email and we&apos;ll send you a link to change your password
            </p>
          </div>

          {errors.general && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-field ${errors.email ? "input-field-error" : ""}`}
                placeholder="Enter Email Address"
                autoComplete="email"
                disabled={isLoading}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            <button 
              type="submit" 
              className="btn-primary flex items-center justify-center gap-2 mt-6" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <div className="flex justify-end mt-4">
              <Link
                href="/profile"
                className="flex items-center gap-1 text-sm text-surface-600"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}