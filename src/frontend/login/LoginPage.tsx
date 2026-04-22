"use client";
// Component: LoginPage
// Filename: LoginPage.tsx
// Purpose: Landing page with direct login form and sticky header
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "../assets/icons";
import { CircleHelp, Clock3, Mail as MailContact } from "lucide-react";
import { ForgotModal, ErrorModal, RegistrationModal } from "./components";
import ToastMessage from "@/frontend/components/ToastMessage";
import DotLoader from "@/frontend/components/DotLoader";
import {
  isAccountLocked,
  getRemainingLockTime,
  incrementFailedAttempt,
  resetLoginAttempts,
} from "./utils/loginAttempts";
import { APP_ROUTES, getDashboardRouteByRoleStrict } from "@/frontend/route";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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
  const [error, setError] = useState<{ title?: string; desc?: string } | null>(
    null,
  );
  const [toastState, setToastState] = useState<{
    isVisible: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({
    isVisible: false,
    variant: "success",
    title: "",
    message: "",
  });
  const [remainingLockTime, setRemainingLockTime] = useState<number>(0);

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

        if (backendMessage.toLowerCase() === "invalid credentials") {
          incrementFailedAttempt(email);
          const remaining = getRemainingLockTime(email);

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
        router.push(APP_ROUTES.NEW_USER);
        return;
      }

      const dashboardRoute = getDashboardRouteByRoleStrict(
        data.user?.role,
        APP_ROUTES.LOGIN,
      );

      if (dashboardRoute === APP_ROUTES.LOGIN) {
        setError({
          title: "Login Error",
          desc: "Your account role does not have an assigned dashboard.",
        });
        return;
      }

      setToastState({
        isVisible: true,
        variant: "success",
        title: "Login Successful",
        message: "Redirecting to your dashboard...",
      });

      router.replace(dashboardRoute);
      return;
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
    <div className="flex min-h-screen flex-col bg-gray-100">
      <ToastMessage
        isVisible={toastState.isVisible}
        variant={toastState.variant}
        title={toastState.title}
        message={toastState.message}
        position="bottom-right"
        autoCloseDuration={5000}
        onClose={() =>
          setToastState((prev) => ({
            ...prev,
            isVisible: false,
          }))
        }
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-blue-700 px-6 py-4 text-white shadow-md">
        <div className="flex w-full items-center justify-start gap-3">
          <img
            src="/images/DepEd-CHRIS.svg"
            alt="DepEd CHRIS"
            className="h-12 w-auto"
          />
          <div className="text-left">
            <p className="text-sm font-medium tracking-wide">
              DEPARTMENT OF EDUCATION
            </p>
            <h1 className="text-xl font-bold leading-tight">
              CITY OF SAN JOSE DEL MONTE
            </h1>
            <p className="text-sm font-normal leading-tight tracking-wide">
              CSJDM DepEd Human Resource Information System - CHRIS
            </p>
          </div>
        </div>
      </header>

      {/* Login Form Section */}
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        {/* Logos Container */}
        <div className="-mt-10 flex items-center justify-center gap-6">
          <img src="/sdologo-new.svg" alt="SD Logo" className="h-50 w-auto" />
        </div>

        <div className="w-full max-w-2xl rounded-xl border border-blue-200 bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-1 flex items-center gap-2">
            <Lock className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-800">Sign in</h2>
          </div>
          <p className="mb-5 text-sm text-gray-500">
            Use your email and password to continue
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            {/* Email Field */}
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="text-blue-600" size={18} />
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
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${emailError ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="text-blue-600" size={18} />
                Password
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
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${passwordError ? "border-red-500" : "border-gray-300"}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Lockout Warning */}
            {remainingLockTime > 0 && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-3">
                <p className="text-sm font-medium text-red-800">
                  Too many failed login attempts
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Account locked. Try again in {remainingLockTime} second
                  {remainingLockTime !== 1 ? "s" : ""}.
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              id="submitLogin"
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || remainingLockTime > 0}
            >
              {isLoading ? (
                <div className="flex min-h-5 items-center justify-center">
                  <DotLoader size={6} color="bg-white" />
                </div>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* In-card loading state */}
          {isLoading && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-6">
              <DotLoader size={10} color="bg-blue-600" />
              <p className="text-sm font-medium text-blue-700">
                Signing in, please wait...
              </p>
            </div>
          )}

          {/* Links */}
          <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
            <a
              href="#"
              id="registerLink"
              onClick={(e) => {
                e.preventDefault();
                if (isLoading) return;
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
                if (isLoading) return;
                setShowForgot(true);
              }}
              className="text-gray-600 hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </div>
      </div>

      <footer className="bg-white px-6 py-4 text-gray-600 shadow-inner">
        <div className="flex w-full flex-col gap-1.5 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <div className="text-left sm:mr-auto">
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="cursor-pointer text-[11px] font-semibold transition hover:text-gray-900 hover:underline underline-offset-4 sm:text-xs"
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
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          onClick={() => setShowContactModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Contact details"
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <CircleHelp size={20} className="text-blue-700" />
                <h3 className="text-lg font-bold text-gray-900">Contact Us</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                aria-label="Close contact modal"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-200 text-sm font-bold text-gray-600 transition hover:border-red-500 hover:bg-red-500 hover:text-white"
              >
                X
              </button>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Have a question or need assistance with the Human Resource
              Information System? Reach out to us through any of the channels
              below.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Email Address
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <MailContact size={16} className="mt-0.5 text-blue-700" />
                  <div>
                    <p className="break-all text-sm font-semibold text-gray-900">
                      arthur.francisco@deped.gov.ph
                    </p>
                    <p className="text-xs text-gray-600">
                      For inquiries regarding employee records, system access,
                      and HR-related concerns
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Office Hours
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <Clock3 size={16} className="mt-0.5 text-amber-700" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Monday - Friday, 8:00 AM - 4:00 PM
                    </p>
                    <p className="text-xs text-gray-600">
                      Closed on weekends and national holidays
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ForgotModal visible={showForgot} onClose={() => setShowForgot(false)} />
      <RegistrationModal
        visible={showRegister}
        onClose={() => setShowRegister(false)}
      />

      <ErrorModal error={error} onClose={() => setError(null)} />
    </div>
  );
}