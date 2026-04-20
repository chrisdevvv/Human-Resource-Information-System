"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
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

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.message || "Failed to fetch user details.");
        }

        const result = (await response.json()) as UserDetailsResponse;
        const roleFromApi = result.data?.role;
        const activeFromApi = result.data?.is_active;

        if (roleFromApi) {
          setCurrentRole(roleFromApi);
          setSelectedRole(roleFromApi);
        }

        if (activeFromApi !== undefined) {
          setIsActive(normalizeIsActive(activeFromApi));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred.";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserDetails();
  }, [userId, onError]);

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

        if (!verifyRes.ok) {
          const body = await verifyRes.json();
          throw new Error(body.message || "Incorrect password.");
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

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || "Failed to update role.");
      }

      setCurrentRole(selectedRole);
      setSuperAdminPassword("");
      setConfirmAction(null);

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

      if (!response.ok) {
        const body = await response.json();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-blue-200 shadow-2xl w-full max-w-md mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label="Close settings modal"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-1">User Settings</h2>
        <p className="text-sm text-gray-500 mb-5">
          Manage account for {userName}
        </p>

        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {loadingUser ? (
          <p className="text-sm text-gray-500">Loading user settings...</p>
        ) : (
          <>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                disabled={savingRole || savingStatus}
                className="text-gray-600 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="DATA_ENCODER">Data Encoder</option>
              </select>
              <div className="mt-3 flex w-full items-center gap-2">
                {(selectedRole !== initialRole || !!superAdminPassword) && (
                  <button
                    onClick={createClearHandler(
                      () => {
                        setSelectedRole(initialRole);
                        setSuperAdminPassword("");
                        setError(null);
                        setShowPassword(false);
                      },
                      selectedRole !== initialRole || !!superAdminPassword,
                    )}
                    disabled={savingRole || savingStatus}
                    className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60 disabled:no-underline"
                  >
                    Clear All
                  </button>
                )}

                <button
                  onClick={() => {
                    setError(null);
                    setConfirmAction("role");
                  }}
                  disabled={savingRole || savingStatus}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer disabled:opacity-60"
                >
                  Save Role
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700 mb-3">
                Account is currently{" "}
                <span
                  className={
                    isActive
                      ? "text-green-700 font-semibold"
                      : "text-red-700 font-semibold"
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
                className={`w-full px-3 py-1.5 rounded-lg transition font-medium text-sm cursor-pointer disabled:opacity-60 ${
                  isActive && currentRole === "SUPER_ADMIN"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
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
      >
        {selectedRole === "SUPER_ADMIN" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm With Super Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={superAdminPassword}
                onChange={(e) => setSuperAdminPassword(e.target.value)}
                disabled={savingRole}
                placeholder="Enter your password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={savingRole}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}
      </ConfirmationModal>

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
