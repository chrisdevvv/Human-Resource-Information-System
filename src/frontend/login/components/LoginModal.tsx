"use client";
// Component: LoginModal
// Filename: LoginModal.tsx
// Purpose: Modal UI for signing in; performs basic validation and reports errors to parent
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "../../assets/icons";

type Props = {
  visible: boolean;
  onClose: () => void;
  onError: (title: string, desc?: string) => void;
  onOpenForgot: () => void;
  onOpenRegister?: () => void;
};

export default function LoginModal({
  visible,
  onClose,
  onError,
  onOpenForgot,
  onOpenRegister,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  function validateEmail(value: string) {
    // Simple, pragmatic email validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  }

  function submit() {
    if (!email || !password) {
      onError("Validation", "Please enter email and password");
      if (!email) setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      onError("Validation", "Please enter a valid email address");
      return;
    }
    // Simulate successful login (replace with real auth call)
    onClose();
  }

  return (
    <div
      className={`${visible ? "flex" : "hidden"} fixed inset-0 items-center justify-center bg-black/40 z-50`}
      aria-hidden={!visible}
    >
      <div className="relative bg-white p-7 rounded-lg w-full max-w-md border-2 border-blue-600 shadow-lg">
        <h3 className="text-center text-lg font-semibold text-blue-600">
          Sign In
        </h3>

        <label className="mt-4 block text-black">Email</label>
        <div className="flex items-center gap-3 mt-2 text-gray-600">
          <Mail className="text-blue-600" size={18} />
          <input
            id="loginEmail"
            type="email"
            placeholder="you@example.com"
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
            className="flex-1 px-3 py-2 border rounded-md"
          />
        </div>
        {emailError ? (
          <p className="text-sm text-red-600 mt-1">{emailError}</p>
        ) : null}

        <label className="mt-3 block text-black">Password</label>
        <div className="flex items-center gap-3 mt-2 text-gray-600">
          <Lock className="text-blue-600" size={18} />
          <input
            placeholder="Type password"
            id="loginPassword"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
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

        <div className="flex gap-3 justify-center mt-4">
          <button
            id="submitLogin"
            className="transition hover:bg-blue-700 hover:cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md"
            onClick={submit}
          >
            Sign in
          </button>
          <button
            id="cancelLogin"
            className="text-gray-800 transition hover:cursor-pointer hover:bg-gray-300 px-4 py-2 bg-gray-200 rounded-md"
            onClick={onClose}
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

        <p className="text-center mt-2">
          <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                // Prefer parent to control modal switching; call provided callback if present
                if (onOpenRegister) {
                  onClose();
                  onOpenRegister();
                }
              }}
            className="text-sm text-blue-600 hover:underline"
          >
            No account? Register here
          </a>
        </p>
      </div>
    </div>
  );
}
