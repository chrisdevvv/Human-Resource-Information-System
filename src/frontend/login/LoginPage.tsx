"use client";
// Component: LoginPage
// Filename: LoginPage.tsx
// Purpose: Landing page with direct login form and sticky header
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "../assets/icons";
import {
  LoginSuccessModal,
  ForgotModal,
  ErrorModal,
  RegistrationModal,
} from "./components";
import {
  isAccountLocked,
  getRemainingLockTime,
  incrementFailedAttempt,
  resetLoginAttempts,
} from "./utils/loginAttempts";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const FORCE_PASSWORD_CHANGE_KEY = "forcePasswordChange:addedUsers";
const PENDING_PASSWORD_KEY = "forcePasswordChange:pendingLoginPassword";
const PENDING_EMAIL_KEY = "forcePasswordChange:pendingEmail";
const ACTIVE_TAB_STORAGE_KEY_ADMIN = "activeTab:admin";
const ACTIVE_TAB_STORAGE_KEY_SUPER_ADMIN = "activeTab:super-admin";

function getForcedPasswordChangeEmails(): string[] {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(FORCE_PASSWORD_CHANGE_KEY) || "[]",
    );
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().toLowerCase())
      : [];
  } catch {
    return [];
  }
}

function resetLandingTabOnLogin(role?: string) {
  if (role === "ADMIN") {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY_ADMIN, "dashboard");
  }

  if (role === "SUPER_ADMIN") {
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY_SUPER_ADMIN, "dashboard");
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [error, setError] = useState<{ title?: string; desc?: string } | null>(
    null,
  );
  const [remainingLockTime, setRemainingLockTime] = useState<number>(0);

  // Update lock time countdown
  useEffect(() => {
    if (!email) return;

    const locked = isAccountLocked(email);
    if (!locked) {
      setRemainingLockTime(0);
      return;
    }

    const remaining = getRemainingLockTime(email);
    setRemainingLockTime(remaining);

    const interval = setInterval(() => {
      const newRemaining = getRemainingLockTime(email);
      if (newRemaining <= 0) {
        setRemainingLockTime(0);
        clearInterval(interval);
      } else {
        setRemainingLockTime(newRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [email]);

  function validateEmail(value: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  }

  async function handleLogin() {
    let hasError = false;

    if (!email) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) {
      setError({
        title: "Validation",
        desc: "Please correct the errors before signing in",
      });
      return;
    }

    // Check if account is locked
    if (isAccountLocked(email)) {
      const remaining = getRemainingLockTime(email);
      setError({
        title: "Account Temporarily Locked",
        desc: `Too many failed login attempts. Please try again in ${remaining} second${remaining !== 1 ? "s" : ""}.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const backendMessage =
          typeof data?.message === "string" ? data.message : "";

        // Only increment failed attempts for invalid credentials
        if (backendMessage.toLowerCase() === "invalid credentials") {
          incrementFailedAttempt(email);
          const remaining = getRemainingLockTime(email);

          // Check if account just got locked
          if (remaining > 0) {
            setError({
              title: "Login Error",
              desc: `Invalid email or password. Account locked for ${remaining} second${remaining !== 1 ? "s" : ""} due to too many failed attempts.`,
            });
          } else {
            setError({
              title: "Login Error",
              desc: "Invalid email or password.",
            });
          }
        } else {
          setError({
            title: "Login Error",
            desc:
              backendMessage.toLowerCase() === "account is deactivated"
                ? "Your account has been deactivated. Please contact your administrator for assistance."
                : backendMessage || "Failed to login",
          });
        }
        return;
      }

      // Successful login - reset failed attempts
      resetLoginAttempts(email);
      setRemainingLockTime(0);

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("authSessionActive", "1");
      resetLandingTabOnLogin(data?.user?.role);

      const normalizedEmail = String(data?.user?.email || email)
        .trim()
        .toLowerCase();
      const shouldForcePasswordChange =
        getForcedPasswordChangeEmails().includes(normalizedEmail);

      if (shouldForcePasswordChange) {
        sessionStorage.setItem(PENDING_PASSWORD_KEY, password);
        sessionStorage.setItem(PENDING_EMAIL_KEY, normalizedEmail);
        router.push("/new-user");
        return;
      }

      setLoggedInUser(data.user);
      setShowLoginSuccess(true);
    } catch (err) {
      setError({
        title: "Login Error",
        desc: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-blue-700 text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-medium tracking-wide">
            DEPARTMENT OF EDUCATION
          </p>
          <h1 className="text-xl font-bold">
            Employee Leave Management System
          </h1>
        </div>
      </header>

      {/* Login Form Section */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        {/* Logos Container */}
        <div className="-mt-10 flex items-center justify-center gap-6">
          {/* Logo */}
          <img src="/sdologo-new.svg" alt="SD Logo" className="h-60 w-auto" />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">
            Use your email and password to continue
          </p>

          {/* Email Field */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Mail className="text-blue-600" size={18} />
              EMAIL
            </label>
            <input
              id="loginEmail"
              type="email"
              placeholder="you@deped.gov.ph"
              value={email}
              onChange={(e) => {
                const v = e.target.value;
                setEmail(v);
                if (emailError && validateEmail(v)) setEmailError(null);
              }}
              onBlur={() => {
                if (!email) setEmailError("Email is required");
                else if (!validateEmail(email))
                  setEmailError("Please enter a valid email address");
                else setEmailError(null);
              }}
              className={`w-full px-4 py-2 border rounded-md text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailError ? "border-red-500" : "border-blue-300"
              }`}
            />
            {emailError && (
              <p className="text-sm text-red-600 mt-1">{emailError}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Lock className="text-blue-600" size={18} />
              PASSWORD
            </label>
            <div className="relative">
              <input
                placeholder="••••••••"
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                onBlur={() => {
                  if (!password) setPasswordError("Password is required");
                  else setPasswordError(null);
                }}
                className={`w-full px-4 py-2 border rounded-md text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordError ? "border-red-500" : "border-blue-300"
                }`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-red-600 mt-1">{passwordError}</p>
            )}
          </div>

          {/* Lockout Warning */}
          {remainingLockTime > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-800">
                Too many failed login attempts
              </p>
              <p className="text-sm text-red-700 mt-1">
                Account locked. Try again in {remainingLockTime} second
                {remainingLockTime !== 1 ? "s" : ""}.
              </p>
            </div>
          )}

          {/* Login Button */}
          <button
            id="submitLogin"
            className="cursor-pointer w-full py-3 bg-blue-200 text-blue-700 rounded-md font-medium hover:bg-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLogin}
            disabled={isLoading || remainingLockTime > 0}
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>

          {/* Links */}
          <div className="flex justify-between mt-4 text-sm">
            <a
              href="#"
              id="registerLink"
              onClick={(e) => {
                e.preventDefault();
                setShowRegister(true);
              }}
              className="text-blue-600 hover:underline"
            >
              Create account
            </a>
            <a
              href="#"
              id="forgotLink"
              onClick={(e) => {
                e.preventDefault();
                setShowForgot(true);
              }}
              className="text-gray-600 hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </div>
      </div>

      <LoginSuccessModal
        visible={showLoginSuccess}
        user={loggedInUser}
        onClose={() => {
          setShowLoginSuccess(false);
          if (loggedInUser?.role === "SUPER_ADMIN") router.push("/super-admin");
          else if (loggedInUser?.role === "ADMIN") router.push("/admin");
          else if (loggedInUser?.role === "DATA_ENCODER")
            router.push("/data-encoder");
        }}
      />

      <ForgotModal visible={showForgot} onClose={() => setShowForgot(false)} />
      <RegistrationModal
        visible={showRegister}
        onClose={() => setShowRegister(false)}
      />

      <ErrorModal error={error} onClose={() => setError(null)} />
    </div>
  );
}
