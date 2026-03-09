"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, X } from "lucide-react";

type UserInfo = {
  username?: string;
  email?: string;
  role?: string;
};

type Props = {
  visible: boolean;
  user: UserInfo | null;
  onClose: () => void;
};

function formatRole(role?: string) {
  if (!role) return "User";
  return role
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function LoginSuccessModal({ visible, user, onClose }: Props) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      aria-hidden={!visible}
    >
      <div className="relative bg-white p-7 rounded-lg w-full max-w-md border-2 border-green-500 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer hover:bg-red-500 hover:text-white absolute top-3 right-3 p-1 rounded text-gray-500 transition"
          aria-label="Close success modal"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-3 text-green-600">
            <CheckCircle2 size={46} />
          </div>
          <h3 className="text-xl font-semibold text-green-700">
            Login Successful
          </h3>
          <p className="text-gray-600 mt-2">Welcome back to DepEd ELMS.</p>

          <div className="mt-5 p-3 rounded-md bg-green-50 border border-green-200 text-left">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Account:</span>{" "}
              {user?.email || user?.username || "Signed in"}
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
              <ShieldCheck size={16} className="text-green-600" />
              <span className="font-medium">Role:</span>
              <span>{formatRole(user?.role)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer mt-5 px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
