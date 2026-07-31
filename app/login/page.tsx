"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Wallet } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Please fill in all fields", "error");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast(error.message || "Invalid credentials", "error");
        console.error("Login Error:", error.message || error);
      } else {
        toast("Welcome back!", "success");
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login Exception:", err);
      toast(err.message || "An error occurred during login", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[85dvh] max-w-sm flex-col justify-center px-4 py-8">
      {/* App Header / Logo */}
      <div className="mb-8 text-center animate-fade-in-up">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Wallet size={32} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your finances</p>
      </div>

      {/* Login Form Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full min-h-[48px] rounded-xl border border-border bg-background pl-10 pr-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[48px] rounded-xl border border-border bg-background pl-10 pr-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground font-bold shadow-sm transition-all hover:bg-accent/90 disabled:opacity-50 mt-6 active:scale-95"
          >
            <LogIn size={18} />
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
