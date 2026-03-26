// Login attempt security utilities

const LOCK_DURATION_MS = 60000; // 1 minute in milliseconds
const MAX_ATTEMPTS = 3;

interface LoginAttemptData {
  attempts: number;
  lastAttemptTime: number;
  lockUntil: number | null;
}

function getStorageKey(email: string): string {
  return `loginAttempts:${email.toLowerCase()}`;
}

export function getLoginAttemptData(email: string): LoginAttemptData {
  try {
    const stored = localStorage.getItem(getStorageKey(email));
    if (!stored) {
      return { attempts: 0, lastAttemptTime: 0, lockUntil: null };
    }
    return JSON.parse(stored);
  } catch {
    return { attempts: 0, lastAttemptTime: 0, lockUntil: null };
  }
}

export function isAccountLocked(email: string): boolean {
  const data = getLoginAttemptData(email);
  if (!data.lockUntil) return false;

  const now = Date.now();
  return now < data.lockUntil;
}

export function getRemainingLockTime(email: string): number {
  const data = getLoginAttemptData(email);
  if (!data.lockUntil) return 0;

  const now = Date.now();
  const remaining = data.lockUntil - now;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0; // Return in seconds
}

export function incrementFailedAttempt(email: string): number {
  const data = getLoginAttemptData(email);
  const newAttempts = data.attempts + 1;

  let lockUntil: number | null = null;
  if (newAttempts >= MAX_ATTEMPTS) {
    lockUntil = Date.now() + LOCK_DURATION_MS;
  }

  const updatedData: LoginAttemptData = {
    attempts: newAttempts,
    lastAttemptTime: Date.now(),
    lockUntil,
  };

  localStorage.setItem(getStorageKey(email), JSON.stringify(updatedData));
  return newAttempts;
}

export function resetLoginAttempts(email: string): void {
  localStorage.removeItem(getStorageKey(email));
}
