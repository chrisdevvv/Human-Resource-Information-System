"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Pencil,
  XCircle,
  Save,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import EditEmployee from "../../../super-admin/functions/EmployeesList/EditEmployee";

type School = {
  id: number;
  school_name: string;
};

type Position = {
  id: number;
  position_name: string;
};

type District = {
  id: number;
  district_name: string;
};

type ValidationError = {
  field: string;
  message: string;
};

type EmployeeDetailsResponse = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  middle_initial?: string | null;
  last_name: string;
  email?: string | null;
  mobile_number?: string | null;
  home_address?: string | null;
  employee_type?: "teaching" | "non-teaching";
  school_id?: number | null;
  school_name?: string | null;
  employee_no?: string | null;
  work_email?: string | null;
  district?: string | null;
  work_district?: string | null;
  position?: string | null;
  position_id?: number | null;
  plantilla_no?: string | null;
  age?: number | null;
  birthdate?: string | null;
};

type ViewEmployeeModalProps = {
  visible: boolean;
  employee: {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    fullName: string;
    email: string;
    employeeType: "teaching" | "non-teaching";
    schoolId: number | null;
    schoolName: string;
    birthdate: string;
  } | null;
  canEdit: boolean;
  onEmployeeUpdated: (employee: {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    fullName: string;
    email: string;
    employeeType: "teaching" | "non-teaching";
    schoolId: number | null;
    schoolName: string;
    birthdate: string;
  }) => void;
  onClose: () => void;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const formatValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  const text = String(value).trim();
  return text ? text : "N/A";
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const computeAge = (birthdate: string | null | undefined): number | null => {
  if (!birthdate) {
    return null;
  }

  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
};

const buildFullName = (
  firstName: string,
  middleName: string,
  lastName: string,
): string => [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

const formatEmployeeType = (type: string): string => {
  const normalized = String(type).toLowerCase().trim();
  if (normalized === "non-teaching") return "Non-Teaching";
  if (normalized === "teaching") return "Teaching";
  return type;
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-gray-800 wrap-break-word">
      {value}
    </p>
  </div>
);

export default function ViewEmployeeModal({
  visible,
  employee,
  canEdit,
  onEmployeeUpdated,
  onClose,
}: ViewEmployeeModalProps) {
  const [details, setDetails] = useState<EmployeeDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable field states
  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editMiddleInitial, setEditMiddleInitial] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editPersonalEmail, setEditPersonalEmail] = useState("");
  const [editMobileNumber, setEditMobileNumber] = useState("");
  const [editHomeAddress, setEditHomeAddress] = useState("");
  const [editEmployeeNo, setEditEmployeeNo] = useState("");
  const [editWorkEmail, setEditWorkEmail] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editPlantillaNo, setEditPlantillaNo] = useState("");
  const [editEmployeeType, setEditEmployeeType] = useState<
    "teaching" | "non-teaching"
  >("non-teaching");
  const [editSchoolId, setEditSchoolId] = useState<number | null>(null);
  const [editSchoolName, setEditSchoolName] = useState("");
  const [editPositionId, setEditPositionId] = useState<number | null>(null);

  // Dropdown data and UI states
  const [schools, setSchools] = useState<School[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [positionSearch, setPositionSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  const [editError, setEditError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const fallbackDetails = useMemo<EmployeeDetailsResponse | null>(() => {
    if (!employee) {
      return null;
    }

    return {
      id: employee.id,
      first_name: employee.firstName,
      middle_name: employee.middleName || null,
      last_name: employee.lastName,
      email: employee.email || null,
      employee_type: employee.employeeType,
      school_id: employee.schoolId,
      school_name: employee.schoolName,
      birthdate: employee.birthdate || null,
    };
  }, [employee]);

  const resolvedDetails = details || fallbackDetails;

  const editableEmployee = useMemo(() => {
    if (!resolvedDetails || !employee) {
      return null;
    }

    const firstName = resolvedDetails.first_name || employee.firstName;
    const middleName = resolvedDetails.middle_name || employee.middleName;
    const lastName = resolvedDetails.last_name || employee.lastName;

    return {
      id: employee.id,
      firstName,
      middleName,
      lastName,
      email: resolvedDetails.email || employee.email,
      fullName: buildFullName(firstName, middleName, lastName),
      employeeType: resolvedDetails.employee_type || employee.employeeType,
      schoolId:
        typeof resolvedDetails.school_id === "number"
          ? resolvedDetails.school_id
          : employee.schoolId,
      schoolName: resolvedDetails.school_name || employee.schoolName,
      birthdate: resolvedDetails.birthdate || employee.birthdate,
    };
  }, [employee, resolvedDetails]);

  useEffect(() => {
    if (!visible || !employee) {
      return;
    }

    let disposed = false;

    const loadDetails = async () => {
      try {
        setIsLoadingDetails(true);
        setDetailsError(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error(
            "No authentication token found. Please log in again.",
          );
        }

        const response = await fetch(
          `${API_BASE}/api/employees/${employee.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const body = (await response.json()) as {
          data?: EmployeeDetailsResponse;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(body.message || "Failed to load employee details");
        }

        if (!disposed) {
          setDetails(body.data || null);
          // Populate editable fields
          const data = body.data;
          if (data) {
            setEditFirstName(data.first_name || "");
            setEditMiddleName(data.middle_name || "");
            setEditMiddleInitial(data.middle_initial || "");
            setEditLastName(data.last_name || "");
            setEditBirthdate(data.birthdate || "");
            setEditPersonalEmail(data.email || "");
            setEditMobileNumber(data.mobile_number || "");
            setEditHomeAddress(data.home_address || "");
            setEditEmployeeNo(data.employee_no || "");
            setEditWorkEmail(data.work_email || "");
            setEditDistrict(data.district || data.work_district || "");
            setEditPosition(data.position || "");
            setEditPositionId(data.position_id || null);
            setEditPlantillaNo(data.plantilla_no || "");
            setEditEmployeeType(data.employee_type || "non-teaching");
            setEditSchoolId(data.school_id || null);
            setEditSchoolName(data.school_name || "");
          }
        }
      } catch (err) {
        if (!disposed) {
          setDetailsError(
            err instanceof Error
              ? err.message
              : "Failed to load employee details",
          );
        }
      } finally {
        if (!disposed) {
          setIsLoadingDetails(false);
        }
      }
    };

    setDetails(null);
    setIsEditing(false);
    setEditError(null);
    loadDetails();

    return () => {
      disposed = true;
    };
  }, [employee, visible]);

  // Initialize search fields when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Populate search fields with current values
      setDistrictSearch(editDistrict);
      setPositionSearch(editPosition);
      setSchoolSearch(editSchoolName);
    } else {
      // Clear search fields when exiting edit mode
      setDistrictSearch("");
      setPositionSearch("");
      setSchoolSearch("");
    }
  }, [isEditing, editDistrict, editPosition, editSchoolName]);

  // Load dropdown data
  useEffect(() => {
    if (!visible) {
      return;
    }

    const loadDropdownData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          return;
        }

        const [schoolsRes, positionsRes, districtsRes] = await Promise.all([
          fetch(`${API_BASE}/api/schools/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/api/positions`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/api/districts`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const schoolsBody = (await schoolsRes.json()) as {
          data?: School[];
        };
        const positionsBody = (await positionsRes.json()) as {
          data?: Position[];
        };
        const districtsBody = (await districtsRes.json()) as {
          data?: District[];
        };

        if (schoolsRes.ok && schoolsBody.data) {
          setSchools(schoolsBody.data);
        }
        if (positionsRes.ok && positionsBody.data) {
          setPositions(positionsBody.data);
        }
        if (districtsRes.ok && districtsBody.data) {
          setDistricts(districtsBody.data);
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
      }
    };

    loadDropdownData();
  }, [visible]);

  if (!visible || !employee) {
    return null;
  }

  const fullName = buildFullName(
    resolvedDetails?.first_name || employee.firstName,
    resolvedDetails?.middle_name || employee.middleName,
    resolvedDetails?.last_name || employee.lastName,
  );

  const handleSaveChanges = async () => {
    setEditError(null);
    const newErrors: ValidationError[] = [];

    // Validate all fields
    if (!editFirstName.trim()) {
      newErrors.push({
        field: "First Name",
        message: "First name is required",
      });
    }

    if (!editLastName.trim()) {
      newErrors.push({
        field: "Last Name",
        message: "Last name is required",
      });
    }

    if (!editMiddleName.trim()) {
      newErrors.push({
        field: "Middle Name",
        message: "Middle name is required",
      });
    }

    if (!editMiddleInitial.trim()) {
      newErrors.push({
        field: "Middle Initial",
        message: "Middle initial is required",
      });
    }

    if (!editBirthdate) {
      newErrors.push({
        field: "Date of Birth",
        message: "Date of birth is required",
      });
    }

    if (!editPersonalEmail.trim()) {
      newErrors.push({
        field: "Personal Email",
        message: "Personal email is required",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editPersonalEmail.trim())) {
      newErrors.push({
        field: "Personal Email",
        message: "Personal email must be a valid email",
      });
    }

    if (!editMobileNumber.trim()) {
      newErrors.push({
        field: "Mobile Number",
        message: "Mobile number is required",
      });
    } else if (!/^\d{11}$/.test(editMobileNumber.trim())) {
      newErrors.push({
        field: "Mobile Number",
        message: "Mobile number must be exactly 11 digits",
      });
    }

    if (!editEmployeeNo.trim()) {
      newErrors.push({
        field: "Employee Number",
        message: "Employee number is required",
      });
    } else if (!/^\d{7}$/.test(editEmployeeNo.trim())) {
      newErrors.push({
        field: "Employee Number",
        message: "Employee number must be exactly 7 digits",
      });
    }

    if (!editWorkEmail.trim()) {
      newErrors.push({
        field: "Work Email",
        message: "Work email is required",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editWorkEmail.trim())) {
      newErrors.push({
        field: "Work Email",
        message: "Work email must be a valid email",
      });
    }

    if (!editSchoolId) {
      newErrors.push({
        field: "School",
        message: "School is required",
      });
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);

    try {
      setIsSaving(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE}/api/employees/${employee?.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: editFirstName.trim(),
            middle_name: editMiddleName.trim(),
            middle_initial: editMiddleInitial.trim(),
            last_name: editLastName.trim(),
            birthdate: editBirthdate,
            email: editPersonalEmail.trim(),
            personal_email: editPersonalEmail.trim(),
            mobile_number: editMobileNumber.trim(),
            home_address: editHomeAddress.trim(),
            employee_no: editEmployeeNo.trim(),
            work_email: editWorkEmail.trim(),
            district: editDistrict.trim(),
            position: editPosition.trim(),
            position_id: editPositionId,
            plantilla_no: editPlantillaNo.trim(),
            employee_type: editEmployeeType,
            school_id: editSchoolId,
          }),
        },
      );

      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Failed to update employee");
      }

      // Update details state
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              first_name: editFirstName.trim(),
              middle_name: editMiddleName.trim(),
              middle_initial: editMiddleInitial.trim(),
              last_name: editLastName.trim(),
              birthdate: editBirthdate,
              email: editPersonalEmail.trim(),
              mobile_number: editMobileNumber.trim(),
              home_address: editHomeAddress.trim(),
              employee_no: editEmployeeNo.trim(),
              work_email: editWorkEmail.trim(),
              district: editDistrict.trim(),
              position: editPosition.trim(),
              position_id: editPositionId,
              plantilla_no: editPlantillaNo.trim(),
              employee_type: editEmployeeType,
              school_id: editSchoolId,
              school_name: editSchoolName,
              age: computeAge(editBirthdate),
            }
          : null,
      );

      // Call parent callback
      if (employee && onEmployeeUpdated) {
        onEmployeeUpdated({
          id: employee.id,
          firstName: editFirstName.trim(),
          middleName: editMiddleName.trim(),
          lastName: editLastName.trim(),
          fullName: `${editFirstName.trim()} ${editMiddleName.trim()} ${editLastName.trim()}`,
          email: editPersonalEmail.trim(),
          employeeType: editEmployeeType,
          schoolId: editSchoolId || employee.schoolId,
          schoolName: editSchoolName || employee.schoolName,
          birthdate: editBirthdate,
        });
      }

      setIsEditing(false);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update employee",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const ageValue =
    resolvedDetails?.age ??
    computeAge(resolvedDetails?.birthdate || employee.birthdate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-blue-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Employee Details
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-800">
              {isEditing ? `Editing ${fullName}` : fullName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {formatEmployeeType(
                resolvedDetails?.employee_type || employee.employeeType,
              )}
              {resolvedDetails?.school_name || employee.schoolName
                ? ` • ${formatValue(resolvedDetails?.school_name || employee.schoolName)}`
                : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isEditing || isSaving}
            className="inline-flex items-center gap-1 self-start rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle size={16} />
            Close
          </button>
        </div>

        <div className="space-y-5">
          {/* Personal Information Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Personal Information
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={editMiddleName}
                  onChange={(e) => setEditMiddleName(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Middle Initial
                </label>
                <input
                  type="text"
                  value={editMiddleInitial}
                  onChange={(e) => setEditMiddleInitial(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={editBirthdate}
                  onChange={(e) => setEditBirthdate(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  value={ageValue || ""}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Personal Email
                </label>
                <input
                  type="email"
                  value={editPersonalEmail}
                  onChange={(e) => setEditPersonalEmail(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editMobileNumber}
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 11);
                    setEditMobileNumber(digitsOnly);
                  }}
                  disabled={!isEditing}
                  maxLength={11}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Home Address
                </label>
                <input
                  type="text"
                  value={editHomeAddress}
                  onChange={(e) => setEditHomeAddress(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Work Information Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Work Information
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Employee Number
                </label>
                <input
                  type="text"
                  value={editEmployeeNo}
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 7);
                    setEditEmployeeNo(digitsOnly);
                  }}
                  disabled={!isEditing}
                  maxLength={7}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Work Email
                </label>
                <input
                  type="email"
                  value={editWorkEmail}
                  onChange={(e) => setEditWorkEmail(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  District
                </label>
                {isEditing ? (
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      onFocus={() => setShowDistrictDropdown(true)}
                      onBlur={() => setShowDistrictDropdown(false)}
                      placeholder="Search district..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                    {showDistrictDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-sm z-10">
                        {districts
                          .filter((d) =>
                            d.district_name
                              .toLowerCase()
                              .includes(districtSearch.toLowerCase()),
                          )
                          .map((district) => (
                            <button
                              key={district.id}
                              type="button"
                              onMouseDown={() => {
                                setEditDistrict(district.district_name);
                                setDistrictSearch("");
                                setShowDistrictDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700 border-t border-gray-100 first:border-t-0"
                            >
                              {district.district_name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editDistrict}
                    disabled
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Position
                </label>
                {isEditing ? (
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={positionSearch}
                      onChange={(e) => setPositionSearch(e.target.value)}
                      onFocus={() => setShowPositionDropdown(true)}
                      onBlur={() => setShowPositionDropdown(false)}
                      placeholder="Search position..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                    {showPositionDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-sm z-10">
                        {positions
                          .filter((p) =>
                            p.position_name
                              .toLowerCase()
                              .includes(positionSearch.toLowerCase()),
                          )
                          .map((position) => (
                            <button
                              key={position.id}
                              type="button"
                              onMouseDown={() => {
                                setEditPositionId(position.id);
                                setEditPosition(position.position_name);
                                setPositionSearch("");
                                setShowPositionDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700 border-t border-gray-100 first:border-t-0"
                            >
                              {position.position_name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editPosition}
                    disabled
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  School
                </label>
                {isEditing ? (
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      onFocus={() => setShowSchoolDropdown(true)}
                      onBlur={() => setShowSchoolDropdown(false)}
                      placeholder="Search school..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                    {showSchoolDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-sm z-10">
                        {schools
                          .filter((s) =>
                            s.school_name
                              .toLowerCase()
                              .includes(schoolSearch.toLowerCase()),
                          )
                          .map((school) => (
                            <button
                              key={school.id}
                              type="button"
                              onMouseDown={() => {
                                setEditSchoolId(school.id);
                                setEditSchoolName(school.school_name);
                                setSchoolSearch("");
                                setShowSchoolDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700 border-t border-gray-100 first:border-t-0"
                            >
                              {school.school_name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editSchoolName}
                    disabled
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Plantilla Number
                </label>
                <input
                  type="text"
                  value={editPlantillaNo}
                  onChange={(e) => setEditPlantillaNo(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Employee Type
                </label>
                <select
                  value={editEmployeeType}
                  onChange={(e) =>
                    setEditEmployeeType(
                      e.target.value as "teaching" | "non-teaching",
                    )
                  }
                  disabled={!isEditing}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    isEditing
                      ? "border-gray-300 text-gray-700 cursor-pointer"
                      : "border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <option value="teaching">Teaching</option>
                  <option value="non-teaching">Non-Teaching</option>
                </select>
              </div>
            </div>
          </div>

          {isLoadingDetails ? (
            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <Loader2 size={16} className="animate-spin" />
              Loading full employee details...
            </div>
          ) : null}

          {detailsError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {detailsError}
            </div>
          ) : null}

          {errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-red-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    Validation Errors:
                  </p>
                  <ul className="space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx} className="text-sm text-red-700">
                        • <strong>{error.field}:</strong> {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {editError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {editError}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {!isEditing && canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer"
              >
                <Pencil size={15} />
                Edit Details
              </button>
            )}

            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={15} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveChanges()}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={15} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
