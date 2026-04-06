"use client";

import React, { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import ConfirmationModal from "../../../super-admin/components/ConfirmationModal";

type School = {
  id: number;
  school_name: string;
};

type AddEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (employeeName: string) => void;
};

type SchoolApiResponse = {
  data?: School[];
  message?: string;
};

type SchoolByIdResponse = {
  data?: {
    id?: number;
    school_name?: string;
  };
  message?: string;
};

type CreateEmployeeResponse = {
  message?: string;
};

type PendingEmployeePayload = {
  first_name: string;
  middle_name?: string | null;
  no_middle_name?: boolean;
  last_name: string;
  email: string;
  birthdate: string;
  employee_type: "teaching" | "non-teaching";
  school_id?: number | null;
  school_name: string;
};

const NAME_PATTERN = /^[A-Za-z.\s]+$/;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const normalizeRole = (value: unknown): string =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddEmployeeModalProps) {
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [employeeType, setEmployeeType] = useState<"teaching" | "non-teaching">(
    "non-teaching",
  );
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [schoolInputValue, setSchoolInputValue] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [assignedSchoolId, setAssignedSchoolId] = useState<number | null>(null);
  const [assignedSchoolName, setAssignedSchoolName] = useState("");

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<PendingEmployeePayload | null>(null);
  const sortedSchools = [...schools].sort((a, b) =>
    a.school_name.localeCompare(b.school_name),
  );

  const filteredSchools = sortedSchools.filter((school) =>
    school.school_name
      .trim()
      .toLowerCase()
      .includes(schoolInputValue.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        setCurrentUserRole("");
        setAssignedSchoolId(null);
        setAssignedSchoolName("");
        return;
      }

      const parsed = JSON.parse(rawUser) as {
        role?: string;
        school_id?: number | string | null;
        schoolId?: number | string | null;
        school_name?: string | null;
        schoolName?: string | null;
      };

      const normalizedRole = normalizeRole(parsed.role);
      const resolvedSchoolId = Number(parsed.school_id ?? parsed.schoolId);
      const resolvedSchoolName = String(
        parsed.school_name || parsed.schoolName || "",
      ).trim();

      setCurrentUserRole(normalizedRole);
      setAssignedSchoolId(
        Number.isFinite(resolvedSchoolId) && resolvedSchoolId > 0
          ? resolvedSchoolId
          : null,
      );
      setAssignedSchoolName(resolvedSchoolName);
    } catch {
      setCurrentUserRole("");
      setAssignedSchoolId(null);
      setAssignedSchoolName("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (currentUserRole !== "SUPER_ADMIN") {
      setSchools([]);
      setSchoolsLoading(false);
      return;
    }

    const loadSchools = async () => {
      try {
        setSchoolsLoading(true);
        setErrorMessage(null);

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

        const options = body.data || [];
        setSchools(options);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load schools",
        );
      } finally {
        setSchoolsLoading(false);
      }
    };

    loadSchools();
  }, [isOpen, currentUserRole]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!["ADMIN", "DATA_ENCODER"].includes(currentUserRole)) {
      return;
    }

    if (!assignedSchoolId || assignedSchoolName) {
      return;
    }

    let isDisposed = false;

    const loadAssignedSchoolName = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          return;
        }

        const response = await fetch(
          `${API_BASE}/api/schools/${assignedSchoolId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const body = (await response
          .json()
          .catch(() => ({}))) as SchoolByIdResponse;
        if (!response.ok) {
          return;
        }

        const fetchedName = String(body.data?.school_name || "").trim();
        if (!isDisposed && fetchedName) {
          setAssignedSchoolName(fetchedName);
        }
      } catch {
        // Keep fallback label when school lookup fails.
      }
    };

    loadAssignedSchoolName();

    return () => {
      isDisposed = true;
    };
  }, [isOpen, currentUserRole, assignedSchoolId, assignedSchoolName]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (["ADMIN", "DATA_ENCODER"].includes(currentUserRole)) {
      setSchoolId(assignedSchoolId);
      setSchoolInputValue(assignedSchoolName);
      setShowSchoolDropdown(false);
    }
  }, [isOpen, currentUserRole, assignedSchoolId, assignedSchoolName]);

  useEffect(() => {
    if (!isOpen) {
      setFirstName("");
      setMiddleName("");
      setNoMiddleName(false);
      setLastName("");
      setEmail("");
      setBirthdate("");
      setEmployeeType("non-teaching");
      setSchoolId(null);
      setSchoolInputValue("");
      setShowSchoolDropdown(false);
      setCurrentUserRole("");
      setAssignedSchoolId(null);
      setAssignedSchoolName("");
      setSchools([]);
      setSchoolsLoading(false);
      setSubmitLoading(false);
      setErrorMessage(null);
      setIsConfirmOpen(false);
      setPendingPayload(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!["SUPER_ADMIN", "ADMIN", "DATA_ENCODER"].includes(currentUserRole)) {
      setErrorMessage("Your role is not allowed to add employees.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("First name and last name are required.");
      return;
    }

    if (!noMiddleName && !middleName.trim()) {
      setErrorMessage(
        "Middle name is required. Check 'I don't have a middle name' if applicable.",
      );
      return;
    }

    if (
      !NAME_PATTERN.test(firstName.trim()) ||
      !NAME_PATTERN.test(lastName.trim()) ||
      (!noMiddleName && !NAME_PATTERN.test(middleName.trim()))
    ) {
      setErrorMessage(
        "Name must contain letters only. Dot (.) and spaces are allowed.",
      );
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (!birthdate) {
      setErrorMessage("Birthdate is required.");
      return;
    }

    if (new Date(birthdate) > new Date()) {
      setErrorMessage("Birthdate cannot be in the future.");
      return;
    }

    // Keep employee type explicit in validation even if a default exists.
    if (!employeeType) {
      setErrorMessage("Employee type is required.");
      return;
    }

    setErrorMessage(null);
    let resolvedSchoolId: number | null = null;
    let resolvedSchoolName = "";

    if (["ADMIN", "DATA_ENCODER"].includes(currentUserRole)) {
      resolvedSchoolId = assignedSchoolId;
      resolvedSchoolName = assignedSchoolName;

      if (!resolvedSchoolId) {
        setErrorMessage("Your account has no assigned school.");
        return;
      }

      if (!resolvedSchoolName) {
        resolvedSchoolName = "Assigned school";
      }
    } else {
      if (!schoolId) {
        setErrorMessage("Please select a valid school from the dropdown.");
        return;
      }

      const selectedSchool = schools.find((s) => s.id === schoolId);
      if (!selectedSchool) {
        setErrorMessage("Invalid school selection.");
        return;
      }

      resolvedSchoolId = selectedSchool.id;
      resolvedSchoolName = selectedSchool.school_name;
    }

    setPendingPayload({
      first_name: firstName.trim(),
      middle_name: noMiddleName ? null : middleName.trim(),
      no_middle_name: noMiddleName,
      last_name: lastName.trim(),
      email: email.trim(),
      birthdate,
      employee_type: employeeType,
      school_id: resolvedSchoolId,
      school_name: resolvedSchoolName,
    } as PendingEmployeePayload);
    setIsConfirmOpen(true);
  };

  const handleConfirmAddEmployee = async () => {
    if (!pendingPayload) {
      return;
    }

    try {
      setSubmitLoading(true);
      setErrorMessage(null);

      // Try to get token from localStorage with a small delay to ensure it's available
      const token = localStorage.getItem("authToken");

      if (!token) {
        // Check if localStorage is accessible at all
        if (
          typeof window !== "undefined" &&
          typeof window.localStorage === "undefined"
        ) {
          throw new Error(
            "Browser storage is not available. Please use a non-private browsing window and ensure cookies/storage are enabled.",
          );
        }
        throw new Error("No authentication token found. Please log in again.");
      }

      // School must already exist in database (validated in form submission)
      const resolvedSchoolId = pendingPayload.school_id;
      if (!resolvedSchoolId) {
        throw new Error(
          "School is required and must be selected from the database.",
        );
      }

      const response = await fetch(`${API_BASE}/api/employees/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: pendingPayload.first_name,
          middle_name: pendingPayload.middle_name,
          no_middle_name: pendingPayload.no_middle_name,
          last_name: pendingPayload.last_name,
          email: pendingPayload.email,
          birthdate: pendingPayload.birthdate,
          employee_type: pendingPayload.employee_type,
          school_id: resolvedSchoolId,
        }),
      });

      const body = (await response.json()) as CreateEmployeeResponse;
      if (!response.ok) {
        throw new Error(body.message || "Failed to create employee");
      }

      const createdEmployeeName =
        `${pendingPayload.first_name} ${pendingPayload.last_name}`.trim();

      setIsConfirmOpen(false);
      setPendingPayload(null);
      if (onSuccess) {
        onSuccess(createdEmployeeName);
      }
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create employee",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    if (submitLoading) {
      return;
    }

    setIsConfirmOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto relative">
        <div className="flex items-center gap-2">
          <UserPlus size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Add Employee</h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                placeholder="Juan"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Middle Name
            </label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              disabled={noMiddleName}
              className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                noMiddleName
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-gray-700"
              }`}
              placeholder={noMiddleName ? "No middle name provided" : "Santos"}
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={noMiddleName}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setNoMiddleName(checked);
                  if (checked) {
                    setMiddleName("");
                  }
                }}
                className="h-4 w-4 cursor-pointer"
              />
              I don't have a middle name
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                placeholder="employee@email.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Birthdate
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Employee Type
              </label>
              <select
                value={employeeType}
                onChange={(e) =>
                  setEmployeeType(e.target.value as "teaching" | "non-teaching")
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer"
              >
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                School
              </label>
              {["ADMIN", "DATA_ENCODER"].includes(currentUserRole) ? (
                <>
                  <div className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {assignedSchoolName ||
                      (assignedSchoolId
                        ? "Loading assigned school..."
                        : "No assigned school")}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    New employees created here are automatically assigned to
                    your school.
                  </p>
                </>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={schoolInputValue}
                    onChange={(e) => {
                      setSchoolInputValue(e.target.value);
                      setShowSchoolDropdown(true);
                    }}
                    onFocus={() => setShowSchoolDropdown(true)}
                    onBlur={() => {
                      // Delay closing to allow click on option
                      setTimeout(() => setShowSchoolDropdown(false), 150);
                    }}
                    disabled={schoolsLoading}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={
                      schoolsLoading
                        ? "Loading schools..."
                        : "Type to search schools..."
                    }
                  />
                  {showSchoolDropdown && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      {schoolsLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Loading schools...
                        </div>
                      ) : schools.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          No schools available
                        </div>
                      ) : filteredSchools.length > 0 ? (
                        filteredSchools.map((school) => (
                          <button
                            key={school.id}
                            type="button"
                            onClick={() => {
                              setSchoolId(school.id);
                              setSchoolInputValue(school.school_name);
                              setShowSchoolDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition ${
                              schoolId === school.id
                                ? "bg-blue-100 font-medium text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
                            {school.school_name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          No schools match &quot;{schoolInputValue}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {schoolId && currentUserRole === "SUPER_ADMIN" && (
                <p className="mt-1 text-xs text-green-700">✓ School selected</p>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium cursor-pointer"
              disabled={submitLoading || isConfirmOpen}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading || isConfirmOpen || schoolsLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition text-sm font-medium cursor-pointer"
            >
              {submitLoading ? "Saving..." : "Add Employee"}
            </button>
          </div>
        </form>

        <ConfirmationModal
          visible={isConfirmOpen}
          title="Confirm Add Employee"
          message="Are you sure you want to add this employee?"
          confirmLabel="Yes"
          loading={submitLoading}
          onConfirm={handleConfirmAddEmployee}
          onCancel={handleCancelConfirmation}
        >
          {pendingPayload && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-semibold text-gray-800">Name:</span>{" "}
                {pendingPayload.first_name}
                {pendingPayload.middle_name
                  ? ` ${pendingPayload.middle_name}`
                  : ""}{" "}
                {pendingPayload.last_name}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Email:</span>{" "}
                {pendingPayload.email}
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  Employee Type:
                </span>{" "}
                {pendingPayload.employee_type === "teaching"
                  ? "Teaching"
                  : "Non-Teaching"}
              </p>
              <p>
                <span className="font-semibold text-gray-800">School:</span>{" "}
                {pendingPayload.school_name}
              </p>
            </div>
          )}
        </ConfirmationModal>
      </div>
    </div>
  );
}
