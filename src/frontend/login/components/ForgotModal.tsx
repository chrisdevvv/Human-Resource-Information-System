"use client";
// Component: ForgotModal
// Filename: ForgotModal.tsx
// Purpose: Multi-step reset password modal (email -> simulate sent -> change password)
import React, { useState } from "react";
import { Mail, Lock } from "../../assets/icons";

type Props = { visible: boolean; onClose: () => void };

export default function ForgotModal({ visible, onClose }: Props) {
  const [step, setStep] = useState<"email" | "sent" | "old" | "new">("email");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Error states
  const [emailError, setEmailError] = useState("");
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  function validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

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

  function sendReset() {
    setEmailError("");
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setStep("sent");
  }

  function verifyOldPassword() {
    setOldPasswordError("");
    if (!oldPassword.trim()) {
      setOldPasswordError("Old password is required");
      return;
    }
    setStep("new");
  }

  function saveNewPassword() {
    setNewPasswordError("");
    setConfirmPasswordError("");

    const passwordValidation = validatePassword(newPassword);
    if (!newPassword.trim()) {
      setNewPasswordError("New password is required");
      return;
    }
    if (!passwordValidation.valid) {
      setNewPasswordError(passwordValidation.message);
      return;
    }
    if (!confirmNewPassword.trim()) {
      setConfirmPasswordError("Please confirm your new password");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    // Success - close modal
    onClose();
  }

  function resetForm() {
    setStep("email");
    setEmail("");
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setEmailError("");
    setOldPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
  }

  return (
    <div
      className={`${visible ? "flex" : "hidden"} fixed inset-0 items-center justify-center bg-black/40 z-50`}
      aria-hidden={!visible}
    >
      <div className="relative bg-white p-8 rounded-lg w-full max-w-2xl shadow-lg">
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

        {step === "email" && (
          <div id="forgotStepEmail" className="mt-3">
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
            />
            {emailError && (
              <p className="text-sm text-red-600 mt-1">{emailError}</p>
            )}
            <div className="flex flex-col gap-3 items-center mt-4">
              <button
                id="sendReset"
                className="hover:cursor-pointer transition hover:bg-blue-700 px-6 py-2 bg-blue-600 text-white rounded-md w-full"
                onClick={sendReset}
              >
                Send reset email
              </button>
              <button
                id="cancelForgot"
                className="text-black hover:cursor-pointer bg-gray-200 px-6 py-2 border rounded-md w-full hover:bg-gray-400 transition"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === "sent" && (
          <div id="forgotStepSent" className="mt-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
              <p className="text-green-700">
                If an account matched that email, a reset link was sent. Please
                check your email to proceed.
              </p>
            </div>
            <div className="flex flex-col gap-3 items-center">
              <button
                id="openResetLink"
                className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full"
                onClick={() => setStep("old")}
              >
                Open reset link
              </button>
              <button
                id="cancelForgot2"
                className="px-6 py-2 border rounded-md hover:bg-gray-100 transition w-full"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === "old" && (
          <div id="forgotStep1" className="mt-3">
            <label className="flex items-center gap-2 text-sky-900">
              <Lock className="text-blue-600" size={18} />
              Old password <span className="text-red-500">*</span>
            </label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                if (oldPasswordError) setOldPasswordError("");
              }}
              onBlur={() => {
                if (!oldPassword.trim()) {
                  setOldPasswordError("Old password is required");
                } else {
                  setOldPasswordError("");
                }
              }}
              className={`mt-2 w-full px-3 py-2 border rounded-md ${
                oldPasswordError ? "border-red-500" : ""
              }`}
            />
            {oldPasswordError && (
              <p className="text-sm text-red-600 mt-1">{oldPasswordError}</p>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <button
                id="verifyOld"
                className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                onClick={verifyOldPassword}
              >
                Verify
              </button>
              <button
                id="cancelForgot3"
                className="text-black px-4 py-2 border rounded-md hover:bg-gray-100 transition"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === "new" && (
          <div id="forgotStep2" className="mt-3">
            <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
              <p className="font-semibold mb-1">Password requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character (!@#$%^&*...)</li>
              </ul>
            </div>

            <label className="flex items-center gap-2 text-sky-900">
              <Lock className="text-blue-600" size={18} />
              New password <span className="text-red-500">*</span>
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (newPasswordError) setNewPasswordError("");
                if (confirmNewPassword && confirmPasswordError) {
                  if (e.target.value === confirmNewPassword) {
                    setConfirmPasswordError("");
                  }
                }
              }}
              onBlur={() => {
                const validation = validatePassword(newPassword);
                if (!newPassword.trim()) {
                  setNewPasswordError("New password is required");
                } else if (!validation.valid) {
                  setNewPasswordError(validation.message);
                } else {
                  setNewPasswordError("");
                }
              }}
              className={`mt-2 w-full px-3 py-2 border rounded-md ${
                newPasswordError ? "border-red-500" : ""
              }`}
            />
            {newPasswordError && (
              <p className="text-sm text-red-600 mt-1">{newPasswordError}</p>
            )}

            <label className="flex items-center gap-2 mt-2 text-sky-900">
              <Lock className="text-blue-600" size={18} />
              Confirm new password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => {
                setConfirmNewPassword(e.target.value);
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              onBlur={() => {
                if (!confirmNewPassword.trim()) {
                  setConfirmPasswordError("Please confirm your new password");
                } else if (newPassword !== confirmNewPassword) {
                  setConfirmPasswordError("Passwords do not match");
                } else {
                  setConfirmPasswordError("");
                }
              }}
              className={`mt-2 w-full px-3 py-2 border rounded-md ${
                confirmPasswordError ? "border-red-500" : ""
              }`}
            />
            {confirmPasswordError && (
              <p className="text-sm text-red-600 mt-1">
                {confirmPasswordError}
              </p>
            )}

            <div className="flex gap-3 justify-center mt-4">
              <button
                id="saveNew"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                onClick={saveNewPassword}
              >
                Save
              </button>
              <button
                id="backToOld"
                className="px-4 py-2 border rounded-md hover:bg-gray-100 transition"
                onClick={() => {
                  setStep("old");
                  setNewPasswordError("");
                  setConfirmPasswordError("");
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
