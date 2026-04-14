"use client";
// Component: ForgotModal
// Filename: ForgotModal.tsx
// Purpose: Send password reset email
import React, { useEffect, useState } from "react";
import { Send, XCircle } from "lucide-react";
import { Mail } from "../../assets/icons";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type Props = { visible: boolean; onClose: () => void };

export default function ForgotModal({ visible, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  function validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async function sendResetEmail() {
    setEmailError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.message || "Failed to send reset email");
        return;
      }

      setSuccessMessage(
        "Reset link has been sent to your email. Please check your inbox.",
      );
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setEmail("");
    setEmailError("");
    setSuccessMessage("");
  }

  return (
    <div
      className={`${visible ? "flex" : "hidden"} fixed inset-0 z-50 items-center justify-center bg-black/40 px-4`}
      aria-hidden={!visible}
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-blue-200 bg-white p-6 shadow-2xl sm:p-8">
        <button
          className="absolute right-2 top-2 rounded p-1 text-xl transition hover:bg-red-500 hover:text-white"
          id="forgotClose"
          onClick={() => {
            resetForm();
            onClose();
          }}
        >
          &times;
        </button>
        <div className="mb-1 flex items-center gap-2">
          <Mail className="text-blue-600" size={20} />
          <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Enter your account email to receive a password reset link.
        </p>

        <div id="forgotStepEmail">
          {successMessage ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="text-blue-600" size={18} />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="forgotEmail"
                type="email"
                placeholder="name@deped.gov.ph"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onBlur={() => {
                  if (!email.trim()) {
                    setEmailError("Email is required");
                  } else if (!validateEmail(email)) {
                    setEmailError("Please enter a valid email address");
                  } else {
                    setEmailError("");
                  }
                }}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${emailError ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
              {emailError && (
                <p className="text-sm text-red-600 mt-1">{emailError}</p>
              )}
            </>
          )}

          <div className="mt-4 flex flex-col items-center gap-3">
            {!successMessage && (
              <>
                <button
                  id="sendReset"
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={sendResetEmail}
                  disabled={isLoading}
                >
                  <Send size={14} />
                  {isLoading ? "Sending..." : "Send reset email"}
                </button>
                <button
                  id="cancelForgot"
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  disabled={isLoading}
                >
                  <XCircle size={14} />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
