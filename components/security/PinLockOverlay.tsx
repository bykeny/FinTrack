"use client";

import { useState, useEffect } from "react";
import { Lock, Delete, ShieldCheck } from "lucide-react";
import { isPinEnabled, isSessionUnlocked, verifyPin, setSessionUnlocked } from "@/lib/pinStore";
import { useToast } from "@/components/ui/Toast";

export function PinLockOverlay() {
  const { toast } = useToast();
  const [isLocked, setIsLocked] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [isError, setIsError] = useState(false);

  const checkLockStatus = () => {
    if (typeof window === "undefined") return;
    if (isPinEnabled() && !isSessionUnlocked()) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  };

  useEffect(() => {
    checkLockStatus();

    const handleEvent = () => checkLockStatus();
    window.addEventListener("focus", handleEvent);
    window.addEventListener("fintrack_pin_change", handleEvent);

    return () => {
      window.removeEventListener("focus", handleEvent);
      window.removeEventListener("fintrack_pin_change", handleEvent);
    };
  }, []);

  const handleKeyPress = (num: string) => {
    if (inputPin.length >= 4) return;
    const nextPin = inputPin + num;
    setInputPin(nextPin);
    setIsError(false);

    if (nextPin.length === 4) {
      setTimeout(() => {
        if (verifyPin(nextPin)) {
          setSessionUnlocked(true);
          setIsLocked(false);
          setInputPin("");
          toast("App Unlocked", "success");
        } else {
          setIsError(true);
          toast("Incorrect PIN", "error");
          setTimeout(() => {
            setInputPin("");
            setIsError(false);
          }, 500);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    setInputPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-background p-6 select-none animate-fade-in">
      {/* App Header */}
      <div className="flex flex-col items-center pt-12 space-y-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/10 text-accent border border-accent/20">
          <Lock size={32} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Enter Passcode</h1>
        <p className="text-xs text-muted-foreground">Enter your 4-digit PIN to access FinTrack</p>

        {/* 4 Digit Indicators */}
        <div className={`flex gap-4 pt-6 transition-transform ${isError ? "animate-bounce text-destructive" : ""}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = inputPin.length > index;
            return (
              <div
                key={index}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? "bg-accent border-accent scale-110 shadow-sm"
                    : "border-muted-foreground/40 bg-transparent"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs pb-8 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border text-xl font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-90 mx-auto"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress("0")}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border text-xl font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-90 mx-auto"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="flex h-16 w-16 items-center justify-center rounded-full text-muted-foreground transition-all hover:text-foreground active:scale-90 mx-auto"
            aria-label="Delete"
          >
            <Delete size={24} />
          </button>
        </div>

        <div className="text-center pt-2">
          <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Protected by FinTrack Security
          </span>
        </div>
      </div>
    </div>
  );
}
