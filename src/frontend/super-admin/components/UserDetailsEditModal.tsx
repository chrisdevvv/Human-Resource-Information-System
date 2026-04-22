"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Settings, Shield, XCircle } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import { createClearHandler } from "../../utils/clearFormUtils";
import { InlineModalSkeleton } from "../../components/Skeleton/SkeletonLoaders";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const SCHOOLS_DIVISION_OFFICE = "Schools Division Office";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "DATA_ENCODER";

type UserDetails = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  birthdate?: string | null;
  role: UserRole;
  school_id?: number | null;
  school_name?: string | null;
  is_active: boolean | number | string;
  created_at?: string | null;
};

type UserDetailsResponse = {
  data?: UserDetails;
  message?: string;
};

type SchoolOption = {
  id: number;
  school_name: string;
};

type SchoolListResponse = {
  data?: Array<{ id?: unknown; school_id?: unknown; school_name?: unknown }>;
};

type FormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  birthdate: string;
  schoolId: string;
};

type Props = {
  userId: number;
  onClose: () => void;
  onSuccess: (message?: string) => void;
  onError?: (message: string) => void;
  onOpenAccountSettings?: () => void;
};

const normalizeIsActive = (value: unknown): boolean => {
  return value === true || value === 1 || value === "1" || value === "true";
};

const toRoleLabel = (role: string) => role.replace(/_/g, " ");

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const toDateLabel = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

const normalizeSchoolOptions = (
  payload: SchoolListResponse,
): SchoolOption[] => {
  const rows = Array.isArray(payload.data) ? payload.data : [];
  return rows
    .map((row) => {
      const id = Number(row.id ?? row.school_id);
      const schoolName = String(row.school_name || "").trim();
      if (!Number.isFinite(id) || id <= 0 || !schoolName) return null;
      return { id, school_name: schoolName };
    })
    .filter((item): item is SchoolOption => item !== null)
    .sort((a, b) => a.school_name.localeCompare(b.school_name));
};

export default function UserDetailsEditModal({
  userId,
  onClose,
  onSuccess,
  onError,
  onOpenAccountSettings,
}: Props) {
  const [activeSection, setActiveSection] = useState<"personal" | "account">(
    "account",
  );
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    birthdate: "",
    schoolId: "",
  });
  const [initialForm, setInitialForm] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [useSchoolsDivisionOffice, setUseSchoolsDivisionOffice] =
    useState(false);
  const [initialUseSchoolsDivisionOffice, setInitialUseSchoolsDivisionOffice] =
    useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
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

  useEffect(() => {
    let disposed = false;

    const loadModalData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No authentication token found.");
        }

        const [detailsResponse, schoolsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/users/${userId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/api/schools/public/list`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!detailsResponse.ok) {
          const body = await detailsResponse.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load user details.");
        }

        const detailsBody =
          (await detailsResponse.json()) as UserDetailsResponse;
        const userDetails = detailsBody.data;
        if (!userDetails) {
          throw new Error("User details not found.");
        }

        const schoolBody = (await schoolsResponse
          .json()
          .catch(() => ({}))) as SchoolListResponse;
        const schoolOptions = schoolsResponse.ok
          ? normalizeSchoolOptions(schoolBody)
          : [];
        const nextSchoolsError = schoolsResponse.ok
          ? null
          : "Unable to load school options right now.";

        const mappedForm: FormValues = {
          firstName: String(userDetails.first_name || "").trim(),
          middleName: String(userDetails.middle_name || "").trim(),
          lastName: String(userDetails.last_name || "").trim(),
          email: String(userDetails.email || "").trim(),
          birthdate: toDateInputValue(userDetails.birthdate),
          schoolId:
            userDetails.school_id && Number(userDetails.school_id) > 0
              ? String(userDetails.school_id)
              : "",
        };

        if (!disposed) {
          const isSchoolsDivisionOffice =
            String(userDetails.school_name || "")
              .trim()
              .toLowerCase() === SCHOOLS_DIVISION_OFFICE.toLowerCase();

          setDetails(userDetails);
          setSchools(schoolOptions);
          setSchoolsError(nextSchoolsError);
          setForm(mappedForm);
          setInitialForm(mappedForm);
          setUseSchoolsDivisionOffice(isSchoolsDivisionOffice);
          setInitialUseSchoolsDivisionOffice(isSchoolsDivisionOffice);
          setNoMiddleName(
            !mappedForm.middleName ||
              mappedForm.middleName.trim().toUpperCase() === "N/A",
          );
        }
      } catch (err) {
        if (!disposed) {
          setError(
            err instanceof Error ? err.message : "Failed to load user details.",
          );
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    void loadModalData();

    return () => {
      disposed = true;
    };
  }, [userId]);

  useEffect(() => {
    if (useSchoolsDivisionOffice) {
      return;
    }

    if (schools.length === 0) {
      return;
    }

    const hasCurrentSchool = schools.some(
      (school) => String(school.id) === String(form.schoolId),
    );

    if (hasCurrentSchool) {
      return;
    }

    const initialSchoolId = initialForm?.schoolId || "";
    const hasInitialSchool = initialSchoolId
      ? schools.some((school) => String(school.id) === String(initialSchoolId))
      : false;
    const fallbackSchoolId = hasInitialSchool
      ? String(initialSchoolId)
      : String(schools[0].id);

    setForm((prev) => ({
      ...prev,
      schoolId: fallbackSchoolId,
    }));
  }, [useSchoolsDivisionOffice, schools, form.schoolId, initialForm]);

  const hasChanges = useMemo(() => {
    if (!initialForm) return false;
    return (
      form.firstName.trim() !== initialForm.firstName.trim() ||
      form.middleName.trim() !== initialForm.middleName.trim() ||
      form.lastName.trim() !== initialForm.lastName.trim() ||
      form.email.trim().toLowerCase() !==
        initialForm.email.trim().toLowerCase() ||
      form.birthdate !== initialForm.birthdate ||
      form.schoolId !== initialForm.schoolId ||
      useSchoolsDivisionOffice !== initialUseSchoolsDivisionOffice
    );
  }, [
    form,
    initialForm,
    useSchoolsDivisionOffice,
    initialUseSchoolsDivisionOffice,
  ]);

  const handleOpenSaveConfirm = () => {
    setError(null);
    const nextFieldErrors = {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      birthdate: "",
      schoolId: "",
    };
    let hasValidationError = false;

    if (!form.firstName.trim()) {
      nextFieldErrors.firstName = "First name is required.";
      hasValidationError = true;
    } else if (!validateName(form.firstName)) {
      nextFieldErrors.firstName = "First name must be at least 2 letters.";
      hasValidationError = true;
    }

    if (!form.lastName.trim()) {
      nextFieldErrors.lastName = "Last name is required.";
      hasValidationError = true;
    } else if (!validateName(form.lastName)) {
      nextFieldErrors.lastName = "Last name must be at least 2 letters.";
      hasValidationError = true;
    }

    if (!noMiddleName) {
      if (!form.middleName.trim()) {
        nextFieldErrors.middleName =
          "Middle name is required. Check 'I don't have a middle name' if applicable.";
        hasValidationError = true;
      } else if (!validateName(form.middleName)) {
        nextFieldErrors.middleName = "Middle name must be at least 2 letters.";
        hasValidationError = true;
      }
    }

    if (!form.email.trim() || !validateEmail(form.email)) {
      nextFieldErrors.email = "A valid email address is required.";
      hasValidationError = true;
    }

    if (!form.birthdate) {
      nextFieldErrors.birthdate = "Birthdate is required.";
      hasValidationError = true;
    } else if (isFutureDate(form.birthdate)) {
      nextFieldErrors.birthdate = "Birthdate cannot be in the future.";
      hasValidationError = true;
    }

    if (!useSchoolsDivisionOffice && !form.schoolId) {
      nextFieldErrors.schoolId = "School is required.";
      hasValidationError = true;
    }

    setFieldErrors(nextFieldErrors);

    if (hasValidationError) {
      setError("Please correct the highlighted errors before saving.");
      return;
    }

    setShowConfirmSave(true);
  };

  const handleConfirmSave = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("No authentication token found.");
      setShowConfirmSave(false);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/users/${userId}/details`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          middle_name: noMiddleName ? null : form.middleName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          birthdate: form.birthdate,
          school_id: useSchoolsDivisionOffice ? null : Number(form.schoolId),
          use_schools_division_office: useSchoolsDivisionOffice,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || "Failed to update user details.");
      }

      setShowConfirmSave(false);
      onSuccess(body.message || "User details updated successfully.");
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update user details.";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setSaving(false);
      setShowConfirmSave(false);
    }
  };

  const tabClass = (tab: "personal" | "account") =>
    `w-full rounded-xl border px-3 py-2 text-sm font-semibold transition ${
      activeSection === tab
        ? "border-blue-400 bg-blue-50 text-blue-700"
        : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-blue-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-3 sm:mb-4">
          <div className="flex items-start gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                Edit User Details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Update personal details and account information for this user.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-2 sm:mb-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveSection("personal")}
            className={`${tabClass("personal")} cursor-pointer`}
          >
            Personal Information
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("account")}
            className={`${tabClass("account")} cursor-pointer`}
          >
            Account Information
          </button>
        </div>

        {loading ? (
          <div className="mb-3">
            <InlineModalSkeleton fields={4} />
          </div>
        ) : null}

        {error ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {!loading && details ? (
          <>
            {activeSection === "personal" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First Name" required>
                  <input
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    onInput={() =>
                      setFieldErrors((prev) => ({ ...prev, firstName: "" }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </Field>
                <Field label="Middle Name">
                  <input
                    value={form.middleName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        middleName: e.target.value,
                      }))
                    }
                    onInput={() =>
                      setFieldErrors((prev) => ({ ...prev, middleName: "" }))
                    }
                    disabled={noMiddleName}
                    placeholder={
                      noMiddleName ? "No middle name provided" : "Middle name"
                    }
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      noMiddleName
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-gray-700"
                    }`}
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={noMiddleName}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNoMiddleName(checked);
                        if (checked) {
                          setForm((prev) => ({ ...prev, middleName: "" }));
                          setFieldErrors((prev) => ({
                            ...prev,
                            middleName: "",
                          }));
                        }
                      }}
                      className="h-4 w-4 cursor-pointer"
                    />
                    I don&apos;t have a middle name
                  </label>
                  {fieldErrors.middleName && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.middleName}
                    </p>
                  )}
                </Field>
                <Field label="Last Name" required>
                  <input
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    onInput={() =>
                      setFieldErrors((prev) => ({ ...prev, lastName: "" }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </Field>
                <Field label="Birthdate" required>
                  <input
                    type="date"
                    value={form.birthdate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        birthdate: e.target.value,
                      }))
                    }
                    onInput={() =>
                      setFieldErrors((prev) => ({ ...prev, birthdate: "" }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {fieldErrors.birthdate && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.birthdate}
                    </p>
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Email Address" required>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      onInput={() =>
                        setFieldErrors((prev) => ({ ...prev, email: "" }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErrors.email}
                      </p>
                    )}
                  </Field>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="School" required>
                  {schoolsError ? (
                    <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                      {schoolsError}
                    </p>
                  ) : null}
                  {useSchoolsDivisionOffice ? (
                    <input
                      readOnly
                      value={SCHOOLS_DIVISION_OFFICE}
                      className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                    />
                  ) : (
                    <select
                      value={String(form.schoolId || "")}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          schoolId: String(e.target.value || ""),
                        }))
                      }
                      disabled={schools.length === 0}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select school</option>
                      {schools.map((school) => (
                        <option key={school.id} value={String(school.id)}>
                          {school.school_name}
                        </option>
                      ))}
                    </select>
                  )}
                  {!useSchoolsDivisionOffice && schools.length === 0 ? (
                    <p className="mt-2 text-xs text-red-600">
                      No schools available. Please refresh and try again.
                    </p>
                  ) : null}
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={useSchoolsDivisionOffice}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const nextSchoolId = checked
                          ? form.schoolId
                          : initialForm?.schoolId &&
                              schools.some(
                                (school) =>
                                  String(school.id) ===
                                  String(initialForm.schoolId),
                              )
                            ? String(initialForm.schoolId)
                            : schools.length > 0
                              ? String(schools[0].id)
                              : "";

                        setUseSchoolsDivisionOffice(checked);
                        setForm((prev) => ({
                          ...prev,
                          schoolId: nextSchoolId,
                        }));
                        setFieldErrors((prev) => ({ ...prev, schoolId: "" }));
                      }}
                      className="h-4 w-4 cursor-pointer"
                    />
                    Schools Division Office
                  </label>
                  {fieldErrors.schoolId && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.schoolId}
                    </p>
                  )}
                </Field>
                <Field label="Role">
                  <input
                    readOnly
                    value={toRoleLabel(details.role)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                  />
                </Field>
                <Field label="Account Status">
                  <input
                    readOnly
                    value={
                      normalizeIsActive(details.is_active)
                        ? "Active"
                        : "Inactive"
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                  />
                </Field>
                <Field label="Member Since">
                  <input
                    readOnly
                    value={toDateLabel(details.created_at)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                  />
                </Field>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              {hasChanges ? (
                <button
                  type="button"
                  onClick={createClearHandler(() => {
                    if (!initialForm) return;
                    setForm(initialForm);
                    setUseSchoolsDivisionOffice(
                      initialUseSchoolsDivisionOffice,
                    );
                    setNoMiddleName(
                      !initialForm.middleName ||
                        initialForm.middleName.trim().toUpperCase() === "N/A",
                    );
                    setFieldErrors({
                      firstName: "",
                      middleName: "",
                      lastName: "",
                      email: "",
                      birthdate: "",
                      schoolId: "",
                    });
                    setError(null);
                  }, hasChanges)}
                  disabled={saving}
                  className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear All
                </button>
              ) : null}

              {onOpenAccountSettings ? (
                <button
                  type="button"
                  onClick={onOpenAccountSettings}
                  disabled={saving}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Shield size={14} />
                  Role/Status
                </button>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={14} />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleOpenSaveConfirm}
                disabled={saving || !hasChanges}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        ) : null}
      </div>

      <ConfirmationModal
        visible={showConfirmSave}
        title="Confirm Save Changes"
        message="Are you sure you want to save the updated user details?"
        warningMessage="The user will receive an email notification for the updated details."
        confirmLabel="Confirm Save"
        confirmClassName="bg-blue-600 hover:bg-blue-700 text-white"
        loading={saving}
        onConfirm={handleConfirmSave}
        onCancel={() => {
          if (saving) return;
          setShowConfirmSave(false);
        }}
      >
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <p className="inline-flex items-center gap-1.5 font-medium">
            <Settings size={14} />
            Changed fields will be applied to this user account.
          </p>
        </div>
      </ConfirmationModal>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
