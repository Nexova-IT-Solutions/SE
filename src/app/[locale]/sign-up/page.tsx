"use client";

import { useState } from "react";
import { Header, Footer, SectionHeading, CartDrawer } from "@/components/giftbox";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SocialLoginButton } from "@/components/SocialLoginButton";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const REQUIRED_FIELD_MESSAGE = "This field is required.";

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
    email: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE).email("Please enter a valid email address"),
    password: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE).min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().trim().min(1, REQUIRED_FIELD_MESSAGE),
    marketingConsent: z.boolean(),
    privacyConsent: z.literal(true, "You must agree to the privacy policy to create an account"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();
  const localePrefix = pathname.split("/")[1];
  const locale = ["en", "si", "ta"].includes(localePrefix) ? localePrefix : "en";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "password" | "confirmPassword" | "privacyConsent", string>>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = signUpSchema.safeParse({ name, email, password, confirmPassword, marketingConsent, privacyConsent });
    if (!parsed.success) {
      const nextErrors: Partial<Record<"name" | "email" | "password" | "confirmPassword" | "privacyConsent", string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "name" | "email" | "password" | "confirmPassword" | "privacyConsent";
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, marketingConsent, privacyConsent }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to register");
      }

      toast({
        title: "Success!",
        description: "Your account has been created. Please sign in.",
      });

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("recentlyViewed");
        window.localStorage.removeItem("recently_viewed");
      }

      router.push("/sign-in");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 md:px-8 lg:px-10">
        <div className="w-full max-w-[1200px] grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="hidden lg:block rounded-[2rem] border border-brand-border bg-gradient-to-br from-[#FDF9E8] via-white to-[#F4FAF8] p-8 shadow-sm">
            <div className="sticky top-24 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#315243]">Join Skyish & Earthly</p>
              <h1 className="text-4xl font-bold text-[#1F1720] leading-tight">
                Create an account for faster checkout, saved preferences, and order updates.
              </h1>
              <p className="text-base leading-7 text-[#6B5A64] max-w-xl">
                Your account helps us personalize gifting recommendations, keep delivery details ready, and make repeat purchases easier.
              </p>
            </div>
          </div>

        <div className="w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-brand-border">
          <SectionHeading title="Create Account" subtitle="Join Skyish & Earthly today" />

          <div className="mt-8 space-y-3">
            <SocialLoginButton provider="google" label="Continue with Google" />
            <SocialLoginButton provider="tiktok" label="Continue with TikTok" />
            <SocialLoginButton provider="facebook" label="Continue with Facebook" />
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-brand-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#6B5A64]">Or continue with email</span>
              </div>
            </div>
          </div>

          <form className="mt-4 space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <Label required className="text-sm font-medium text-[#1F1720]">Full Name</Label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="full name"
                  className="mt-1"
                />
                {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
              </div>
              <div>
                <Label required className="text-sm font-medium text-[#1F1720]">Email address</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1"
                />
                {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email}</p> : null}
              </div>
              <div>
                <Label required className="text-sm font-medium text-[#1F1720]">Password</Label>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="mt-1"
                  minLength={6}
                />
                {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password}</p> : null}
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1720]">Confirm Password</label>
                <PasswordInput
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="mt-1"
                  minLength={6}
                />
                {errors.confirmPassword ? <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p> : null}
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-brand-border bg-slate-50 px-4 py-3 text-sm text-[#3A2B35]">
                <Checkbox
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                  className="mt-0.5 size-5 rounded-md"
                />
                <span className="leading-6">
                  I consent to Skyish & Earthly processing my personal data in order to send personalized marketing material in accordance with the consent form and the privacy policy.
                </span>
              </label>

              <label className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors",
                privacyConsent ? "border-[#315243] bg-[#FDF9E8]/40" : "border-brand-border bg-slate-50"
              )}>
                <Checkbox
                  checked={privacyConsent}
                  onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
                  className="mt-0.5 size-5 rounded-md"
                  aria-invalid={Boolean(errors.privacyConsent)}
                />
                <span className="leading-6">
                  By clicking &apos;create account&apos;, I consent to the privacy policy.
                </span>
              </label>
              {errors.privacyConsent ? <p className="text-sm text-red-600">{errors.privacyConsent}</p> : null}
            </div>

            <Button
              type="submit"
              disabled={loading || !privacyConsent}
              className="w-full bg-[#315243] hover:bg-[#1A3026] text-white"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-[#6B5A64]">
              By creating an account, you agree to our: {" "}
              <Link href={`/${locale}/terms-of-conditions`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#9B854A] hover:underline">
                TERMS OF CONDITIONS
              </Link>{" "}|{" "}
              <Link href={`/${locale}/privacy-policy`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#9B854A] hover:underline">
                PRIVACY POLICY
              </Link>
            </p>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-[#6B5A64]">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-[#9B854A] hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
