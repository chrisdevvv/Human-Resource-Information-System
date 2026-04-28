"use client";

import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  Save,
  XCircle,
  ShieldCheck,
  Mail,
  CalendarDays,
  School,
  UserRound,
  KeyRound,
} from "lucide-react";
import ConfirmationModal from "../../super-admin/components/ConfirmationModal";
import { logoutNow } from "@/frontend/auth/session";
import { APP_ROUTES } from "@/frontend/route";
import { createClearHandler } from "../../utils/clearFormUtils";
import ToastMessage from "../../components/ToastMessage";
import { SkeletonBlock } from "../../components/Skeleton/SkeletonUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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
  const [profileLoading, setProfileLoading] = useState(true);
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
        setProfileLoading(true);

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
      } finally {
        setProfileLoading(false);
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
        window.location.replace(APP_ROUTES.LOGIN);
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

  const shellClass =
    "relative overflow-hidden rounded-[28px] border border-[#d7e5ff] bg-white shadow-[0_18px_50px_rgba(37,78,229,0.10)]";
  const cardClass =
    "overflow-hidden rounded-[24px] border border-[#dbe7ff] bg-white shadow-[0_10px_35px_rgba(37,78,229,0.08)]";
  const cardHeaderClass =
    "flex flex-col gap-3 border-b border-[#dbe7ff] bg-gradient-to-r from-[#eef4ff] via-[#f4f8ff] to-[#eef4ff] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5";
  const statCardClass =
    "rounded-2xl border border-[#dbe7ff] bg-white/90 p-3 shadow-[0_6px_18px_rgba(37,78,229,0.06)]";
  const fieldCardClass =
    "rounded-2xl border border-[#e4edff] bg-white p-3 sm:p-4 shadow-[0_4px_14px_rgba(37,79,229,0.05)]";
  const fieldLabelClass =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7389b4]";
  const helperLabelClass = "text-sm font-semibold text-[#47608f]";
  const editableInputClass =
    "mt-2 w-full rounded-2xl border border-[#c7dafd] bg-white px-3 py-2.5 text-sm text-[#31507c] shadow-sm transition focus:border-[#254ee5] focus:outline-none focus:ring-2 focus:ring-[#254ee5]/20";
  const disabledInputClass =
    "mt-2 w-full rounded-2xl border border-[#d7e4ff] bg-[#f6f9ff] px-3 py-2.5 text-sm text-[#7b92bd] shadow-sm";
  const subtlePanelClass =
    "rounded-[24px] border border-[#dbe7ff] bg-gradient-to-br from-[#f8fbff] to-[#f3f7ff] p-4 sm:p-5";
  const iconWrapClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d6e4ff] bg-white text-[#254ee5] shadow-sm";
  const sectionTitleClass = "text-lg font-bold text-[#254ee5]";
  const sectionDescClass = "text-sm text-[#6f86b6]";
  const actionPrimaryClass =
    "rounded-2xl bg-[#254ee5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d3fc1] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500";
  const actionSecondaryClass =
    "rounded-2xl border border-[#cfe0ff] bg-white px-4 py-2.5 text-sm font-semibold text-[#47608f] shadow-sm transition hover:bg-[#f5f9ff] disabled:cursor-not-allowed disabled:opacity-50";
  const inlineCheckboxClass =
    "mt-3 inline-flex items-start gap-2 rounded-xl border border-[#dbe7ff] bg-white px-3 py-2 text-xs text-[#6f86b6] shadow-sm";

  const renderProfileSkeleton = () => (
    <>
      <div className={shellClass}>
        <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-[#254ee5]/10 via-[#7aa5ff]/10 to-[#254ee5]/5" />
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="flex-1 rounded-3xl border border-[#dbe7ff] bg-white/95 p-4 shadow-[0_10px_25px_rgba(37,78,229,0.08)] backdrop-blur sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <SkeletonBlock
                  width="w-16 sm:w-20"
                  height="h-16 sm:h-20"
                  rounded="rounded-[22px]"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <SkeletonBlock
                        width="w-32"
                        height="h-3"
                        rounded="rounded-md"
                      />
                      <SkeletonBlock
                        width="w-56 sm:w-72"
                        height="h-8"
                        rounded="rounded-md"
                        className="mt-2"
                      />
                      <SkeletonBlock
                        width="w-full sm:w-80"
                        height="h-5"
                        rounded="rounded-md"
                        className="mt-3"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <SkeletonBlock
                        width="w-24"
                        height="h-7"
                        rounded="rounded-full"
                      />
                      <SkeletonBlock
                        width="w-20"
                        height="h-7"
                        rounded="rounded-full"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className={statCardClass}>
                        <SkeletonBlock
                          width="w-20"
                          height="h-3"
                          rounded="rounded-md"
                        />
                        <SkeletonBlock
                          width="w-full"
                          height="h-5"
                          rounded="rounded-md"
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={fieldCardClass}>
                <div className="flex items-center gap-2">
                  <SkeletonBlock
                    width="w-10"
                    height="h-10"
                    rounded="rounded-2xl"
                  />
                  <div className="min-w-0 flex-1">
                    <SkeletonBlock
                      width="w-20"
                      height="h-3"
                      rounded="rounded-md"
                    />
                    <SkeletonBlock
                      width="w-full"
                      height="h-5"
                      rounded="rounded-md"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className={cardHeaderClass}>
          <div className="flex items-start gap-3">
            <SkeletonBlock width="w-10" height="h-10" rounded="rounded-2xl" />
            <div>
              <SkeletonBlock width="w-36" height="h-6" rounded="rounded-md" />
              <SkeletonBlock
                width="w-48"
                height="h-4"
                rounded="rounded-md"
                className="mt-2"
              />
            </div>
          </div>

          <SkeletonBlock width="w-24" height="h-7" rounded="rounded-full" />
        </div>

        <div className="p-4 sm:p-6">
          <div className={subtlePanelClass}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className={fieldCardClass}>
                  <SkeletonBlock
                    width="w-24"
                    height="h-4"
                    rounded="rounded-md"
                  />
                  <SkeletonBlock
                    width="w-full"
                    height="h-11"
                    rounded="rounded-2xl"
                    className="mt-2"
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <div className={fieldCardClass}>
                  <SkeletonBlock
                    width="w-28"
                    height="h-4"
                    rounded="rounded-md"
                  />
                  <SkeletonBlock
                    width="w-full"
                    height="h-11"
                    rounded="rounded-2xl"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className={fieldCardClass}>
                  <div className="mb-1 flex items-center gap-2">
                    <SkeletonBlock
                      width="w-10"
                      height="h-10"
                      rounded="rounded-2xl"
                    />
                    <SkeletonBlock
                      width="w-20"
                      height="h-4"
                      rounded="rounded-md"
                    />
                  </div>
                  <SkeletonBlock
                    width="w-full"
                    height="h-11"
                    rounded="rounded-2xl"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <SkeletonBlock width="w-full sm:w-32" height="h-11" rounded="rounded-2xl" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className={cardHeaderClass}>
          <div className="flex items-start gap-3">
            <SkeletonBlock width="w-10" height="h-10" rounded="rounded-2xl" />
            <div>
              <SkeletonBlock width="w-40" height="h-6" rounded="rounded-md" />
              <SkeletonBlock
                width="w-56"
                height="h-4"
                rounded="rounded-md"
                className="mt-2"
              />
            </div>
          </div>

          <SkeletonBlock width="w-20" height="h-7" rounded="rounded-full" />
        </div>

        <div className="p-4 sm:p-6">
          <div className={subtlePanelClass}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className={fieldCardClass}>
                  <SkeletonBlock
                    width="w-32"
                    height="h-4"
                    rounded="rounded-md"
                  />
                  <SkeletonBlock
                    width="w-full"
                    height="h-11"
                    rounded="rounded-2xl"
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <SkeletonBlock width="w-full sm:w-36" height="h-11" rounded="rounded-2xl" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
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

      <div className="space-y-4 sm:space-y-5">
        {profileLoading ? (
          renderProfileSkeleton()
        ) : (
          <>
            <div className={shellClass}>
              <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-[#254ee5]/10 via-[#7aa5ff]/10 to-[#254ee5]/5" />
              <div className="relative p-4 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
                  <div className="flex-1 rounded-3xl border border-[#dbe7ff] bg-white/95 p-4 shadow-[0_10px_25px_rgba(37,78,229,0.08)] backdrop-blur sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-[#cfe0ff] bg-[#254ee5] text-xl font-bold text-white shadow-[0_8px_20px_rgba(37,78,229,0.28)] sm:h-20 sm:w-20 sm:text-2xl">
                        {`${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`
                          .toUpperCase()
                          .trim() || "U"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a91bd]">
                              Profile Overview
                            </p>
                            <h2 className="mt-1 wrap-break-word text-xl font-bold text-[#254ee5] sm:text-2xl">
                              {`${profile.firstName} ${profile.lastName}`.trim()}
                            </h2>
                            <p className="mt-2 flex items-start gap-2 break-all text-sm text-[#5f76a3]">
                              <Mail size={16} className="mt-0.5 shrink-0" />
                              <span>{profile.email}</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full border border-[#bcd1ff] bg-[#f7faff] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#254ee5]">
                              {profile.role}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                                profile.accountStatus === "Active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {profile.accountStatus}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className={statCardClass}>
                            <p className={fieldLabelClass}>Birthday</p>
                            <p className="mt-1 text-sm font-semibold text-[#35507d]">
                              {profile.birthdate}
                            </p>
                          </div>
                          <div className={statCardClass}>
                            <p className={fieldLabelClass}>School</p>
                            <p className="mt-1 text-sm font-semibold text-[#35507d]">
                              {profile.school}
                            </p>
                          </div>
                          <div className={statCardClass}>
                            <p className={fieldLabelClass}>Member Since</p>
                            <p className="mt-1 text-sm font-semibold text-[#35507d]">
                              {profile.memberSince}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {profileError && (
                  <div className="mt-4">
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                      {profileError}
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className={fieldCardClass}>
                    <div className="flex items-center gap-2">
                      <div className={iconWrapClass}>
                        <UserRound size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className={fieldLabelClass}>Full Name</p>
                        <p className="truncate text-sm font-semibold text-[#35507d]">
                          {`${profile.firstName} ${toMiddleNamePart(profile.middleName)} ${profile.lastName}`
                            .replace(/\s+/g, " ")
                            .trim()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={fieldCardClass}>
                    <div className="flex items-center gap-2">
                      <div className={iconWrapClass}>
                        <Mail size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className={fieldLabelClass}>Email Address</p>
                        <p className="truncate text-sm font-semibold text-[#35507d]">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={fieldCardClass}>
                    <div className="flex items-center gap-2">
                      <div className={iconWrapClass}>
                        <ShieldCheck size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className={fieldLabelClass}>Account Status</p>
                        <p className="truncate text-sm font-semibold text-[#35507d]">
                          {profile.accountStatus}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={fieldCardClass}>
                    <div className="flex items-center gap-2">
                      <div className={iconWrapClass}>
                        <CalendarDays size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className={fieldLabelClass}>Member Since</p>
                        <p className="truncate text-sm font-semibold text-[#35507d]">
                          {profile.memberSince}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <div className={cardHeaderClass}>
                <div className="flex items-start gap-3">
                  <div className={iconWrapClass}>
                    <UserRound size={18} />
                  </div>
                  <div>
                    <h3 className={sectionTitleClass}>Profile Details</h3>
                    <p className={sectionDescClass}>
                      Review and update your account information
                    </p>
                  </div>
                </div>

                <div className="rounded-full border border-[#d7e5ff] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6d86b3]">
                  {isEditingProfile ? "Editing Mode" : "View Mode"}
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className={subtlePanelClass}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={fieldCardClass}>
                      <label className={helperLabelClass}>First Name</label>
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
                        className={
                          isEditingProfile
                            ? editableInputClass
                            : disabledInputClass
                        }
                      />
                      {profileFieldErrors.firstName && (
                        <p className="mt-2 text-xs text-red-600">
                          {profileFieldErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div className={fieldCardClass}>
                      <label className={helperLabelClass}>Middle Name</label>
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
                        className={
                          isEditingProfile && !noMiddleName
                            ? editableInputClass
                            : disabledInputClass
                        }
                      />
                      <label className={inlineCheckboxClass}>
                        <input
                          type="checkbox"
                          checked={noMiddleName}
                          disabled={!isEditingProfile}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setNoMiddleName(checked);
                            if (checked) {
                              setProfileEditor((prev) => ({
                                ...prev,
                                middleName: "",
                              }));
                              setProfileFieldErrors((prev) => ({
                                ...prev,
                                middleName: "",
                              }));
                            }
                          }}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#254ee5] disabled:cursor-not-allowed"
                        />
                        <span>I don&apos;t have a middle name</span>
                      </label>
                      {profileFieldErrors.middleName && (
                        <p className="mt-2 text-xs text-red-600">
                          {profileFieldErrors.middleName}
                        </p>
                      )}
                    </div>

                    <div className={fieldCardClass}>
                      <label className={helperLabelClass}>Last Name</label>
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
                        className={
                          isEditingProfile
                            ? editableInputClass
                            : disabledInputClass
                        }
                      />
                      {profileFieldErrors.lastName && (
                        <p className="mt-2 text-xs text-red-600">
                          {profileFieldErrors.lastName}
                        </p>
                      )}
                    </div>

                    <div className={fieldCardClass}>
                      <label className={helperLabelClass}>Birthdate</label>
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
                        className={
                          isEditingProfile
                            ? editableInputClass
                            : disabledInputClass
                        }
                      />
                      {profileFieldErrors.birthdate && (
                        <p className="mt-2 text-xs text-red-600">
                          {profileFieldErrors.birthdate}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <div className={fieldCardClass}>
                        <label className={helperLabelClass}>Email Address</label>
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
                          className={
                            isEditingProfile
                              ? editableInputClass
                              : disabledInputClass
                          }
                        />
                        {profileFieldErrors.email && (
                          <p className="mt-2 text-xs text-red-600">
                            {profileFieldErrors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className={fieldCardClass}>
                        <div className="mb-1 flex items-center gap-2">
                          <div className={iconWrapClass}>
                            <School size={18} />
                          </div>
                          <label className={helperLabelClass}>School</label>
                        </div>

                        {canEditSchool ? (
                          <>
                            {useSchoolsDivisionOffice ? (
                              <input
                                readOnly
                                value={SCHOOLS_DIVISION_OFFICE}
                                className={disabledInputClass}
                              />
                            ) : (
                              <>
                                {schoolsLoading ? (
                                  <SkeletonBlock
                                    width="w-full"
                                    height="h-11"
                                    rounded="rounded-2xl"
                                    className="mt-2"
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
                                            (school) =>
                                              String(school.id) === e.target.value,
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
                                    className={
                                      isEditingProfile
                                        ? editableInputClass
                                        : disabledInputClass
                                    }
                                  >
                                    <option value="">
                                      {schoolsLoading
                                        ? "Loading schools..."
                                        : "Select school"}
                                    </option>
                                    {schools.map((school) => (
                                      <option
                                        key={school.id}
                                        value={String(school.id)}
                                      >
                                        {school.school_name}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </>
                            )}

                            <label className={inlineCheckboxClass}>
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
                                    schoolName: checked
                                      ? SCHOOLS_DIVISION_OFFICE
                                      : "",
                                  }));
                                  setProfileFieldErrors((prev) => ({
                                    ...prev,
                                    schoolId: "",
                                  }));
                                }}
                                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#254ee5] disabled:cursor-not-allowed"
                              />
                              <span>Schools Division Office</span>
                            </label>
                          </>
                        ) : (
                          <input
                            readOnly
                            value={profile.school}
                            className={disabledInputClass}
                          />
                        )}

                        {profileFieldErrors.schoolId && (
                          <p className="mt-2 text-xs text-red-600">
                            {profileFieldErrors.schoolId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {profileSaveError && (
                  <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {profileSaveError}
                  </p>
                )}
                {profileSaveSuccess && (
                  <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
                    {profileSaveSuccess}
                  </p>
                )}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {isEditingProfile && hasProfileChanges && (
                    <button
                      type="button"
                      onClick={createClearHandler(
                        resetProfileEditor,
                        hasProfileChanges,
                      )}
                      className="cursor-pointer sm:mr-auto text-left text-sm font-medium text-[#254ee5] transition hover:text-[#1d3fc1] hover:underline"
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
                      className={`${actionPrimaryClass} cursor-pointer w-full sm:w-auto`}
                    >
                      <span className="cursor-pointer inline-flex items-center gap-1.5">
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
                        className={`${actionSecondaryClass} cursor-pointer w-full sm:w-auto`}
                      >
                        <span className="cursor-pointer inline-flex items-center gap-1.5">
                          <XCircle size={14} />
                          Cancel
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestProfileSave}
                        disabled={savingProfile || !hasProfileChanges}
                        className={`${actionPrimaryClass} cursor-pointer w-full sm:w-auto`}
                      >
                        <span className="cursor-pointer inline-flex items-center gap-1.5">
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
            </div>

            <div className={cardClass}>
              <div className={cardHeaderClass}>
                <div className="flex items-start gap-3">
                  <div className={iconWrapClass}>
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h3 className={sectionTitleClass}>Change Password</h3>
                    <p className={sectionDescClass}>
                      Update your password to keep your account secure
                    </p>
                  </div>
                </div>

                <div className="rounded-full border border-[#d7e5ff] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6d86b3]">
                  Security
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className={subtlePanelClass}>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className={fieldCardClass}>
                      <label className={helperLabelClass}>Current Password</label>
                      <div className="relative mt-2">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={`${editableInputClass} mt-0 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 px-3 text-[#6f86b6] transition hover:text-[#254ee5]"
                          aria-label={
                            showCurrentPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={fieldCardClass}>
                      <label className={helperLabelClass}>New Password</label>
                      <div className="relative mt-2">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`${editableInputClass} mt-0 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 px-3 text-[#6f86b6] transition hover:text-[#254ee5]"
                          aria-label={
                            showNewPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={fieldCardClass}>
                      <label className={helperLabelClass}>
                        Retype New Password
                      </label>
                      <div className="relative mt-2">
                        <input
                          type={showRetypePassword ? "text" : "password"}
                          value={retypePassword}
                          onChange={(e) => setRetypePassword(e.target.value)}
                          className={`${editableInputClass} mt-0 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRetypePassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 px-3 text-[#6f86b6] transition hover:text-[#254ee5]"
                          aria-label={
                            showRetypePassword ? "Hide password" : "Show password"
                          }
                        >
                          {showRetypePassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {passwordError && (
                  <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {passwordError}
                  </p>
                )}
                {passwordSuccess && (
                  <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
                    {passwordSuccess}
                  </p>
                )}

                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
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
                      className="cursor-pointer sm:mr-auto text-left text-sm font-medium text-[#254ee5] transition hover:text-[#1d3fc1] hover:underline"
                    >
                      Clear All
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSavePassword}
                    disabled={!canSavePassword}
                    className={`${actionPrimaryClass} w-full sm:w-auto`}
                  >
                    <span className="cursor-pointer inline-flex items-center gap-1.5">
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
          </>
        )}
      </div>
    </div>
  );
}