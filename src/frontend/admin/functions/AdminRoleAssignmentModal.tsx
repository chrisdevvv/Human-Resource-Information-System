"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  accountId: number;
  accountName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdminRoleAssignmentModal({
  accountId,
  accountName,
  onClose,
  onSuccess,
}: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAssignClick = () => {
    if (!password.trim()) {
      setError("Please enter your password to confirm.");
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const verifyRes = await fetch(
        "http://localhost:3000/api/auth/verify-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        },
      );

      if (!verifyRes.ok) {
        const body = await verifyRes.json();
        throw new Error(body.message || "Incorrect password.");
      }

      const approveRes = await fetch(
        `http://localhost:3000/api/registrations/${accountId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approved_role: "DATA_ENCODER" }),
        },
      );

      if (!approveRes.ok) {
        const body = await approveRes.json();
        throw new Error(body.message || "Failed to assign role.");
      }

      onSuccess();
    } catch (err) {
      setShowConfirm(false);
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
        {showConfirm && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white rounded-xl px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Confirm Role Assignment
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              You are about to assign the role
            </p>
            <p className="text-base font-semibold text-blue-700 mb-1">
              Data Encoder
            </p>
            <p className="text-sm text-gray-500 mb-6">
              to{" "}
              <span className="font-semibold text-gray-700">{accountName}</span>
              .
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full text-left">
                {error}
              </p>
            )}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm cursor-pointer disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm cursor-pointer disabled:opacity-60"
              >
                {loading ? "Assigning..." : "Confirm"}
              </button>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-800 mb-1">Assign Role</h2>
        <p className="text-sm text-gray-500 mb-5">
          Assigning role for{" "}
          <span className="font-semibold text-gray-700">{accountName}</span>
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Role
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-gray-50">
            Data Encoder
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Admin can only assign Data Encoder role.
          </p>
        </div>

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

        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignClick}
            disabled={loading}
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm cursor-pointer disabled:opacity-60"
          >
            Assign Role
          </button>
        </div>
      </div>
    </div>
  );
}
