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
      className={`${visible ? "flex" : "hidden"} fixed inset-0 items-center justify-center bg-black/40 z-50 px-4`}
      aria-hidden={!visible}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-blue-200 bg-white p-6 shadow-lg sm:p-8">
        <button
          className="absolute right-2 top-2 text-xl hover:bg-red-500 hover:text-white rounded p-1 transition"
          id="forgotClose"
          onClick={() => {
            resetForm();
            onClose();
          }}
        >
          &times;
        </button>
        <h3 className="text-center text-lg font-semibold text-sky-800">
          Reset Password
        </h3>

        <div id="forgotStepEmail" className="mt-3">
          {successMessage ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
              <p className="text-green-700">{successMessage}</p>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sky-900">
                <Mail className="text-blue-600" size={18} />
                Enter your account email <span className="text-red-500">*</span>
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
                className={`mt-2 w-full px-3 py-2 border rounded-md text-gray-800 placeholder:text-gray-500 ${
                  emailError ? "border-red-500" : ""
                }`}
                disabled={isLoading}
              />
              {emailError && (
                <p className="text-sm text-red-600 mt-1">{emailError}</p>
              )}
            </>
          )}

          <div className="flex flex-col gap-3 items-center mt-4">
            {!successMessage && (
              <>
                <button
                  id="sendReset"
                  className="inline-flex items-center justify-center gap-1 hover:cursor-pointer transition hover:bg-blue-700 px-6 py-2 bg-blue-600 text-white rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={sendResetEmail}
                  disabled={isLoading}
                >
                  <Send size={14} />
                  {isLoading ? "Sending..." : "Send reset email"}
                </button>
                <button
                  id="cancelForgot"
                  className="inline-flex items-center justify-center gap-1 text-black hover:cursor-pointer bg-gray-200 px-6 py-2 border rounded-md w-full hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
