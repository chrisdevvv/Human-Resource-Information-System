"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import ConfirmationModal from "../components/ConfirmationModal";
import { logoutNow } from "@/frontend/auth/session";
import { createClearHandler } from "../../utils/clearFormUtils";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type ProfileInfo = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  birthdate: string;
  school: string;
  role: string;
  accountStatus: string;
  memberSince: string;
};

const toBirthdateLabel = (raw: unknown) => {
  if (!raw) return "N/A";
  const value = String(raw).trim();
  if (!value) return "N/A";
  return value.slice(0, 10);
};

const toMemberSinceLabel = (raw: unknown) => {
  if (!raw) return "N/A";
  const value = String(raw).trim();
  if (!value) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const toRoleLabel = (raw: unknown) => {
  const value = String(raw || "").trim();
  if (!value) return "N/A";

  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const toAccountStatusLabel = (raw: unknown) => {
  if (typeof raw === "boolean") {
    return raw ? "Active" : "Inactive";
  }

  if (typeof raw === "number") {
    return raw === 1 ? "Active" : "Inactive";
  }

  const value = String(raw || "")
    .trim()
    .toLowerCase();
  if (!value) return "N/A";
  if (["active", "1", "true"].includes(value)) return "Active";
  if (["inactive", "0", "false"].includes(value)) return "Inactive";
  return "N/A";
};

const toMiddleNamePart = (raw: string) => {
  const value = String(raw || "").trim();
  if (!value || value.toLowerCase() === "n/a") return "";
  return value;
};

export default function SuperAdminProfileSettings() {
  const [profile, setProfile] = useState<ProfileInfo>({
    firstName: "N/A",
    lastName: "N/A",
    middleName: "N/A",
    email: "N/A",
    birthdate: "N/A",
    school: "N/A",
    role: "N/A",
    accountStatus: "N/A",
    memberSince: "N/A",
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
          role: toRoleLabel(parsed.role),
          accountStatus: toAccountStatusLabel(parsed.is_active),
          memberSince: toMemberSinceLabel(parsed.created_at),
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
              role: toRoleLabel(user?.role || prev.role),
              accountStatus: toAccountStatusLabel(
                user?.is_active ?? prev.accountStatus,
              ),
              memberSince: toMemberSinceLabel(
                user?.created_at || prev.memberSince,
              ),
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
      <div className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow">
        <div className="bg-blue-800 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-blue-200 bg-blue-600 text-lg font-bold">
              {`${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`
                .toUpperCase()
                .trim() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {`${profile.firstName} ${profile.lastName}`.trim()}
              </h2>
              <p className="text-sm text-blue-100">{profile.email}</p>
              <span className="mt-1.5 inline-block rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-100">
                {profile.role}
              </span>
            </div>
          </div>
        </div>

        {profileError && (
          <p className="px-6 pt-4 text-sm text-red-600">{profileError}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-gray-200">
          <div className="border-b border-gray-200 px-5 py-3 sm:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Full Name
            </p>
            <input
              readOnly
              value={`${profile.firstName} ${toMiddleNamePart(profile.middleName)} ${profile.lastName}`
                .replace(/\s+/g, " ")
                .trim()}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div className="border-b border-gray-200 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Email Address
            </p>
            <input
              readOnly
              value={profile.email}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div className="border-b border-gray-200 px-5 py-3 sm:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Birthday
            </p>
            <input
              readOnly
              value={profile.birthdate}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div className="border-b border-gray-200 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Account Status
            </p>
            <input
              readOnly
              value={profile.accountStatus}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div className="px-5 py-3 sm:border-r">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Role
            </p>
            <input
              readOnly
              value={profile.role}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div className="px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Member Since
            </p>
            <input
              readOnly
              value={profile.memberSince}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            School
          </p>
          <input
            readOnly
            value={profile.school}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
          />
        </div>
      </div>

      <div className="border border-blue-200 bg-white rounded-lg shadow p-6">
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

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={createClearHandler(
              () => {
                setCurrentPassword("");
                setNewPassword("");
                setRetypePassword("");
                setPasswordError("");
                setPasswordSuccess("");
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowRetypePassword(false);
              },
              !!(currentPassword || newPassword || retypePassword),
            )}
            className={`mr-auto px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer`}
          >
            <span className="inline-flex items-center gap-1">Clear All</span>
          </button>

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
            <span className="inline-flex items-center gap-1">
              <Save size={14} />
              {savingPassword ? "Saving..." : "Save Changes"}
            </span>
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
