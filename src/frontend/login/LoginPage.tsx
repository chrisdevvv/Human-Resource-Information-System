"use client";
// Component: LoginPage
// Filename: LoginPage.tsx
// Purpose: Landing page with direct login form and sticky header
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "../assets/icons";
import {
  LoginSuccessModal,
  ForgotModal,
  ErrorModal,
  RegistrationModal,
} from "./components";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function LoginPage() {
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
    username?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [error, setError] = useState<{ title?: string; desc?: string } | null>(
    null,
  );

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
        setError({
          title: "Login Error",
          desc: data.message || "Failed to login",
        });
        return;
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

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
        <div className="flex items-center justify-center gap-6 mb-8">
          {/* DepEd CSJDM Logo */}
          <img
            src="/images/deped-csjdm-logo.svg"
            alt="DepEd CSJDM Logo"
            className="h-32 w-auto"
          />
          {/* Bagong Pilipinas Logo */}
          <img
            src="/logo-deped-bagong-pilipinas-colored_orig.png"
            alt="DepEd Bagong Pilipinas Logo"
            className="h-32 w-auto"
          />
        </div>

        <div className="border-blue-600 border-2 bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
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
              placeholder="you@email.com"
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

          {/* Login Button */}
          <button
            id="submitLogin"
            className="cursor-pointer w-full py-3 bg-blue-200 text-blue-700 rounded-md font-medium hover:bg-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLogin}
            disabled={isLoading}
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
        onClose={() => setShowLoginSuccess(false)}
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
