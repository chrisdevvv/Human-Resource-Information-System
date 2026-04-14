"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Save, XCircle } from "lucide-react";
import ConfirmationModal from "../../super-admin/components/ConfirmationModal";
import { logoutNow } from "@/frontend/auth/session";
import { createClearHandler } from "../../utils/clearFormUtils";
import ToastMessage from "../../components/ToastMessage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const SCHOOLS_DIVISION_OFFICE = "Schools Division Office";

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

type ProfileMeta = {
  id: number | null;
  roleKey: "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER" | "";
  schoolId: number | null;
};

type ProfileEditor = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  birthdate: string;
  schoolId: string;
  schoolName: string;
};

type SchoolOption = {
  id: number;
  school_name: string;
};

type UserProfileResponse = {
  data?: {
    id?: number;
    first_name?: string;
    middle_name?: string | null;
    last_name?: string;
    email?: string;
    birthdate?: string | null;
    school_id?: number | null;
    school_name?: string | null;
    role?: string;
    is_active?: unknown;
    created_at?: string;
  };
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

const toRoleKey = (raw: unknown): ProfileMeta["roleKey"] => {
  const normalized = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (
    normalized === "SUPER_ADMIN" ||
    normalized === "ADMIN" ||
    normalized === "DATA_ENCODER"
  ) {
    return normalized;
  }

  return "";
};

const toBirthdateInputValue = (raw: unknown) => {
  if (!raw) return "";
  const value = String(raw).trim();
  if (!value) return "";
  return value.slice(0, 10);
};

const validateEmail = (value: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value.trim());
};

const validateName = (value: string) => {
  const re = /^[a-zA-Z\s\-]{2,}$/;
  return re.test(value.trim());
};

const isFutureDate = (dateOnly: string) => {
  if (!dateOnly) return false;
  const today = new Date();
  const todayOnly = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return dateOnly > todayOnly;
};

export default function ProfileSettings() {
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
  const [profileMeta, setProfileMeta] = useState<ProfileMeta>({
    id: null,
    roleKey: "",
    schoolId: null,
  });
  const [profileEditor, setProfileEditor] = useState<ProfileEditor>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    birthdate: "",
    schoolId: "",
    schoolName: "",
  });
  const [initialProfileEditor, setInitialProfileEditor] =
    useState<ProfileEditor | null>(null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(
    null,
  );
  const [showConfirmProfileSave, setShowConfirmProfileSave] = useState(false);
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [useSchoolsDivisionOffice, setUseSchoolsDivisionOffice] =
    useState(false);
  const [initialUseSchoolsDivisionOffice, setInitialUseSchoolsDivisionOffice] =
    useState(false);
  const [profileFieldErrors, setProfileFieldErrors] = useState<{
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    birthdate: string;
    schoolId: string;
  }>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    birthdate: "",
    schoolId: "",
  });

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
  const [toastState, setToastState] = useState<{
    isVisible: boolean;
    variant: "success" | "error";
    title: string;
    message: string;
  }>({
    isVisible: false,
    variant: "success",
    title: "",
    message: "",
  });

  const showToast = (
    variant: "success" | "error",
    title: string,
    message: string,
  ) => {
    setToastState({
      isVisible: true,
      variant,
      title,
      message,
    });
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const raw = localStorage.getItem("user");
        const token = localStorage.getItem("authToken");
        if (!raw || !token) {
          setProfileError("Unable to load profile info.");
          return;
        }

        const parsed = JSON.parse(raw) as {
          id?: number;
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          email?: string;
          birthdate?: string | null;
          school_id?: number | null;
          school_name?: string | null;
          role?: string;
          is_active?: unknown;
          created_at?: string;
        };

        let user = parsed;
        const response = await fetch(`${API_BASE_URL}/api/users/me/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = (await response.json()) as UserProfileResponse;
          if (result.data) {
            user = result.data;
          }
        }

        const roleKey = toRoleKey(user.role);
        const nextSchoolId =
          Number.isFinite(Number(user.school_id)) && Number(user.school_id) > 0
            ? Number(user.school_id)
            : null;

        setProfile({
          firstName: user.first_name || "N/A",
          lastName: user.last_name || "N/A",
          middleName: user.middle_name || "N/A",
          email: user.email || "N/A",
          birthdate: toBirthdateLabel(user.birthdate),
          school: user.school_name || "N/A",
          role: toRoleLabel(user.role),
          accountStatus: toAccountStatusLabel(user.is_active),
          memberSince: toMemberSinceLabel(user.created_at),
        });

        setProfileMeta({
          id: Number(user.id) || null,
          roleKey,
          schoolId: nextSchoolId,
        });

        const editorState: ProfileEditor = {
          firstName: String(user.first_name || "").trim(),
          middleName: String(user.middle_name || "").trim(),
          lastName: String(user.last_name || "").trim(),
          email: String(user.email || "").trim(),
          birthdate: toBirthdateInputValue(user.birthdate),
          schoolId: nextSchoolId ? String(nextSchoolId) : "",
          schoolName: String(user.school_name || "").trim(),
        };

        setProfileEditor(editorState);
        setInitialProfileEditor(editorState);
        setNoMiddleName(
          !editorState.middleName ||
            editorState.middleName.trim().toUpperCase() === "N/A",
        );
        const isSchoolsDivisionOffice =
          roleKey === "SUPER_ADMIN" &&
          editorState.schoolName.toLowerCase() ===
            SCHOOLS_DIVISION_OFFICE.toLowerCase();
        setUseSchoolsDivisionOffice(isSchoolsDivisionOffice);
        setInitialUseSchoolsDivisionOffice(isSchoolsDivisionOffice);
        setProfileError(null);
      } catch {
        setProfileError("Unable to load profile info.");
      }
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    const loadSchools = async () => {
      if (profileMeta.roleKey !== "SUPER_ADMIN") {
        setSchools([]);
        return;
      }

      try {
        setSchoolsLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/schools/public/list`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load schools");
        }

        const payload = (await response.json().catch(() => ({}))) as {
          data?: Array<{ id?: unknown; school_name?: unknown }>;
        };

        const options = (Array.isArray(payload.data) ? payload.data : [])
          .map((item) => {
            const schoolId = Number(item.id);
            const schoolName = String(item.school_name || "").trim();

            if (!Number.isFinite(schoolId) || schoolId <= 0 || !schoolName) {
              return null;
            }

            return {
              id: schoolId,
              school_name: schoolName,
            } as SchoolOption;
          })
          .filter((item): item is SchoolOption => item !== null)
          .sort((a, b) => a.school_name.localeCompare(b.school_name));

        setSchools(options);
      } catch {
        setSchools([]);
      } finally {
        setSchoolsLoading(false);
      }
    };

    void loadSchools();
  }, [profileMeta.roleKey]);

  useEffect(() => {
    const canEditSchoolInEffect = profileMeta.roleKey === "SUPER_ADMIN";
    if (!canEditSchoolInEffect || !useSchoolsDivisionOffice) {
      return;
    }

    setProfileEditor((prev) => ({
      ...prev,
      schoolName: SCHOOLS_DIVISION_OFFICE,
    }));
  }, [profileMeta.roleKey, useSchoolsDivisionOffice, schools]);

  const canEditSchool = profileMeta.roleKey === "SUPER_ADMIN";
  const hasProfileChanges =
    !!initialProfileEditor &&
    (profileEditor.firstName.trim() !== initialProfileEditor.firstName.trim() ||
      profileEditor.middleName.trim() !==
        initialProfileEditor.middleName.trim() ||
      profileEditor.lastName.trim() !== initialProfileEditor.lastName.trim() ||
      profileEditor.email.trim().toLowerCase() !==
        initialProfileEditor.email.trim().toLowerCase() ||
      profileEditor.birthdate !== initialProfileEditor.birthdate ||
      profileEditor.schoolId !== initialProfileEditor.schoolId ||
      useSchoolsDivisionOffice !== initialUseSchoolsDivisionOffice);

  const resetProfileEditor = () => {
    if (!initialProfileEditor) return;
    setProfileEditor(initialProfileEditor);
    setNoMiddleName(
      !initialProfileEditor.middleName ||
        initialProfileEditor.middleName.trim().toUpperCase() === "N/A",
    );
    setUseSchoolsDivisionOffice(
      canEditSchool &&
        initialProfileEditor.schoolName.toLowerCase() ===
          SCHOOLS_DIVISION_OFFICE.toLowerCase(),
    );
    setInitialUseSchoolsDivisionOffice(
      canEditSchool &&
        initialProfileEditor.schoolName.toLowerCase() ===
          SCHOOLS_DIVISION_OFFICE.toLowerCase(),
    );
    setProfileFieldErrors({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      birthdate: "",
      schoolId: "",
    });
    setProfileSaveError(null);
    setProfileSaveSuccess(null);
  };

  const handleRequestProfileSave = () => {
    setProfileSaveError(null);
    setProfileSaveSuccess(null);
    const nextFieldErrors = {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      birthdate: "",
      schoolId: "",
    };
    let hasValidationError = false;

    if (!profileEditor.firstName.trim()) {
      nextFieldErrors.firstName = "First name is required.";
      hasValidationError = true;
    } else if (!validateName(profileEditor.firstName)) {
      nextFieldErrors.firstName = "First name must be at least 2 letters.";
      hasValidationError = true;
    }

    if (!profileEditor.lastName.trim()) {
      nextFieldErrors.lastName = "Last name is required.";
      hasValidationError = true;
    } else if (!validateName(profileEditor.lastName)) {
      nextFieldErrors.lastName = "Last name must be at least 2 letters.";
      hasValidationError = true;
    }

    if (!noMiddleName) {
      if (!profileEditor.middleName.trim()) {
        nextFieldErrors.middleName =
          "Middle name is required. Check 'I don't have a middle name' if applicable.";
        hasValidationError = true;
      } else if (!validateName(profileEditor.middleName)) {
        nextFieldErrors.middleName = "Middle name must be at least 2 letters.";
        hasValidationError = true;
      }
    }

    if (!profileEditor.email.trim() || !validateEmail(profileEditor.email)) {
      nextFieldErrors.email = "A valid email address is required.";
      hasValidationError = true;
    }

    if (!profileEditor.birthdate) {
      nextFieldErrors.birthdate = "Birthdate is required.";
      hasValidationError = true;
    } else if (isFutureDate(profileEditor.birthdate)) {
      nextFieldErrors.birthdate = "Birthdate cannot be in the future.";
      hasValidationError = true;
    }

    if (canEditSchool && !useSchoolsDivisionOffice && !profileEditor.schoolId) {
      nextFieldErrors.schoolId = "School is required.";
      hasValidationError = true;
    }

    setProfileFieldErrors(nextFieldErrors);

    if (hasValidationError) {
      setProfileSaveError(
        "Please correct the highlighted errors before saving.",
      );
      return;
    }

    setShowConfirmProfileSave(true);
  };

  const handleConfirmProfileSave = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setProfileSaveError("No authentication token found.");
      setShowConfirmProfileSave(false);
      return;
    }

    try {
      setSavingProfile(true);
      setProfileSaveError(null);
      setProfileSaveSuccess(null);

      const payload: {
        first_name: string;
        middle_name: string | null;
        last_name: string;
        email: string;
        birthdate: string;
        school_id?: number | null;
        use_schools_division_office?: boolean;
      } = {
        first_name: profileEditor.firstName.trim(),
        middle_name: noMiddleName ? null : profileEditor.middleName.trim(),
        last_name: profileEditor.lastName.trim(),
        email: profileEditor.email.trim().toLowerCase(),
        birthdate: profileEditor.birthdate,
      };

      if (canEditSchool) {
        payload.use_schools_division_office = useSchoolsDivisionOffice;
        if (useSchoolsDivisionOffice) {
          payload.school_id = null;
        } else {
          const parsedSchoolId = Number(profileEditor.schoolId);
          payload.school_id = parsedSchoolId;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/users/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = (await response
        .json()
        .catch(() => ({}))) as UserProfileResponse & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.message || "Failed to update profile details.");
      }

      const user = body.data;
      if (user) {
        const roleKey = toRoleKey(user.role);
        const nextSchoolId =
          Number.isFinite(Number(user.school_id)) && Number(user.school_id) > 0
            ? Number(user.school_id)
            : null;

        setProfile({
          firstName: user.first_name || "N/A",
          lastName: user.last_name || "N/A",
          middleName: user.middle_name || "N/A",
          email: user.email || "N/A",
          birthdate: toBirthdateLabel(user.birthdate),
          school: user.school_name || "N/A",
          role: toRoleLabel(user.role),
          accountStatus: toAccountStatusLabel(user.is_active),
          memberSince: toMemberSinceLabel(user.created_at),
        });

        setProfileMeta({
          id: Number(user.id) || profileMeta.id,
          roleKey,
          schoolId: nextSchoolId,
        });

        const nextEditorState: ProfileEditor = {
          firstName: String(user.first_name || "").trim(),
          middleName: String(user.middle_name || "").trim(),
          lastName: String(user.last_name || "").trim(),
          email: String(user.email || "").trim(),
          birthdate: toBirthdateInputValue(user.birthdate),
          schoolId: nextSchoolId ? String(nextSchoolId) : "",
          schoolName: String(user.school_name || "").trim(),
        };

        setProfileEditor(nextEditorState);
        setInitialProfileEditor(nextEditorState);
        setNoMiddleName(
          !nextEditorState.middleName ||
            nextEditorState.middleName.trim().toUpperCase() === "N/A",
        );
        const isSchoolsDivisionOffice =
          roleKey === "SUPER_ADMIN" &&
          String(user.school_name || "")
            .trim()
            .toLowerCase() === SCHOOLS_DIVISION_OFFICE.toLowerCase();
        setUseSchoolsDivisionOffice(isSchoolsDivisionOffice);
        setInitialUseSchoolsDivisionOffice(isSchoolsDivisionOffice);
        setProfileFieldErrors({
          firstName: "",
          middleName: "",
          lastName: "",
          email: "",
          birthdate: "",
          schoolId: "",
        });

        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          try {
            const parsedUser = JSON.parse(rawUser) as Record<string, unknown>;
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...parsedUser,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                email: user.email,
                birthdate: user.birthdate,
                school_id: user.school_id,
                school_name: user.school_name,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
              }),
            );
          } catch {
            localStorage.setItem(
              "user",
              JSON.stringify({
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                email: user.email,
                birthdate: user.birthdate,
                school_id: user.school_id,
                school_name: user.school_name,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
              }),
            );
          }
        }
      }

      setIsEditingProfile(false);
      setProfileSaveSuccess("Profile details updated successfully.");
      showToast(
        "success",
        "Profile Updated",
        "Your profile changes have been saved successfully.",
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update profile details.";
      setProfileSaveError(errorMessage);
      showToast("error", "Update Failed", errorMessage);
    } finally {
      setSavingProfile(false);
      setShowConfirmProfileSave(false);
    }
  };

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
        const errorMessage = data.message || "Failed to change password.";
        setPasswordError(errorMessage);
        showToast("error", "Password Update Failed", errorMessage);
        return;
      }

      setPasswordSuccess("Password updated. Please log in again.");
      showToast(
        "success",
        "Password Updated",
        "Password changed successfully. Redirecting to login.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setRetypePassword("");
      await logoutNow();
      window.setTimeout(() => {
        window.location.replace("/login");
      }, 900);
    } catch {
      setPasswordError("Failed to change password.");
      showToast(
        "error",
        "Password Update Failed",
        "Failed to change password.",
      );
    } finally {
      setSavingPassword(false);
      setShowConfirmPasswordModal(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <ToastMessage
        isVisible={toastState.isVisible}
        variant={toastState.variant}
        title={toastState.title}
        message={toastState.message}
        position="top-right"
        autoCloseDuration={2600}
        onClose={() =>
          setToastState((prev) => ({
            ...prev,
            isVisible: false,
          }))
        }
      />

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
          Profile Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              value={profileEditor.firstName}
              onChange={(e) => {
                setProfileEditor((prev) => ({
                  ...prev,
                  firstName: e.target.value,
                }));
                if (profileFieldErrors.firstName) {
                  setProfileFieldErrors((prev) => ({
                    ...prev,
                    firstName: "",
                  }));
                }
              }}
              readOnly={!isEditingProfile}
              className={`mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditingProfile
                  ? "border-gray-300 text-gray-700 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
            />
            {profileFieldErrors.firstName && (
              <p className="mt-1 text-xs text-red-600">
                {profileFieldErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Middle Name
            </label>
            <input
              value={profileEditor.middleName}
              onChange={(e) => {
                setProfileEditor((prev) => ({
                  ...prev,
                  middleName: e.target.value,
                }));
                if (profileFieldErrors.middleName) {
                  setProfileFieldErrors((prev) => ({
                    ...prev,
                    middleName: "",
                  }));
                }
              }}
              readOnly={!isEditingProfile || noMiddleName}
              placeholder={
                noMiddleName ? "No middle name provided" : "Middle name"
              }
              className={`mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditingProfile && !noMiddleName
                  ? "border-gray-300 text-gray-700 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={noMiddleName}
                disabled={!isEditingProfile}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setNoMiddleName(checked);
                  if (checked) {
                    setProfileEditor((prev) => ({ ...prev, middleName: "" }));
                    setProfileFieldErrors((prev) => ({
                      ...prev,
                      middleName: "",
                    }));
                  }
                }}
                className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
              />
              I don't have a middle name
            </label>
            {profileFieldErrors.middleName && (
              <p className="mt-1 text-xs text-red-600">
                {profileFieldErrors.middleName}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              value={profileEditor.lastName}
              onChange={(e) => {
                setProfileEditor((prev) => ({
                  ...prev,
                  lastName: e.target.value,
                }));
                if (profileFieldErrors.lastName) {
                  setProfileFieldErrors((prev) => ({
                    ...prev,
                    lastName: "",
                  }));
                }
              }}
              readOnly={!isEditingProfile}
              className={`mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditingProfile
                  ? "border-gray-300 text-gray-700 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
            />
            {profileFieldErrors.lastName && (
              <p className="mt-1 text-xs text-red-600">
                {profileFieldErrors.lastName}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Birthdate
            </label>
            <input
              type="date"
              value={profileEditor.birthdate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setProfileEditor((prev) => ({
                  ...prev,
                  birthdate: e.target.value,
                }));
                if (profileFieldErrors.birthdate) {
                  setProfileFieldErrors((prev) => ({
                    ...prev,
                    birthdate: "",
                  }));
                }
              }}
              readOnly={!isEditingProfile}
              className={`mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditingProfile
                  ? "border-gray-300 text-gray-700 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
            />
            {profileFieldErrors.birthdate && (
              <p className="mt-1 text-xs text-red-600">
                {profileFieldErrors.birthdate}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              value={profileEditor.email}
              onChange={(e) => {
                setProfileEditor((prev) => ({
                  ...prev,
                  email: e.target.value,
                }));
                if (profileFieldErrors.email) {
                  setProfileFieldErrors((prev) => ({
                    ...prev,
                    email: "",
                  }));
                }
              }}
              readOnly={!isEditingProfile}
              className={`mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditingProfile
                  ? "border-gray-300 text-gray-700 bg-white"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
            />
            {profileFieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">
                {profileFieldErrors.email}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">School</label>
            {canEditSchool ? (
              <>
                {useSchoolsDivisionOffice ? (
                  <input
                    readOnly
                    value={SCHOOLS_DIVISION_OFFICE}
                    className="mt-1 w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500"
                  />
                ) : (
                  <select
                    value={profileEditor.schoolId}
                    onChange={(e) => {
                      setProfileEditor((prev) => ({
                        ...prev,
                        schoolId: e.target.value,
                        schoolName:
                          schools.find(
                            (school) => String(school.id) === e.target.value,
                          )?.school_name || prev.schoolName,
                      }));
                      if (profileFieldErrors.schoolId) {
                        setProfileFieldErrors((prev) => ({
                          ...prev,
                          schoolId: "",
                        }));
                      }
                    }}
                    disabled={!isEditingProfile || schoolsLoading}
                    className={`mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditingProfile
                        ? "border-gray-300 text-gray-700 bg-white"
                        : "border-gray-200 bg-gray-100 text-gray-500"
                    }`}
                  >
                    <option value="">
                      {schoolsLoading ? "Loading schools..." : "Select school"}
                    </option>
                    {schools.map((school) => (
                      <option key={school.id} value={String(school.id)}>
                        {school.school_name}
                      </option>
                    ))}
                  </select>
                )}

                <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={useSchoolsDivisionOffice}
                    disabled={!isEditingProfile}
                    onChange={(e) => {
                      const checked = e.target.checked;

                      setUseSchoolsDivisionOffice(checked);
                      setProfileEditor((prev) => ({
                        ...prev,
                        schoolId: checked ? prev.schoolId : "",
                        schoolName: checked ? SCHOOLS_DIVISION_OFFICE : "",
                      }));
                      setProfileFieldErrors((prev) => ({
                        ...prev,
                        schoolId: "",
                      }));
                    }}
                    className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                  />
                  Schools Division Office
                </label>
              </>
            ) : (
              <input
                readOnly
                value={profile.school}
                className="mt-1 w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-sm text-gray-500"
              />
            )}
            {profileFieldErrors.schoolId && (
              <p className="mt-1 text-xs text-red-600">
                {profileFieldErrors.schoolId}
              </p>
            )}
          </div>
        </div>

        {profileSaveError && (
          <p className="text-sm text-red-600 mt-3">{profileSaveError}</p>
        )}
        {profileSaveSuccess && (
          <p className="text-sm text-green-600 mt-3">{profileSaveSuccess}</p>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          {isEditingProfile && hasProfileChanges && (
            <button
              type="button"
              onClick={createClearHandler(
                resetProfileEditor,
                hasProfileChanges,
              )}
              className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Clear All
            </button>
          )}

          {!isEditingProfile ? (
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(true);
                setProfileSaveError(null);
                setProfileSaveSuccess(null);
                setProfileFieldErrors({
                  firstName: "",
                  middleName: "",
                  lastName: "",
                  email: "",
                  birthdate: "",
                  schoolId: "",
                });
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
            >
              <span className="inline-flex items-center gap-1">
                <Pencil size={14} />
                Edit Profile
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  resetProfileEditor();
                }}
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1">
                  <XCircle size={14} />
                  Cancel
                </span>
              </button>
              <button
                type="button"
                onClick={handleRequestProfileSave}
                disabled={savingProfile || !hasProfileChanges}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  savingProfile || !hasProfileChanges
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <Save size={14} />
                  {savingProfile ? "Saving..." : "Save Profile"}
                </span>
              </button>
            </>
          )}
        </div>

        <ConfirmationModal
          visible={showConfirmProfileSave}
          title="Confirm Profile Update"
          message="Are you sure you want to save your updated profile details?"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          loading={savingProfile}
          onConfirm={handleConfirmProfileSave}
          onCancel={() => {
            if (savingProfile) return;
            setShowConfirmProfileSave(false);
          }}
        />
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

        <div className="mt-5 flex items-center justify-end gap-3">
          {!!(currentPassword || newPassword || retypePassword) && (
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
              className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Clear All
            </button>
          )}

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
