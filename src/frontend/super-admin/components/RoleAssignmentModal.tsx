"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";

type Props = {
  accountId: number;
  accountName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function RoleAssignmentModal({
  accountId,
  accountName,
  onClose,
  onSuccess,
}: Props) {
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "DATA_ENCODER">(
    "DATA_ENCODER",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!password.trim()) {
      setError("Please enter your password to confirm.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      // Verify super-admin password first
      const verifyRes = await fetch("http://localhost:3000/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!verifyRes.ok) {
        const body = await verifyRes.json();
        throw new Error(body.message || "Incorrect password.");
      }

      // Approve the registration with the selected role
      const approveRes = await fetch(
        `http://localhost:3000/api/registrations/${accountId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approved_role: selectedRole }),
        },
      );

      if (!approveRes.ok) {
        const body = await approveRes.json();
        throw new Error(body.message || "Failed to assign role.");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer disabled:opacity-50"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-1">Assign Role</h2>
        <p className="text-sm text-gray-500 mb-5">
          Assigning role for{" "}
          <span className="font-semibold text-gray-700">{accountName}</span>
        </p>

        {/* Role selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) =>
              setSelectedRole(e.target.value as "ADMIN" | "DATA_ENCODER")
            }
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
          >
            <option value="DATA_ENCODER">Data Encoder</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Password confirmation */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm with Your Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              disabled={loading}
              placeholder="Enter your password"
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm cursor-pointer disabled:opacity-60"
          >
            {loading ? "Assigning…" : "Assign Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
