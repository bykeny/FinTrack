"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if dismissed previously
    const isDismissed = localStorage.getItem("fintrack_pwa_dismissed") === "true";
    if (isDismissed) return;

    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (iosDevice) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("fintrack_pwa_dismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[90] max-w-lg mx-auto px-4 animate-fade-in-up">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Install FinTrack App</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to your home screen for faster access & offline tracking
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={18} />
          </button>
        </div>

        {isIOS ? (
          <div className="rounded-xl bg-muted p-2.5 text-xs text-muted-foreground flex items-center gap-2 border border-border mt-1">
            <Share size={16} className="text-accent shrink-0" />
            <span>Tap <strong className="text-foreground">Share</strong> in Safari, then tap <strong className="text-foreground">Add to Home Screen</strong>.</span>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 min-h-[40px] flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground font-bold text-xs shadow-sm hover:bg-accent/90 transition-all active:scale-95"
            >
              <Download size={16} />
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 min-h-[40px] rounded-xl bg-muted text-muted-foreground font-semibold text-xs hover:bg-border transition-colors"
            >
              Not Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
