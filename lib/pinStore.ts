const PIN_ENABLED_KEY = "fintrack_pin_enabled";
const PIN_CODE_KEY = "fintrack_pin_code";
const SESSION_UNLOCKED_KEY = "fintrack_session_unlocked";

function notifyPinChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("fintrack_pin_change"));
  }
}

export function isPinEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PIN_ENABLED_KEY) === "true";
}

export function getStoredPin(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PIN_CODE_KEY);
}

export function setPin(pin: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PIN_CODE_KEY, pin);
  localStorage.setItem(PIN_ENABLED_KEY, "true");
  // Require lock immediately upon setting new PIN
  lockNow();
}

export function clearPin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PIN_CODE_KEY);
  localStorage.setItem(PIN_ENABLED_KEY, "false");
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  notifyPinChange();
}

export function lockNow(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  notifyPinChange();
}

export function verifyPin(inputPin: string): boolean {
  if (typeof window === "undefined") return false;
  const stored = getStoredPin();
  if (!stored) return inputPin === "0000"; // Default fallback
  return inputPin === stored;
}

export function isSessionUnlocked(): boolean {
  if (typeof window === "undefined") return true;
  if (!isPinEnabled()) return true;
  return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === "true";
}

export function setSessionUnlocked(unlocked: boolean): void {
  if (typeof window === "undefined") return;
  if (unlocked) {
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, "true");
  } else {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  }
  notifyPinChange();
}
