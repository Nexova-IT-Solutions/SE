"use client";

import { useState } from "react";
import { Header, Footer, SectionHeading, CartDrawer } from "@/components/giftbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { SocialLoginButton } from "@/components/SocialLoginButton";

export default function SignInPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast({
        title: "Error",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    } else {
      const refreshedSession = await getSession();
      const destination = refreshedSession?.user?.role && refreshedSession.user.role !== "USER"
        ? "/admin"
        : "/";

      router.push(destination);
      router.refresh(); // Refresh to update session
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-brand-border">
          <SectionHeading title="Sign In" subtitle="Welcome back to Skyish & Earthly" />
          
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
                <label className="text-sm font-medium text-[#1F1720]">Email address</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1720]">Password</label>
                <PasswordInput
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                />
                <div className="mt-2 text-right">
                  <Link href="/auth/forgot-password" gap-2 className="text-xs font-medium text-[#9B854A] hover:text-[#315243] transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#315243] hover:bg-[#1A3026] text-white"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-[#6B5A64]">
              Don't have an account?{" "}
              <Link href="/sign-up" className="font-medium text-[#9B854A] hover:underline transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
