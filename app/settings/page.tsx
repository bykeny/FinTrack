"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Sun, Moon, User, Shield, Sliders } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email ?? null);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast("Signed out successfully", "info");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Failed to sign out", "error");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      {/* Header */}
      <header className="mb-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </header>

      <div className="space-y-6">
        {/* User Account Section */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
              <p className="text-base font-bold text-foreground">
                {isLoading ? "Loading..." : userEmail || "Guest User"}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-2">
            <button
              onClick={handleSignOut}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-destructive/10 text-destructive font-bold transition-all hover:bg-destructive/20 active:scale-95"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Sliders size={18} />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Preferences</h2>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="text-sm font-semibold">Appearance</p>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Dark mode active" : "Light mode active"}
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl bg-muted font-semibold text-sm hover:bg-border transition-colors min-h-[44px]"
            >
              Toggle {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </section>

        {/* Security / App Info */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Shield size={18} />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Application</h2>
          </div>
          <div className="flex justify-between items-center text-sm py-1">
            <span className="text-muted-foreground">Version</span>
            <span className="font-semibold">1.0.0 (PWA)</span>
          </div>
          <div className="flex justify-between items-center text-sm py-1">
            <span className="text-muted-foreground">Database Engine</span>
            <span className="font-semibold">Supabase (RLS Enabled)</span>
          </div>
        </section>
      </div>
    </div>
  );
}
