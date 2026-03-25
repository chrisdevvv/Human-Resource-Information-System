"use client";

import React, { useEffect, useState } from "react";
import ConfirmationModal from "../../../super-admin/components/ConfirmationModal";
import ConfirmationAddEmployee from "../ConfirmationAddEmployee";

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

type CreateEmployeeResponse = {
  message?: string;
};

type PendingEmployeePayload = {
  first_name: string;
  last_name: string;
  email: string;
  employee_type: "teaching" | "non-teaching";
  school_id?: number | null;
  school_name: string;
};

const NAME_PATTERN = /^[A-Za-z.\s]+$/;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddEmployeeModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeType, setEmployeeType] = useState<"teaching" | "non-teaching">(
    "non-teaching",
  );
  const [schoolName, setSchoolName] = useState("");

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

  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setEmployeeType("non-teaching");
      setSchoolName("");
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

    // Keep employee type explicit in validation even if a default exists.
    if (!employeeType) {
      setErrorMessage("Employee type is required.");
      return;
    }

    if (!schoolName.trim()) {
      setErrorMessage("School is required.");
      return;
    }

    const selectedSchool = schools.find(
      (school) =>
        school.school_name.trim().toLowerCase() ===
        schoolName.trim().toLowerCase(),
    );

    // Allow manual input: if school not found, proceed and create on confirmation.
    setErrorMessage(null);
    setPendingPayload({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      employee_type: employeeType,
      school_id: selectedSchool ? selectedSchool.id : null,
      school_name: schoolName.trim(),
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
      let token = localStorage.getItem("authToken");

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

      // Ensure school exists: if no school_id in pending payload, create the school first
      let schoolId = pendingPayload.school_id ?? null;
      if (!schoolId) {
        // Generate a school code from the school name
        const generateSchoolCode = (name: string): string => {
          // Use first letters of each word, uppercased
          const words = name.trim().split(/\s+/);
          if (words.length === 0) return "SCH";

          // Take first letter of each word up to 4 letters, or the full first word if short
          if (words.length === 1) {
            return words[0].slice(0, 4).toUpperCase();
          }

          const code = words
            .slice(0, 3)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
          return code || "SCH";
        };

        const schoolCode = generateSchoolCode(pendingPayload.school_name);

        const createSchoolRes = await fetch(`${API_BASE}/api/schools/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            school_name: pendingPayload.school_name,
            school_code: schoolCode,
          }),
        });

        const createdSchoolBody = await createSchoolRes
          .json()
          .catch(() => ({}));
        if (!createSchoolRes.ok) {
          throw new Error(
            createdSchoolBody.message || "Failed to create school",
          );
        }

        const newId =
          createdSchoolBody?.data?.insertId ||
          createdSchoolBody?.data?.insert_id ||
          null;
        if (newId) {
          schoolId = Number(newId);
        } else {
          // Fallback: reload schools and find by name
          const reloadRes = await fetch(`${API_BASE}/api/schools/`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          const reloadBody = await reloadRes.json().catch(() => ({}));
          const options = Array.isArray(reloadBody.data) ? reloadBody.data : [];
          setSchools(options);
          const found = options.find(
            (s: any) =>
              s.school_name.trim().toLowerCase() ===
              pendingPayload.school_name.trim().toLowerCase(),
          );
          if (found) schoolId = found.id;
        }

        if (!schoolId) {
          throw new Error("Unable to resolve or create school.");
        }
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
          employee_type: pendingPayload.employee_type,
          school_id: schoolId,
        }),
      });

      const body = (await response.json()) as CreateEmployeeResponse;
      if (!response.ok) {
        throw new Error(body.message || "Failed to create employee");
      }

      setRecentlyAddedName(
        `${pendingPayload.first_name} ${pendingPayload.last_name}`.trim(),
      );

      // Add created school to local list if it wasn't present
      if (schoolId) {
        const exists = schools.some(
          (s) =>
            s.id === schoolId ||
            s.school_name.trim().toLowerCase() ===
              pendingPayload.school_name.trim().toLowerCase(),
        );
        if (!exists) {
          setSchools((prev) => [
            ...prev,
            { id: schoolId as number, school_name: pendingPayload.school_name },
          ]);
        }
      }

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
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  schoolsLoading
                    ? "Loading schools..."
                    : "Type or paste school name"
                }
                disabled={schoolsLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Type the school name manually. New names will be created and
                added.
              </p>
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
