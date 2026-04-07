"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Save, XCircle } from "lucide-react";
import ConfirmEdit from "./ConfirmEdit";

type EmployeeRecord = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  fullName: string;
  employeeType: "teaching" | "non-teaching";
  schoolId: number | null;
  schoolName: string;
  birthdate: string;
};

type School = {
  id: number;
  school_name: string;
};

type UpdateEmployeeResponse = {
  message?: string;
};

type SchoolApiResponse = {
  data?: School[];
  message?: string;
};

type EditEmployeeProps = {
  employee: EmployeeRecord;
  canEdit: boolean;
  onClose: () => void;
  onEmployeeUpdated: (updated: EmployeeRecord) => void;
};

type EditableState = {
  firstName: string;
  middleName: string;
  noMiddleName: boolean;
  lastName: string;
  email: string;
  birthdate: string;
  employeeType: "teaching" | "non-teaching";
  schoolId: number | null;
  schoolName: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const NAME_PATTERN = /^[A-Za-z.\s]+$/;

const toDateInputValue = (raw: string): string => {
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const buildFullName = (
  firstName: string,
  middleName: string,
  lastName: string,
): string => [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

export default function EditEmployee({
  employee,
  canEdit,
  onClose,
  onEmployeeUpdated,
}: EditEmployeeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [draft, setDraft] = useState<EditableState>({
    firstName: employee.firstName,
    middleName: employee.middleName,
    noMiddleName: !employee.middleName,
    lastName: employee.lastName,
    email: employee.email,
    birthdate: toDateInputValue(employee.birthdate),
    employeeType: employee.employeeType,
    schoolId: employee.schoolId,
    schoolName: employee.schoolName,
  });

  const sortedSchools = useMemo(
    () =>
      [...schools].sort((a, b) => a.school_name.localeCompare(b.school_name)),
    [schools],
  );

  useEffect(() => {
    setIsEditing(false);
    setIsSaving(false);
    setErrorMessage(null);
    setShowConfirmEdit(false);
    setDraft({
      firstName: employee.firstName,
      middleName: employee.middleName,
      noMiddleName: !employee.middleName,
      lastName: employee.lastName,
      email: employee.email,
      birthdate: toDateInputValue(employee.birthdate),
      employeeType: employee.employeeType,
      schoolId: employee.schoolId,
      schoolName: employee.schoolName,
    });
  }, [employee]);

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    let disposed = false;

    const loadSchools = async () => {
      try {
        setSchoolsLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error(
            "No authentication token found. Please log in again.",
          );
        }

        const response = await fetch(`${API_BASE}/api/schools/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const body = (await response.json()) as SchoolApiResponse;
        if (!response.ok) {
          throw new Error(body.message || "Failed to load schools");
        }

        if (!disposed) {
          setSchools(body.data || []);
        }
      } catch (err) {
        if (!disposed) {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to load schools",
          );
        }
      } finally {
        if (!disposed) {
          setSchoolsLoading(false);
        }
      }
    };

    loadSchools();

    return () => {
      disposed = true;
    };
  }, [canEdit]);

  const inputClass = (editable: boolean) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
      editable
        ? "border-gray-300 bg-white text-gray-700"
        : "border-gray-200 bg-gray-100 text-gray-500"
    }`;

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage(null);
    setShowConfirmEdit(false);
    setDraft({
      firstName: employee.firstName,
      middleName: employee.middleName,
      noMiddleName: !employee.middleName,
      lastName: employee.lastName,
      email: employee.email,
      birthdate: toDateInputValue(employee.birthdate),
      employeeType: employee.employeeType,
      schoolId: employee.schoolId,
      schoolName: employee.schoolName,
    });
  };

  const validateBeforeConfirm = () => {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setErrorMessage("First name and last name are required.");
      return;
    }

    if (!draft.noMiddleName && !draft.middleName.trim()) {
      setErrorMessage(
        "Middle name is required. Check 'I don't have a middle name' if applicable.",
      );
      return;
    }

    if (
      !NAME_PATTERN.test(draft.firstName.trim()) ||
      !NAME_PATTERN.test(draft.lastName.trim()) ||
      (!draft.noMiddleName && !NAME_PATTERN.test(draft.middleName.trim()))
    ) {
      setErrorMessage(
        "Name must contain letters only. Dot (.) and spaces are allowed.",
      );
      return;
    }

    if (!draft.birthdate) {
      setErrorMessage("Birthdate is required.");
      return;
    }

    if (new Date(draft.birthdate) > new Date()) {
      setErrorMessage("Birthdate cannot be in the future.");
      return;
    }

    if (!draft.schoolId) {
      setErrorMessage("Please select a valid school.");
      return;
    }

    setErrorMessage(null);
    setShowConfirmEdit(true);
  };

  const handleSaveConfirmed = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(`${API_BASE}/api/employees/${employee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: draft.firstName.trim(),
          middle_name: draft.noMiddleName ? null : draft.middleName.trim(),
          no_middle_name: draft.noMiddleName,
          last_name: draft.lastName.trim(),
          email: draft.email.trim(),
          birthdate: draft.birthdate,
          employee_type: draft.employeeType,
          school_id: draft.schoolId,
        }),
      });

      const body = (await response.json()) as UpdateEmployeeResponse;
      if (!response.ok) {
        throw new Error(body.message || "Failed to update employee");
      }

      const selectedSchool = sortedSchools.find((s) => s.id === draft.schoolId);
      const updated: EmployeeRecord = {
        id: employee.id,
        firstName: draft.firstName.trim(),
        middleName: draft.noMiddleName ? "" : draft.middleName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        fullName: buildFullName(
          draft.firstName.trim(),
          draft.noMiddleName ? "" : draft.middleName.trim(),
          draft.lastName.trim(),
        ),
        employeeType: draft.employeeType,
        schoolId: draft.schoolId,
        schoolName: selectedSchool?.school_name || draft.schoolName,
        birthdate: draft.birthdate,
      };

      setIsEditing(false);
      setShowConfirmEdit(false);
      onEmployeeUpdated(updated);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update employee",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const employeeName = buildFullName(
    draft.firstName.trim(),
    draft.noMiddleName ? "" : draft.middleName.trim(),
    draft.lastName.trim(),
  );

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              First Name
            </label>
            <input
              type="text"
              value={draft.firstName}
              readOnly={!isEditing}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, firstName: e.target.value }))
              }
              className={inputClass(isEditing)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Last Name
            </label>
            <input
              type="text"
              value={draft.lastName}
              readOnly={!isEditing}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, lastName: e.target.value }))
              }
              className={inputClass(isEditing)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Middle Name
          </label>
          <input
            type="text"
            value={draft.middleName}
            readOnly={!isEditing || draft.noMiddleName}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, middleName: e.target.value }))
            }
            className={inputClass(isEditing && !draft.noMiddleName)}
            placeholder={draft.noMiddleName ? "No middle name provided" : ""}
          />
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer"
              disabled={!isEditing}
              checked={draft.noMiddleName}
              onChange={(e) => {
                const checked = e.target.checked;
                setDraft((prev) => ({
                  ...prev,
                  noMiddleName: checked,
                  middleName: checked ? "" : prev.middleName,
                }));
              }}
            />
            I don't have a middle name
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Email Address
            </label>
            <input
              type="email"
              value={draft.email}
              readOnly={!isEditing}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, email: e.target.value }))
              }
              className={inputClass(isEditing)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Birthdate
            </label>
            <input
              type="date"
              value={draft.birthdate}
              readOnly={!isEditing}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, birthdate: e.target.value }))
              }
              max={new Date().toISOString().slice(0, 10)}
              className={inputClass(isEditing)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Employee Type
            </label>
            {isEditing ? (
              <select
                value={draft.employeeType}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    employeeType: e.target.value as "teaching" | "non-teaching",
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
              >
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>
            ) : (
              <input
                type="text"
                readOnly
                value={
                  draft.employeeType === "teaching"
                    ? "Teaching"
                    : "Non-Teaching"
                }
                className={inputClass(false)}
              />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              School
            </label>
            {isEditing ? (
              <select
                value={draft.schoolId ?? ""}
                onChange={(e) => {
                  const nextSchoolId = Number(e.target.value);
                  const selected = sortedSchools.find(
                    (s) => s.id === nextSchoolId,
                  );
                  setDraft((prev) => ({
                    ...prev,
                    schoolId: Number.isFinite(nextSchoolId)
                      ? nextSchoolId
                      : null,
                    schoolName: selected?.school_name || prev.schoolName,
                  }));
                }}
                disabled={schoolsLoading}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="" disabled>
                  {schoolsLoading ? "Loading schools..." : "Select school"}
                </option>
                {sortedSchools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.school_name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                readOnly
                value={draft.schoolName}
                className={inputClass(false)}
              />
            )}
          </div>
        </div>

        {errorMessage ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          disabled={isSaving}
        >
          <span className="inline-flex items-center gap-1">
            <XCircle size={14} />
            Close
          </span>
        </button>

        {canEdit && !isEditing ? (
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setIsEditing(true);
            }}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition cursor-pointer"
          >
            <span className="inline-flex items-center gap-1">
              <Pencil size={14} />
              Edit Details
            </span>
          </button>
        ) : null}

        {canEdit && isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1">
                <XCircle size={14} />
                Cancel
              </span>
            </button>
            <button
              type="button"
              onClick={validateBeforeConfirm}
              disabled={isSaving}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1">
                <Save size={14} />
                Save Changes
              </span>
            </button>
          </>
        ) : null}
      </div>

      <ConfirmEdit
        visible={showConfirmEdit}
        loading={isSaving}
        employeeName={employeeName}
        onConfirm={handleSaveConfirmed}
        onCancel={() => {
          if (!isSaving) {
            setShowConfirmEdit(false);
          }
        }}
      />
    </>
  );
}
