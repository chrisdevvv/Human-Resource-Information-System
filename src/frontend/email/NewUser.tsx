"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const FORCE_PASSWORD_CHANGE_KEY = "forcePasswordChange:addedUsers";
const PENDING_PASSWORD_KEY = "forcePasswordChange:pendingLoginPassword";
const PENDING_EMAIL_KEY = "forcePasswordChange:pendingEmail";

type AuthUser = {
  email?: string;
  role?: string;
};

function parseForcedEmails(): string[] {
  try {
    const raw = localStorage.getItem(FORCE_PASSWORD_CHANGE_KEY) || "[]";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function removeForcedEmail(targetEmail: string) {
  const normalizedTarget = targetEmail.trim().toLowerCase();
  const updated = parseForcedEmails().filter(
    (item) => item !== normalizedTarget,
  );
  localStorage.setItem(FORCE_PASSWORD_CHANGE_KEY, JSON.stringify(updated));
}

function validatePassword(value: string) {
  if (value.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters",
    };
  }
  if (!/[A-Z]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain an uppercase letter",
    };
  }
  if (!/[a-z]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain a lowercase letter",
    };
  }
  if (!/[0-9]/.test(value)) {
    return { valid: false, message: "Password must contain a number" };
  }
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain a special character",
    };
  }
  return { valid: true, message: "" };
}

function getDashboardPath(role?: string) {
  if (role === "SUPER_ADMIN") return "/super-admin";
  if (role === "ADMIN") return "/admin";
  if (role === "DATA_ENCODER") return "/data-encoder";
  return "/login";
}

export default function NewUser() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const normalizedEmail = useMemo(
    () =>
      String(currentUser?.email || "")
        .trim()
        .toLowerCase(),
    [currentUser],
  );

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userRaw = localStorage.getItem("user");

    if (!token || !userRaw) {
      router.replace("/login");
      return;
    }

    let parsedUser: AuthUser | null = null;
    try {
      parsedUser = JSON.parse(userRaw) as AuthUser;
    } catch {
      parsedUser = null;
    }

    if (!parsedUser?.email) {
      router.replace("/login");
      return;
    }

    const email = String(parsedUser.email).trim().toLowerCase();
    const forcedList = parseForcedEmails();
    const isForced = forcedList.includes(email);

    if (!isForced) {
      router.replace(getDashboardPath(parsedUser.role));
      return;
    }

    const pendingEmail = String(sessionStorage.getItem(PENDING_EMAIL_KEY) || "")
      .trim()
      .toLowerCase();
    const pendingPassword = sessionStorage.getItem(PENDING_PASSWORD_KEY) || "";

    if (!pendingPassword || pendingEmail !== email) {
      setError("Session expired. Please log in again to change your password.");
      setReady(true);
      return;
    }

    setCurrentPassword(pendingPassword);
    setCurrentUser(parsedUser);
    setReady(true);
  }, [router]);

  const handleSaveChanges = async () => {
    setError("");
    setNewPasswordError("");
    setConfirmPasswordError("");

    let hasError = false;

    const newPasswordValidation = validatePassword(newPassword);
    if (!newPassword.trim()) {
      setNewPasswordError("New password is required");
      hasError = true;
    } else if (!newPasswordValidation.valid) {
      setNewPasswordError(newPasswordValidation.message);
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your new password");
      hasError = true;
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (newPassword === currentPassword && newPassword) {
      setNewPasswordError(
        "New password must be different from your current password",
      );
      hasError = true;
    }

    if (hasError) {
      setError("Please correct the errors before saving.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const payload = await response
        .json()
        .catch(() => ({}) as { message?: string });

      if (!response.ok) {
        throw new Error(payload.message || "Failed to change password.");
      }

      removeForcedEmail(normalizedEmail);
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
      sessionStorage.removeItem(PENDING_PASSWORD_KEY);
      sessionStorage.removeItem("authSessionActive");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      setSuccess(true);

      window.setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="fixed inset-0 z-40 bg-black/40" />

      <div className="relative z-50 bg-white rounded-xl border border-blue-200 shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">Security Update</h1>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          For security purposes, please set a new password before continuing.
        </p>

        {!ready ? (
          <p className="text-sm text-gray-500">Preparing secure session...</p>
        ) : success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-3">
            <p className="text-sm font-medium text-green-800">
              Password successfully changed.
            </p>
            <p className="text-xs text-green-700 mt-1">
              You will be redirected to the login page shortly.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Enter New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (newPasswordError) setNewPasswordError("");
                    }}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPasswordError && (
                  <p className="text-xs text-red-600 mt-1">
                    {newPasswordError}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-xs text-red-600 mt-1">
                    {confirmPasswordError}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              className="mt-6 w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
