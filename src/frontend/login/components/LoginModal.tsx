"use client";
// Component: LoginModal
// Filename: LoginModal.tsx
// Purpose: Modal UI for signing in; performs basic validation and reports errors to parent
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "../../assets/icons";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: {
    username?: string;
    email?: string;
    role?: string;
  }) => void;
  onError: (title: string, desc?: string) => void;
  onOpenForgot: () => void;
};

export default function LoginModal({
  visible,
  onClose,
  onSuccess,
  onError,
  onOpenForgot,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function validateEmail(value: string) {
    // Simple, pragmatic email validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  }

  async function submit() {
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
      onError("Validation", "Please correct the errors before signing in");
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
        onError("Login Error", data.message || "Failed to login");
        return;
      }

      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onSuccess(data.user);
      onClose();
    } catch (error) {
      onError(
        "Login Error",
        error instanceof Error ? error.message : "An error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`${visible ? "flex" : "hidden"} fixed inset-0 items-center justify-center bg-black/40 z-50`}
      aria-hidden={!visible}
    >
      <div className="relative bg-white p-8 rounded-lg w-full max-w-2xl border-2 border-blue-600 shadow-lg">
        <h3 className="text-center text-lg font-semibold text-blue-600">
          Sign In
        </h3>

        <label className="mt-4 flex items-center gap-2 text-black">
          <Mail className="text-blue-600" size={18} />
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="loginEmail"
          type="email"
          placeholder="name@deped.gov.ph"
          value={email}
          onChange={(e) => {
            const v = e.target.value;
            setEmail(v);
            // Clear error as user types if it becomes valid
            if (emailError && validateEmail(v)) setEmailError(null);
          }}
          onBlur={() => {
            if (!email) setEmailError("Email is required");
            else if (!validateEmail(email))
              setEmailError("Please enter a valid email address");
            else setEmailError(null);
          }}
          className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${
            emailError ? "border-red-500" : ""
          }`}
        />
        {emailError ? (
          <p className="text-sm text-red-600 mt-1">{emailError}</p>
        ) : null}

        <label className="mt-3 flex items-center gap-2 text-black">
          <Lock className="text-blue-600" size={18} />
          Password <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 mt-2">
          <input
            placeholder="Type password"
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
            className={`flex-1 text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${
              passwordError ? "border-red-500" : ""
            }`}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
            className="p-1 rounded text-gray-600 hover:bg-gray-100"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {passwordError && email && validateEmail(email) ? (
          <p className="text-sm text-red-600 mt-1">{passwordError}</p>
        ) : null}

        <div className="flex gap-3 justify-center mt-4">
          <button
            id="submitLogin"
            className="transition hover:bg-blue-700 hover:cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={submit}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
          <button
            id="cancelLogin"
            className="text-gray-800 transition hover:cursor-pointer hover:bg-gray-400 px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>

        <p className="text-center mt-3 hover:cursor-pointer hover:underline transition">
          <a
            href="#"
            id="forgotLink"
            onClick={(e) => {
              e.preventDefault();
              onOpenForgot();
            }}
            className="text-sm text-blue-600"
          >
            Forgot password?
          </a>
        </p>
      </div>
    </div>
  );
}
