"use client";
// Component: LoginModal
// Filename: LoginModal.tsx
// Purpose: Modal UI for signing in; performs basic validation and reports errors to parent
import React, { useEffect, useState } from "react";
import { LogIn, XCircle } from "lucide-react";
import { Mail, Lock, Eye, EyeOff } from "../../assets/icons";
import DotLoader from "@/frontend/components/DotLoader";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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

  useEffect(() => {
    if (!visible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  function validateEmail(value: string) {
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

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("authSessionActive", "1");

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
      className={`${visible ? "flex" : "hidden"} fixed inset-0 z-50 items-center justify-center bg-black/40 px-4`}
      aria-hidden={!visible}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border-2 border-blue-600 bg-white p-6 shadow-lg sm:p-8">
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
            if (emailError && validateEmail(v)) setEmailError(null);
          }}
          onBlur={() => {
            if (!email) setEmailError("Email is required");
            else if (!validateEmail(email))
              setEmailError("Please enter a valid email address");
            else setEmailError(null);
          }}
          className={`mt-2 w-full rounded-md border px-3 py-2 text-gray-700 placeholder:text-gray-500 ${
            emailError ? "border-red-500" : ""
          }`}
          disabled={isLoading}
        />
        {emailError ? (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        ) : null}

        <label className="mt-3 flex items-center gap-2 text-black">
          <Lock className="text-blue-600" size={18} />
          Password <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex items-center gap-3">
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
            className={`flex-1 rounded-md border px-3 py-2 text-gray-700 placeholder:text-gray-500 ${
              passwordError ? "border-red-500" : ""
            }`}
            disabled={isLoading}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((s) => !s)}
            className="rounded p-1 text-gray-600 hover:bg-gray-100"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {passwordError && email && validateEmail(email) ? (
          <p className="mt-1 text-sm text-red-600">{passwordError}</p>
        ) : null}

        <div className="mt-4 flex justify-center gap-3">
          <button
            id="submitLogin"
            className="inline-flex min-w-27.5 items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-white transition hover:cursor-pointer hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={submit}
            disabled={isLoading}
          >
            {isLoading ? (
              <DotLoader size={6} color="bg-white" />
            ) : (
              <>
                <LogIn size={14} />
                Sign in
              </>
            )}
          </button>

          <button
            id="cancelLogin"
            className="inline-flex items-center justify-center gap-1 rounded-md bg-gray-300 px-3 py-1.5 text-gray-800 transition hover:cursor-pointer hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            <XCircle size={14} />
            Cancel
          </button>
        </div>

        {isLoading && (
          <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-4">
            <DotLoader size={9} color="bg-blue-600" />
            <p className="text-sm font-medium text-blue-700">
              Signing in, please wait...
            </p>
          </div>
        )}

        <p className="mt-3 text-center transition hover:cursor-pointer hover:underline">
          <a
            href="#"
            id="forgotLink"
            onClick={(e) => {
              e.preventDefault();
              if (isLoading) return;
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