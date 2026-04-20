"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, ArrowLeft } from "../../frontend/assets/icons";
import { clearClientSession } from "../../frontend/auth/session";
import { APP_ROUTES } from "@/frontend/route";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"old-password" | "new-password" | "success">(
    "old-password",
  );
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [oldPasswordError, setOldPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    if (!token) {
      setGeneralError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  function validatePassword(password: string) {
    if (password.length < 8)
      return {
        valid: false,
        message: "Password must be at least 8 characters",
      };
    if (!/[A-Z]/.test(password))
      return {
        valid: false,
        message: "Password must contain an uppercase letter",
      };
    if (!/[a-z]/.test(password))
      return {
        valid: false,
        message: "Password must contain a lowercase letter",
      };
    if (!/[0-9]/.test(password))
      return { valid: false, message: "Password must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return {
        valid: false,
        message: "Password must contain a special character",
      };
    return { valid: true, message: "" };
  }

  async function verifyOldPassword() {
    setOldPasswordError("");
    setGeneralError("");

    if (!oldPassword.trim()) {
      setOldPasswordError("Old password is required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/verify-old-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password: oldPassword }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setOldPasswordError(data.message || "Password verification failed");
        return;
      }

      setStep("new-password");
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword() {
    setNewPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");

    const passwordValidation = validatePassword(newPassword);
    if (!newPassword.trim()) {
      setNewPasswordError("New password is required");
      return;
    }
    if (!passwordValidation.valid) {
      setNewPasswordError(passwordValidation.message);
      return;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneralError(data.message || "Failed to reset password");
        return;
      }

      clearClientSession();
      setStep("success");
      setTimeout(() => {
        router.push(APP_ROUTES.LOGIN);
      }, 3000);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (generalError && step === "old-password") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg border border-blue-200 shadow-lg w-full max-w-md">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-red-700">{generalError}</p>
          </div>
          <button
            onClick={() => router.push(APP_ROUTES.LOGIN)}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg border border-blue-200 shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Reset Password
        </h1>

        {step === "old-password" && (
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Lock className="text-blue-600" size={18} />
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Enter your current password"
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                if (oldPasswordError) setOldPasswordError("");
              }}
              onBlur={() => {
                if (!oldPassword.trim()) {
                  setOldPasswordError("Old password is required");
                }
              }}
              className={`w-full px-4 py-2 border rounded-md text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                oldPasswordError ? "border-red-500" : "border-blue-300"
              }`}
              disabled={isLoading}
            />
            {oldPasswordError && (
              <p className="text-sm text-red-600 mt-1">{oldPasswordError}</p>
            )}

            <button
              onClick={verifyOldPassword}
              disabled={isLoading}
              className="cursor-pointer w-full mt-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify Password"}
            </button>
          </div>
        )}

        {step === "new-password" && (
          <div>
            <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
              <p className="font-semibold mb-1">Password requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character (!@#$%^&*...)</li>
              </ul>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Lock className="text-blue-600" size={18} />
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (newPasswordError) setNewPasswordError("");
              }}
              onBlur={() => {
                const validation = validatePassword(newPassword);
                if (!newPassword.trim()) {
                  setNewPasswordError("New password is required");
                } else if (!validation.valid) {
                  setNewPasswordError(validation.message);
                }
              }}
              className={`w-full px-4 py-2 border rounded-md text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                newPasswordError ? "border-red-500" : "border-blue-300"
              }`}
              disabled={isLoading}
            />
            {newPasswordError && (
              <p className="text-sm text-red-600 mt-1">{newPasswordError}</p>
            )}

            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 mt-4">
              <Lock className="text-blue-600" size={18} />
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              onBlur={() => {
                if (!confirmPassword.trim()) {
                  setConfirmPasswordError("Please confirm your password");
                } else if (newPassword !== confirmPassword) {
                  setConfirmPasswordError("Passwords do not match");
                }
              }}
              className={`w-full px-4 py-2 border rounded-md text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                confirmPasswordError ? "border-red-500" : "border-blue-300"
              }`}
              disabled={isLoading}
            />
            {confirmPasswordError && (
              <p className="text-sm text-red-600 mt-1">
                {confirmPasswordError}
              </p>
            )}

            <button
              onClick={resetPassword}
              disabled={isLoading}
              className="cursor-pointer w-full mt-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        )}

        {step === "success" && (
          <div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
              <p className="text-green-700 font-semibold mb-2">
                Password Reset Successfully!
              </p>
              <p className="text-green-600 text-sm">
                Your password has been changed. You will be redirected to the
                login page in a moment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

