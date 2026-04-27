"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setErrors({ general: "All fields are required" });
      return;
    }

    if (trimmedName.length < 2) {
      setErrors({ fullName: "Name must be at least 2 characters" });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    if (trimmedPassword.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    if (!acceptTerms) {
      setErrors({ terms: "You must accept the terms and conditions" });
      return;
    }

    setIsLoading(true);

    try {
      console.log("REGISTER ATTEMPT:", { email: trimmedEmail, fullName: trimmedName });

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: trimmedName
          }
        }
      });

      console.log("REGISTER RESPONSE:", data);
      console.log("REGISTER USER METADATA:", data?.user?.user_metadata);

      if (error) {
        console.error("REGISTER ERROR:", error);
        setErrors({ general: error.message });
        return;
      }

      if (data.user) {
        console.log("REGISTER SUCCESS - USER ID:", data.user.id);
        console.log("REGISTER SUCCESS - METADATA:", data.user.user_metadata);
        
        setIsSuccess(true);
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="auth-card animate-fade-in">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-800 mb-3">Account Created Successfully!</h1>
            <p className="text-surface-600 text-sm mb-2">
              We&apos;ve sent a verification link to your email. Please confirm your account, then log in.
            </p>
            <p className="text-surface-500 text-sm mb-6">
              After verifying your email, return to the app and log in.
            </p>
            <p className="text-surface-400 text-xs">
              Didn&apos;t receive the email? Check your spam folder.
            </p>
            <Link
              href="/login"
              className="mt-8 text-primary font-semibold text-sm hover:underline"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-card animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-surface-800 mb-2">Create Account</h1>
          <p className="text-surface-500">Start tracking your expenses in seconds</p>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-slide-up">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`input-field ${errors.fullName ? "input-field-error" : ""}`}
              placeholder="John Doe"
              autoComplete="name"
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="error-message">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.fullName}
              </p>
            )}
          </div>

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
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="error-message">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-field pr-12 ${errors.password ? "input-field-error" : ""}`}
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-surface-200"
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength > 0 && (
                  <p className="text-xs text-surface-500">
                    Password strength: {strengthLabels[passwordStrength - 1]}
                  </p>
                )}
              </div>
            )}
            {errors.password && (
              <p className="error-message">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input-field ${errors.confirmPassword ? "input-field-error" : ""}`}
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="error-message">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setAcceptTerms(!acceptTerms)}
              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                acceptTerms
                  ? "bg-primary border-primary"
                  : errors.terms
                  ? "border-red-500"
                  : "border-surface-300 hover:border-primary"
              }`}
              aria-label="Accept terms and conditions"
            >
              {acceptTerms && <Check size={14} className="text-white" />}
            </button>
            <label className="text-sm text-surface-600 cursor-pointer">
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="error-message -mt-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.terms}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-surface-500 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary-600 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
