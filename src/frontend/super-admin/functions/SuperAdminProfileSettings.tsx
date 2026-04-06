"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { logoutNow } from "@/frontend/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type ProfileInfo = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  birthdate: string;
  school: string;
};

const toBirthdateLabel = (raw: unknown) => {
  if (!raw) return "N/A";
  const value = String(raw).trim();
  if (!value) return "N/A";
  return value.slice(0, 10);
};

export default function SuperAdminProfileSettings() {
  const [profile, setProfile] = useState<ProfileInfo>({
    firstName: "N/A",
    lastName: "N/A",
    middleName: "N/A",
    email: "N/A",
    birthdate: "N/A",
    school: "N/A",
  });
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showConfirmPasswordModal, setShowConfirmPasswordModal] =
    useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const raw = localStorage.getItem("user");
        const token = localStorage.getItem("authToken");
        if (!raw || !token) {
          setProfileError("Unable to load profile info.");
          return;
        }

        const parsed = JSON.parse(raw);
        setProfile({
          firstName: parsed.first_name || "N/A",
          lastName: parsed.last_name || "N/A",
          middleName: parsed.middle_name || "N/A",
          email: parsed.email || "N/A",
          birthdate: toBirthdateLabel(parsed.birthdate),
          school: parsed.school_name || "N/A",
        });

        if (parsed.id) {
          const response = await fetch(
            `${API_BASE_URL}/api/users/${parsed.id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            const result = await response.json();
            const user = result.data;
            setProfile((prev) => ({
              ...prev,
              firstName: user?.first_name || prev.firstName,
              lastName: user?.last_name || prev.lastName,
              middleName: user?.middle_name || "N/A",
              email: user?.email || prev.email,
              birthdate: toBirthdateLabel(user?.birthdate),
              school: user?.school_name || prev.school,
            }));
          }
        }
      } catch {
        setProfileError("Unable to load profile info.");
      }
    };

    loadProfile();
  }, []);

  const canSavePassword =
    newPassword.trim().length > 0 &&
    retypePassword.trim().length > 0 &&
    !savingPassword;

  const handleSavePassword = () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }

    if (!newPassword.trim() || !retypePassword.trim()) {
      setPasswordError("Please fill in new password and retype password.");
      return;
    }

    if (newPassword !== retypePassword) {
      setPasswordError("New password and retype password do not match.");
      return;
    }

    setShowConfirmPasswordModal(true);
  };

  const handleConfirmPasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    const token = localStorage.getItem("authToken");
    if (!token) {
      setPasswordError("No authentication token found.");
      setShowConfirmPasswordModal(false);
      return;
    }

    try {
      setSavingPassword(true);
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

      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.message || "Failed to change password.");
        return;
      }

      setPasswordSuccess("Password updated. Please log in again.");
      setCurrentPassword("");
      setNewPassword("");
      setRetypePassword("");
      await logoutNow();
      window.setTimeout(() => {
        window.location.replace("/login");
      }, 900);
    } catch {
      setPasswordError("Failed to change password.");
    } finally {
      setSavingPassword(false);
      setShowConfirmPasswordModal(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Profile Information
        </h2>

        {profileError && (
          <p className="text-sm text-red-600 mb-3">{profileError}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              First Name
            </label>
            <input
              value={profile.firstName}
              readOnly
              className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Last Name
            </label>
            <input
              value={profile.lastName}
              readOnly
              className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Middle Name
            </label>
            <input
              value={profile.middleName || "N/A"}
              readOnly
              className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Email
            </label>
            <input
              value={profile.email}
              readOnly
              className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Birthdate
            </label>
            <input
              value={profile.birthdate}
              readOnly
              className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              School
            </label>
            <input
              value={profile.school}
              readOnly
              className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Change Password
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Current Password
            </label>
            <div className="relative mt-1">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                aria-label={
                  showCurrentPassword ? "Hide password" : "Show password"
                }
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Retype New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showRetypePassword ? "text" : "password"}
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowRetypePassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                aria-label={
                  showRetypePassword ? "Hide password" : "Show password"
                }
              >
                {showRetypePassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {passwordError && (
          <p className="text-sm text-red-600 mt-3">{passwordError}</p>
        )}
        {passwordSuccess && (
          <p className="text-sm text-green-600 mt-3">{passwordSuccess}</p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSavePassword}
            disabled={!canSavePassword}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              canSavePassword
                ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {savingPassword ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <ConfirmationModal
          visible={showConfirmPasswordModal}
          title="Confirm Password Update"
          message="Are you sure you want to update your password?"
          warningMessage="You will need to use your new password on your next login."
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          loading={savingPassword}
          onConfirm={handleConfirmPasswordChange}
          onCancel={() => setShowConfirmPasswordModal(false)}
        />
      </div>
    </div>
  );
}
