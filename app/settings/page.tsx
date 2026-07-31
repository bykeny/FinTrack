"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Sun, Moon, User, Shield, Sliders, Lock, KeyRound, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import { isPinEnabled, setPin, clearPin, lockNow } from "@/lib/pinStore";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Security state
  const [hasPin, setHasPin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

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
    setHasPin(isPinEnabled());
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

  const handleTogglePin = () => {
    if (hasPin) {
      clearPin();
      setHasPin(false);
      toast("PIN Lock disabled", "info");
    } else {
      setNewPin("");
      setConfirmPin("");
      setShowPinModal(true);
    }
  };

  const handleLockNow = () => {
    lockNow();
    toast("App Locked", "info");
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast("PIN must be exactly 4 digits", "error");
      return;
    }
    if (newPin !== confirmPin) {
      toast("PINs do not match", "error");
      return;
    }

    setPin(newPin);
    setHasPin(true);
    setShowPinModal(false);
    toast("4-Digit PIN saved! Passcode lock is now active.", "success");
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

        {/* Security & PIN Lock Section */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Lock size={18} />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Security & Passcode</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <KeyRound size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold">4-Digit App PIN Lock</p>
                  <p className="text-xs text-muted-foreground">
                    {hasPin ? "Passcode protection active" : "Require PIN on app launch"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleTogglePin}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors min-h-[44px] ${
                  hasPin
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                }`}
              >
                {hasPin ? "Disable PIN" : "Setup PIN"}
              </button>
            </div>

            {hasPin && (
              <div className="border-t border-border pt-3 flex gap-2">
                <button
                  onClick={handleLockNow}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-muted text-foreground font-bold text-xs hover:bg-border transition-all active:scale-95"
                >
                  <Lock size={14} />
                  Lock App Now
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Preferences Section */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '150ms' }}>
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

        {/* App Info */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
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

      {/* PIN Setup Modal */}
      {showPinModal && (
        <>
          <div 
            className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-sm"
            onClick={() => setShowPinModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[121] max-w-lg mx-auto bg-card rounded-t-3xl border-t border-border shadow-2xl p-6 space-y-4 animate-fade-in-up">
            <h2 className="text-lg font-bold text-foreground">Set 4-Digit Passcode</h2>
            <p className="text-xs text-muted-foreground">Create a PIN code to lock access to your financial data.</p>

            <form onSubmit={handleSavePin} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Enter New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full min-h-[48px] rounded-xl border border-border bg-background px-4 text-center text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Confirm 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  className="w-full min-h-[48px] rounded-xl border border-border bg-background px-4 text-center text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 min-h-[48px] rounded-xl bg-muted font-semibold text-sm hover:bg-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPin.length !== 4 || confirmPin.length !== 4}
                  className="flex-1 min-h-[48px] rounded-xl bg-accent text-accent-foreground font-bold text-sm shadow-sm hover:bg-accent/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={18} /> Save & Lock
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
