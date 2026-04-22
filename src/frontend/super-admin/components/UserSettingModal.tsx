"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import { createClearHandler } from "../../utils/clearFormUtils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";

type UserSettingModalProps = {
  userId: number;
  userName: string;
  initialRole: UserRole;
  initialIsActive: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
  onError?: (message: string) => void;
};

type UserDetailsResponse = {
  data?: {
    role?: UserRole;
    is_active?: boolean | number | string;
  };
};

const normalizeIsActive = (value: unknown): boolean => {
  return value === true || value === 1 || value === "1" || value === "true";
};

export default function UserSettingModal({
  userId,
  userName,
  initialRole,
  initialIsActive,
  onClose,
  onSuccess,
  onError,
}: UserSettingModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [superAdminPassword, setSuperAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | "role" | "status">(
    null,
  );

  // Important fix:
  // Prevent delayed API response from overwriting the role the user already selected.
  const roleTouchedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const fetchUserDetails = async () => {
      try {
        setLoadingUser(true);
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("No authentication token found.");

        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = (await response.json().catch(() => ({}))) as UserDetailsResponse & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch user details.");
        }

        if (cancelled) return;

        const roleFromApi = result.data?.role;
        const activeFromApi = result.data?.is_active;

        if (roleFromApi) {
          setCurrentRole(roleFromApi);

          // Only sync dropdown from API if the user has NOT interacted yet.
          if (!roleTouchedRef.current) {
            setSelectedRole(roleFromApi);
          }
        }

        if (activeFromApi !== undefined) {
          setIsActive(normalizeIsActive(activeFromApi));
        }
      } catch (err) {
        if (cancelled) return;

        const errorMessage =
          err instanceof Error ? err.message : "An error occurred.";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    fetchUserDetails();

    return () => {
      cancelled = true;
    };
  }, [userId, onError]);

  useEffect(() => {
    if (selectedRole !== "SUPER_ADMIN") {
      setSuperAdminPassword("");
      setShowPassword(false);
    }
  }, [selectedRole]);

  const handleSaveRole = async () => {
    if (selectedRole === currentRole) {
      setError("No role changes detected.");
      return;
    }

    if (selectedRole === "SUPER_ADMIN" && !superAdminPassword.trim()) {
      setError("Please enter your password before promoting to Super Admin.");
      return;
    }

    try {
      setSavingRole(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      if (selectedRole === "SUPER_ADMIN") {
        const verifyRes = await fetch(`${API_BASE}/api/auth/verify-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: superAdminPassword }),
        });

        const verifyBody = (await verifyRes.json().catch(() => ({}))) as {
          message?: string;
        };

        if (!verifyRes.ok) {
          throw new Error(verifyBody.message || "Incorrect password.");
        }
      }

      const response = await fetch(`${API_BASE}/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.message || "Failed to update role.");
      }

      setCurrentRole(selectedRole);
      setSelectedRole(selectedRole);
      setSuperAdminPassword("");
      setShowPassword(false);
      setConfirmAction(null);
      roleTouchedRef.current = false;

      onSuccess("User role updated successfully.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred.";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setSavingRole(false);
    }
  };

  const handleToggleStatus = async () => {
    if (isActive && currentRole === "SUPER_ADMIN") {
      setError("Super Admin accounts cannot be deactivated.");
      return;
    }

    const nextStatus = !isActive;

    try {
      setSavingStatus(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch(`${API_BASE}/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: nextStatus ? 1 : 0 }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.message || "Failed to update account status.");
      }

      setIsActive(nextStatus);
      setConfirmAction(null);
      onSuccess("User account status updated successfully.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred.";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setSavingStatus(false);
    }
  };

  const hasRoleChanges =
    selectedRole !== currentRole || !!superAdminPassword.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-blue-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600"
          aria-label="Close settings modal"
        >
          <X size={18} />
        </button>

        <h2 className="mb-1 text-xl font-bold text-gray-800">User Settings</h2>
        <p className="mb-5 text-sm text-gray-500">
          Manage account for {userName}
        </p>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {loadingUser ? (
          <p className="text-sm text-gray-500">Loading user settings...</p>
        ) : (
          <>
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  roleTouchedRef.current = true;
                  setSelectedRole(e.target.value as UserRole);
                }}
                disabled={savingRole || savingStatus}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="DATA_ENCODER">Data Encoder</option>
              </select>

              {selectedRole === "SUPER_ADMIN" && (
                <div className="mt-3">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confirm With Super Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={superAdminPassword}
                      onChange={(e) => setSuperAdminPassword(e.target.value)}
                      disabled={savingRole || savingStatus}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={savingRole || savingStatus}
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-3 flex w-full items-center gap-2">
                {hasRoleChanges && (
                  <button
                    onClick={createClearHandler(
                      () => {
                        setSelectedRole(currentRole);
                        setSuperAdminPassword("");
                        setError(null);
                        setShowPassword(false);
                        roleTouchedRef.current = false;
                      },
                      hasRoleChanges,
                    )}
                    disabled={savingRole || savingStatus}
                    className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60 disabled:no-underline"
                  >
                    Clear All
                  </button>
                )}

                <button
                  onClick={() => {
                    if (selectedRole === currentRole) {
                      setError("No role changes detected.");
                      return;
                    }

                    if (
                      selectedRole === "SUPER_ADMIN" &&
                      !superAdminPassword.trim()
                    ) {
                      setError(
                        "Please enter your password before promoting to Super Admin.",
                      );
                      return;
                    }

                    setError(null);
                    setConfirmAction("role");
                  }}
                  disabled={savingRole || savingStatus}
                  className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  Save Role
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="mb-3 text-sm text-gray-700">
                Account is currently{" "}
                <span
                  className={
                    isActive
                      ? "font-semibold text-green-700"
                      : "font-semibold text-red-700"
                  }
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </p>

              <button
                onClick={() => {
                  setError(null);
                  setConfirmAction("status");
                }}
                disabled={
                  savingStatus ||
                  savingRole ||
                  (isActive && currentRole === "SUPER_ADMIN")
                }
                className={`w-full cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                  isActive && currentRole === "SUPER_ADMIN"
                    ? "cursor-not-allowed bg-gray-300 text-gray-500"
                    : isActive
                      ? "bg-red-500 text-white hover:bg-red-800"
                      : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isActive && currentRole === "SUPER_ADMIN"
                  ? "Cannot Deactivate Super Admin"
                  : isActive
                    ? "Deactivate Account"
                    : "Reactivate Account"}
              </button>

              {isActive && currentRole === "SUPER_ADMIN" && (
                <p className="mt-2 text-xs text-gray-500">
                  Deactivation is disabled for Super Admin accounts.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        visible={confirmAction === "role"}
        title="Confirm Role Update"
        message={`You are about to change ${userName}'s role to ${selectedRole.replace(/_/g, " ")}.`}
        warningMessage={
          selectedRole === "SUPER_ADMIN"
            ? "Warning: This user will have the same full privileges as a Super Admin."
            : undefined
        }
        confirmLabel={
          selectedRole === "SUPER_ADMIN"
            ? "Promote to Super Admin"
            : "Confirm Role Change"
        }
        confirmClassName={
          selectedRole === "SUPER_ADMIN"
            ? "bg-amber-600 hover:bg-amber-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }
        loading={savingRole}
        onConfirm={handleSaveRole}
        onCancel={() => {
          if (savingRole) return;
          setConfirmAction(null);
        }}
      />

      <ConfirmationModal
        visible={confirmAction === "status"}
        title={isActive ? "Confirm Deactivation" : "Confirm Reactivation"}
        message={
          isActive
            ? `You are about to deactivate ${userName}'s account.`
            : `You are about to reactivate ${userName}'s account.`
        }
        warningMessage={
          isActive
            ? "This user will no longer be able to sign in until reactivated."
            : undefined
        }
        confirmLabel={isActive ? "Deactivate" : "Reactivate"}
        confirmClassName={
          isActive
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"
        }
        loading={savingStatus}
        onConfirm={handleToggleStatus}
        onCancel={() => {
          if (savingStatus) return;
          setConfirmAction(null);
        }}
      />
    </div>
  );
}