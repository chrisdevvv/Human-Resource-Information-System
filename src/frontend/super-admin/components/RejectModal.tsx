"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

type Props = {
  accountId: number;
  accountName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function RejectModal({
  accountId,
  accountName,
  onClose,
  onSuccess,
}: Props) {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReject = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const res = await fetch(
        `${API_BASE}/api/registrations/${accountId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rejection_reason: reason.trim() || null }),
        },
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Failed to reject registration.");
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
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Reject Registration
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          You are about to reject the registration of{" "}
          <span className="font-semibold text-gray-700">{accountName}</span>.
          This action cannot be undone.
        </p>

        {/* Optional reason */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Reason for Rejection{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            disabled={loading}
            placeholder="e.g. Incomplete information, duplicate account…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none disabled:opacity-50"
          />
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
            onClick={handleReject}
            disabled={loading}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm cursor-pointer disabled:opacity-60"
          >
            {loading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
