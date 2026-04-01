"use client";

import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../super-admin/components/ConfirmationModal";
import ConfirmationAddEmployee from "./ConfirmationAddEmployee";

type School = {
  id: number;
  school_name: string;
};

type AddEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [recentlyAddedName, setRecentlyAddedName] = useState("");
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
      setIsSuccessOpen(false);
      setRecentlyAddedName("");
      setPendingPayload(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isSuccessOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleCloseSuccessModal();
    }, 3000);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessOpen]);

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

    if (
      !NAME_PATTERN.test(firstName.trim()) ||
      !NAME_PATTERN.test(lastName.trim())
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

      setRecentlyAddedName(
        `${pendingPayload.first_name} ${pendingPayload.last_name}`.trim(),
      );

      setIsConfirmOpen(false);
      setPendingPayload(null);
      setIsSuccessOpen(true);
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

  const handleCloseSuccessModal = () => {
    if (submitLoading) {
      return;
    }

    setIsSuccessOpen(false);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-8 sm:p-10 relative">
        <h2 className="text-2xl font-bold text-gray-800">Add Employee</h2>

        <form onSubmit={handleSubmit} className="mt-8 space-y-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-600">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Juan"
              />
            </div>
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-600">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dela Cruz"
              />
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            <label className="block text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="employee@email.com"
            />
          </div>

          <div className="mt-3 space-y-2.5">
            <label className="block text-sm font-medium text-gray-600">
              Birthdate
            </label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-600">
                Employee Type
              </label>
              <select
                value={employeeType}
                onChange={(e) =>
                  setEmployeeType(e.target.value as "teaching" | "non-teaching")
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-600">
                School
              </label>
              {["ADMIN", "DATA_ENCODER"].includes(currentUserRole) ? (
                <>
                  <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm cursor-pointer"
              disabled={submitLoading || isConfirmOpen || isSuccessOpen}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitLoading ||
                isConfirmOpen ||
                isSuccessOpen ||
                schoolsLoading
              }
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition font-medium text-sm cursor-pointer"
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
                {pendingPayload.first_name} {pendingPayload.last_name}
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

        <ConfirmationAddEmployee
          isOpen={isSuccessOpen}
          employeeName={recentlyAddedName}
          onClose={handleCloseSuccessModal}
        />
      </div>
    </div>
  );
}
