"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "../assets/icons";
import { CircleHelp, Clock3, Mail as MailContact } from "lucide-react";
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

export default function LoginPageMobile() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-blue-700 text-white py-3 px-4 shadow-md">
        <div className="w-full flex items-center justify-start gap-2 text-left">
          <img
            src="/images/[DEPED] ELMS Logo.svg"
            alt="DepEd ELMS Logo"
            className="h-10 sm:h-11 w-auto"
          />
          <div>
            <p className="text-[10px] sm:text-xs font-medium tracking-wider">
              DEPARTMENT OF EDUCATION
            </p>
            <h1 className="text-sm sm:text-base font-bold leading-tight">
              CITY OF SAN JOSE DEL MONTE
            </h1>
            <p className="text-[10px] sm:text-xs font-normal tracking-wider leading-tight">
              CSJDM Human Resource Information System - CHRIS
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="flex items-center justify-center gap-4 mb-6">
          <img
            src="/sdologo-new.svg"
            alt="SD Logo"
            className="h-32 sm:h-36 w-auto"
          />
        </div>

        <div className="w-full max-w-md rounded-xl border border-blue-200 bg-white p-5 shadow-2xl sm:p-6">
          <div className="mb-1 flex items-center gap-2">
            <Lock className="text-blue-600" size={18} />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Sign in
            </h2>
          </div>
          <p className="mb-5 text-xs sm:text-sm text-gray-500">
            Use your email and password to continue
          </p>

          <div className="mb-4">
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
              <Mail className="text-blue-600" size={16} />
              Email
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
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${emailError ? "border-red-500" : "border-gray-300"}`}
            />
            {emailError && (
              <p className="text-xs sm:text-sm text-red-600 mt-1">
                {emailError}
              </p>
            )}
          </div>

          <div className="mb-5">
            <label className="mb-2 flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
              <Lock className="text-blue-600" size={16} />
              Password
            </label>
            <div className="relative">
              <input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                onBlur={() => {
                  if (!password) setPasswordError("Password is required");
                  else setPasswordError(null);
                }}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${passwordError ? "border-red-500" : "border-gray-300"}`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs sm:text-sm text-red-600 mt-1">
                {passwordError}
              </p>
            )}
          </div>

          {remainingLockTime > 0 && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-3">
              <p className="text-xs sm:text-sm font-medium text-red-800">
                Too many failed login attempts
              </p>
              <p className="text-xs sm:text-sm text-red-700 mt-1">
                Account locked. Try again in {remainingLockTime} second
                {remainingLockTime !== 1 ? "s" : ""}.
              </p>
            </div>
          )}

          <button
            id="submitLogin"
            className="cursor-pointer w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleLogin}
            disabled={isLoading || remainingLockTime > 0}
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>

          <div className="mt-4 flex flex-col gap-2 text-xs sm:text-sm sm:flex-row sm:justify-between">
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

      <footer className="bg-blue-700 text-white px-4 py-4 shadow-inner">
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
          <div className="text-left sm:mr-auto">
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="cursor-pointer font-semibold hover:underline underline-offset-4 hover:text-blue-100 transition"
            >
              Contact Us
            </button>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-left">
              <span>
                &copy; {currentYear} DepEd Human Resource Information System
              </span>
            </div>
            <div>Developer: Shania Condalor &amp; Alexis Torrefiel</div>
          </div>
        </div>
      </footer>

      {showContactModal && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setShowContactModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Contact details"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-4 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <CircleHelp size={18} className="text-blue-700" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Contact Us
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                aria-label="Close contact modal"
                className="cursor-pointer rounded-md border border-gray-200 w-7 h-7 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition"
              >
                X
              </button>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
              Have a question or need assistance with the Human Resource
              Information System? Reach out to us through any of the channels
              below.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                  Email Address
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <MailContact size={15} className="mt-0.5 text-blue-700" />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 break-all">
                      arthur.francisco@deped.gov.ph
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-600">
                      For inquiries regarding employee records, system access,
                      and HR-related concerns
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                  Office Hours
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <Clock3 size={15} className="mt-0.5 text-amber-700" />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      Monday - Friday, 8:00 AM - 4:00 PM
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-600">
                      Closed on weekends and national holidays
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
