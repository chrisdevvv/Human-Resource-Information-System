"use client";
// Component: RegistrationModal
// Filename: RegistrationModal.tsx
// Purpose: Simple registration modal placeholder to be opened from the login modal
import React, { useState } from "react";
import { Mail, Key, User, X } from "../../assets/icons";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function RegistrationModal({ visible, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit() {
    // Placeholder: replace with real registration logic
    onClose();
  }

  return (
    <div
      className={`${visible ? "flex" : "hidden"} fixed inset-0 items-center justify-center bg-black/40 z-50`}
      aria-hidden={!visible}
    >
      <div className="relative bg-white p-6 rounded-lg w-full max-w-md border shadow">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create an account</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-gray-600 hover:bg-gray-100 p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <label className="mt-4 block text-sm">Full name</label>
        <div className="flex items-center gap-3 mt-2 text-gray-600">
          <User className="text-blue-600" size={18} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="flex-1 px-3 py-2 border rounded-md"
          />
        </div>

        <label className="mt-3 block text-sm">Email</label>
        <div className="flex items-center gap-3 mt-2 text-gray-600">
          <Mail className="text-blue-600" size={18} />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 px-3 py-2 border rounded-md"
          />
        </div>

        <label className="mt-3 block text-sm">Password</label>
        <div className="flex items-center gap-3 mt-2 text-gray-600">
          <Key className="text-blue-600" size={18} />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            type="password"
            className="flex-1 px-3 py-2 border rounded-md"
          />
        </div>

        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={submit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Sign up
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
