"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

function RegisterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string; terms?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrors({ name: "Name is required" });
      return;
    }

    if (!trimmedEmail) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }

    if (password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return;
    }

    if (!agreedToTerms) {
      setErrors({ terms: "You must agree to the terms and privacy policy" });
      return;
    }

    setIsLoading(true);

    try {
      console.log("SIGNUP ATTEMPT:", { email: trimmedEmail, fullName: trimmedName });

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: trimmedName
          }
        }
      });

      console.log("SIGNUP RESPONSE:", data);
      console.log("SIGNUP USER METADATA:", data?.user?.user_metadata);

      if (error) {
        console.error("SIGNUP ERROR:", error);
        setErrors({ general: error.message });
        return;
      }

      if (data.user) {
        console.log("SIGNUP SUCCESS - USER ID:", data.user.id);
        console.log("SIGNUP SUCCESS - METADATA:", data.user.user_metadata);

        setSignupSuccess(true);
      }
    } catch (err) {
      console.error("SIGNUP CATCH ERROR:", err);
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-md animate-slide-up pb-8">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-800">
              {signupSuccess ? "Account Created Successfully!" : "Create Account"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-surface-600"
            >
              <X size={20} />
            </button>
          </div>
          {!signupSuccess && <p className="text-xs text-surface-500 mt-1">Step into professional management</p>}
        </div>

        {signupSuccess ? (
          <div className="px-6 py-8 text-center animate-fade-in">
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-surface-600 text-sm mb-4">
                We&apos;ve sent a verification link to your email. Please confirm your account, then log in.
              </p>
              <p className="text-surface-500 text-sm mb-6">
                After verifying your email, return to the app and log in.
              </p>
              <p className="text-surface-400 text-xs italic">
                Didn&apos;t receive the email? Check your spam folder.
              </p>
            </div>
          </div>
        ) : (
          <>
            {errors.general && (
              <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 space-y-4">
              <div>
                <label htmlFor="register-name" className="label-medium text-surface-600 mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  id="register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-4 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px] ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Enter Full Name"
                  autoComplete="name"
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="register-email" className="label-medium text-surface-600 mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  id="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-4 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px] ${errors.email ? "border-red-500" : ""}`}
                  placeholder="Enter Email Address"
                  autoComplete="email"
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="register-password" className="label-medium text-surface-600 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="register-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-4 pr-12 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px] ${errors.password ? "border-red-500" : ""}`}
                    placeholder="Enter Password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-surface-300 text-primary focus:ring-primary"
                />
                <label htmlFor="agree-terms" className="text-sm text-surface-600">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && <p className="text-sm text-red-500 -mt-2">{errors.terms}</p>}

              <button 
                type="submit" 
                className="w-full bg-primary text-white font-semibold py-4 rounded-xl transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                    Creating account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </button>

              <p className="text-center text-sm text-surface-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onClose}
                  className="text-primary font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );

}

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (user?.email_confirmed_at) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrors({ general: error.message });
        setIsLoading(false);
        return;
      }

      console.log("LOGIN SUCCESS - USER:", data.user);
      console.log("LOGIN SUCCESS - USER METADATA:", data.user?.user_metadata);

      if (data.user && !data.user.email_confirmed_at) {
        setErrors({ general: "Please verify your email before logging in. Check your inbox for the verification link." });
        setIsLoading(false);
        return;
      }

      setUser(data.user);
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        },
      });
      
      if (error) {
        setErrors({ general: error.message || "Google login failed" });
        setIsGoogleLoading(false);
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-[280px] h-[140px] mb-6 relative -mt-16">
          <Image
            src="/brand identity.svg"
            alt="ReceiptVault"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-primary mb-1">Welcome Back</h1>
            <p className="text-surface-500 text-sm">Sign in to continue tracking your expenses</p>
          </div>

          {errors.general && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-medium text-surface-600 mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-4 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px] ${errors.email ? "border-red-500" : ""}`}
                placeholder="Enter Email Address"
                autoComplete="email"
                disabled={isLoading}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label-medium text-surface-600 mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-4 pr-12 border border-surface-200 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-[#B1B1B1] placeholder:font-[14px] placeholder:font-medium placeholder:leading-[16px] placeholder:tracking-[-0.14px] ${errors.password ? "border-red-500" : ""}`}
                  placeholder="Enter Password"
                  autoComplete="current-password"
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
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-primary font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              className="w-full bg-primary text-white font-semibold py-4 rounded-xl transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <button 
            onClick={handleGoogleLogin}
            className="mt-6 w-full bg-white border border-surface-200 text-surface-700 font-medium py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-50 transition-colors"
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.96 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.96 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="mt-8 text-center">
            <p className="text-surface-500 text-sm">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setShowRegister(true)}
                className="text-primary font-semibold transition-colors"
              >
                Create one
              </button>
            </p>
          </div>

          <p className="text-center text-xs text-surface-400 mt-10">
            Snap. Tag. Report. Done.
          </p>
        </div>
      </div>

      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
    </div>
  );
}