"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial online status
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-3 inset-x-0 z-[110] flex justify-center px-4 pointer-events-none animate-fade-in-down">
      <div className="bg-destructive/90 text-destructive-foreground backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-destructive/30 flex items-center gap-2 text-xs font-semibold">
        <WifiOff size={14} className="animate-pulse" />
        <span>Offline Mode — Changes will sync when connected</span>
      </div>
    </div>
  );
}
