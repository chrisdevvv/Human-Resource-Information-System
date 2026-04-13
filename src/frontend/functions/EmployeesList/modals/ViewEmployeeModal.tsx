"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Pencil,
  XCircle,
  Save,
  X,
  AlertCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import ChangesToast from "./ChangesToast";
import ChangesConfirmation from "./ChangesConfirmation";

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

type CivilStatus = {
  id: number;
  civil_status_name: string;
};

type Sex = {
  id: number;
  sex_name: string;
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
  place_of_birth?: string | null;
  civil_status?: string | null;
  civil_status_id?: number | null;
  sex?: string | null;
  sex_id?: number | null;
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
  prc_license_no?: string | null;
  license_no_prc?: string | null;
  is_archived?: number | boolean | null;
  archived_at?: string | null;
  archived_by?: number | null;
  archived_by_name?: string | null;
  archived_by_email?: string | null;
  archived_reason?: string | null;
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
  if (value === null || value === undefined) return "N/A";
  const text = String(value).trim();
  return text ? text : "N/A";
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const computeAge = (birthdate: string | null | undefined): number | null => {
  if (!birthdate) return null;

  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;

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

const isValidDepEdEmail = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase();
  return /^[^\s@]+@deped\.gov\.ph$/.test(trimmed);
};

type InfoFieldProps = {
  label: string;
  value: string;
  isEditing?: boolean;
  children?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  errorMessage?: string | null;
};

const InfoField = ({
  label,
  value,
  isEditing = false,
  children,
  fullWidth = false,
  className = "",
  style,
  errorMessage,
}: InfoFieldProps) => {
  return (
    <div
      className={`${fullWidth ? "sm:col-span-2" : ""} ${className}`.trim()}
      style={style}
    >
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <div className="mt-1.5">
        {isEditing && children ? (
          children
        ) : (
          <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {value}
          </div>
        )}
        {isEditing && errorMessage ? (
          <p className="mt-1 text-xs font-medium text-red-600">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
};

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
  const [activeSection, setActiveSection] = useState<"personal" | "work">(
    "personal",
  );

  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editMiddleInitial, setEditMiddleInitial] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBirthdate, setEditBirthdate] = useState("");
  const [editPersonalEmail, setEditPersonalEmail] = useState("");
  const [editMobileNumber, setEditMobileNumber] = useState("");
  const [editHomeAddress, setEditHomeAddress] = useState("");
  const [editPlaceOfBirth, setEditPlaceOfBirth] = useState("");
  const [editCivilStatus, setEditCivilStatus] = useState("");
  const [editCivilStatusId, setEditCivilStatusId] = useState<number | null>(
    null,
  );
  const [editSex, setEditSex] = useState("");
  const [editSexId, setEditSexId] = useState<number | null>(null);
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
  const [editLicenseNoPrc, setEditLicenseNoPrc] = useState("");

  const [schools, setSchools] = useState<School[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [civilStatuses, setCivilStatuses] = useState<CivilStatus[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [positionSearch, setPositionSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  const [editError, setEditError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
  };

  const fallbackDetails = useMemo<EmployeeDetailsResponse | null>(() => {
    if (!employee) return null;

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

  useEffect(() => {
    if (!visible || !employee) return;

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
            setEditPlaceOfBirth(data.place_of_birth || "");
            setEditCivilStatus(data.civil_status || "");
            setEditCivilStatusId(data.civil_status_id || null);
            setEditSex(data.sex || "");
            setEditSexId(data.sex_id || null);
            setEditEmployeeNo(data.employee_no || "");
            setEditWorkEmail(data.work_email || "");
            setEditDistrict(data.district || data.work_district || "");
            setEditPosition(data.position || "");
            setEditPositionId(data.position_id || null);
            setEditPlantillaNo(data.plantilla_no || "");
            setEditEmployeeType(data.employee_type || "non-teaching");
            setEditSchoolId(data.school_id || null);
            setEditSchoolName(data.school_name || "");
            setEditLicenseNoPrc(
              data.prc_license_no || data.license_no_prc || "",
            );
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
    setErrors([]);
    setActiveSection("personal");
    loadDetails();

    return () => {
      disposed = true;
    };
  }, [employee, visible]);

  useEffect(() => {
    if (isEditing) {
      setDistrictSearch(editDistrict);
      setPositionSearch(editPosition);
      setSchoolSearch(editSchoolName);
    } else {
      setDistrictSearch("");
      setPositionSearch("");
      setSchoolSearch("");
    }
  }, [isEditing, editDistrict, editPosition, editSchoolName]);

  useEffect(() => {
    if (!visible) return;

    const loadDropdownData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

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

        const schoolsBody = (await schoolsRes.json()) as { data?: School[] };
        const positionsBody = (await positionsRes.json()) as {
          data?: Position[];
        };
        const districtsBody = (await districtsRes.json()) as {
          data?: District[];
        };

        if (schoolsRes.ok && schoolsBody.data) setSchools(schoolsBody.data);
        if (positionsRes.ok && positionsBody.data)
          setPositions(positionsBody.data);
        if (districtsRes.ok && districtsBody.data)
          setDistricts(districtsBody.data);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
      }
    };

    loadDropdownData();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const loadCivilStatusesAndSexes = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const [civilStatusesRes, sexesRes] = await Promise.all([
          fetch(`${API_BASE}/api/civil-statuses`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/api/sexes`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const civilStatusesBody = (await civilStatusesRes.json()) as {
          data?: CivilStatus[];
        };
        const sexesBody = (await sexesRes.json()) as {
          data?: Sex[];
        };

        if (civilStatusesRes.ok && civilStatusesBody.data) {
          setCivilStatuses(civilStatusesBody.data);
        }

        if (sexesRes.ok && sexesBody.data) {
          setSexes(sexesBody.data);
        }
      } catch (err) {
        console.error("Failed to load civil status/sex data:", err);
      }
    };

    loadCivilStatusesAndSexes();
  }, [visible]);

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  if (!visible || !employee) {
    return null;
  }

  const fullName = buildFullName(
    resolvedDetails?.first_name || employee.firstName,
    resolvedDetails?.middle_name || employee.middleName,
    resolvedDetails?.last_name || employee.lastName,
  );

  const ageValue =
    resolvedDetails?.age ??
    computeAge(resolvedDetails?.birthdate || employee.birthdate);
  const isArchived = Boolean(resolvedDetails?.is_archived);
  const archivedByLabel =
    resolvedDetails?.archived_by_name ||
    (resolvedDetails?.archived_by
      ? `User #${resolvedDetails.archived_by}`
      : "N/A");

  const getValidationError = (field: string): string | null =>
    errors.find((error) => error.field === field)?.message ?? null;

  const handleSaveChanges = async () => {
    setEditError(null);
    const newErrors: ValidationError[] = [];

    if (!editFirstName.trim()) {
      newErrors.push({
        field: "First Name",
        message: "First name is required",
      });
    }

    if (!editLastName.trim()) {
      newErrors.push({ field: "Last Name", message: "Last name is required" });
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

    if (!editHomeAddress.trim()) {
      newErrors.push({
        field: "Home Address",
        message: "Home address is required",
      });
    }

    if (!editPlaceOfBirth.trim()) {
      newErrors.push({
        field: "Place of Birth",
        message: "Place of birth is required",
      });
    }

    if (!editCivilStatus.trim()) {
      newErrors.push({
        field: "Civil Status",
        message: "Civil status is required",
      });
    }

    if (!editSex.trim()) {
      newErrors.push({
        field: "Sex",
        message: "Sex is required",
      });
    }

    if (!editDistrict.trim()) {
      newErrors.push({
        field: "District",
        message: "District is required",
      });
    }

    if (!editPosition.trim()) {
      newErrors.push({
        field: "Position",
        message: "Position is required",
      });
    }

    if (!editPlantillaNo.trim()) {
      newErrors.push({
        field: "Plantilla Number",
        message: "Plantilla number is required",
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
        field: "DepEd Email",
        message: "DepEd email is required",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editWorkEmail.trim())) {
      newErrors.push({
        field: "DepEd Email",
        message: "DepEd email must be a valid email",
      });
    } else if (!isValidDepEdEmail(editWorkEmail)) {
      newErrors.push({
        field: "DepEd Email",
        message: "DepEd email must end with @deped.gov.ph",
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
      showToast("Please fix the highlighted fields before saving.", "error");
      return;
    }

    setErrors([]);

    try {
      setIsSaving(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(`${API_BASE}/api/employees/${employee.id}`, {
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
          place_of_birth: editPlaceOfBirth.trim(),
          civil_status: editCivilStatus.trim(),
          civil_status_id: editCivilStatusId,
          sex: editSex.trim(),
          sex_id: editSexId,
          employee_no: editEmployeeNo.trim(),
          work_email: editWorkEmail.trim(),
          district: editDistrict.trim(),
          position: editPosition.trim(),
          position_id: editPositionId,
          plantilla_no: editPlantillaNo.trim(),
          employee_type: editEmployeeType,
          school_id: editSchoolId,
          prc_license_no: editLicenseNoPrc.trim(),
          license_no_prc: editLicenseNoPrc.trim(),
        }),
      });

      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message || "Failed to update employee");
      }

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
              place_of_birth: editPlaceOfBirth.trim(),
              civil_status: editCivilStatus.trim(),
              civil_status_id: editCivilStatusId,
              sex: editSex.trim(),
              sex_id: editSexId,
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
              prc_license_no: editLicenseNoPrc.trim(),
              license_no_prc: editLicenseNoPrc.trim(),
            }
          : null,
      );

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

      setIsEditing(false);
      showToast("Employee details updated successfully.", "success");
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update employee",
      );
      showToast("Failed to update employee details.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSaveConfirmation = () => {
    setIsSaveConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    setIsSaveConfirmOpen(false);
    void handleSaveChanges();
  };

  const handleCancelSave = () => {
    if (isSaving) return;
    setIsSaveConfirmOpen(false);
  };

  const tabClass = (tab: "personal" | "work") =>
    `w-full rounded-xl border px-3 py-2 text-sm font-semibold transition ${
      activeSection === tab
        ? "border-blue-400 bg-blue-50 text-blue-700"
        : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      {toastMessage ? (
        <ChangesToast message={toastMessage} type={toastType} />
      ) : null}
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-blue-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="show-scrollbar">
          <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                {isEditing ? `Edit Employee` : `View Employee`}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isEditing
                  ? "Update personal details first, then work details."
                  : "View personal details and work details of the employee."}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 sm:items-start sm:justify-start">
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:px-4 sm:py-2 sm:text-sm">
                  {activeSection === "personal"
                    ? "Personal Information"
                    : "Work Information"}
                </div>
                {(() => {
                  const age = computeAge(
                    resolvedDetails?.birthdate || employee?.birthdate,
                  );
                  if (age !== null && age >= 65) {
                    return (
                      <div className="inline-flex items-center gap-1 rounded-xl bg-yellow-100 px-3 py-1.5 text-xs font-bold text-orange-600 sm:px-4 sm:py-2 sm:text-sm">
                        <AlertTriangle size={14} />
                        Mandatory Retirement
                      </div>
                    );
                  }
                  if (age !== null && age >= 60) {
                    return (
                      <div className="inline-flex items-center gap-1 rounded-xl bg-yellow-100 px-3 py-1.5 text-xs font-bold text-orange-600 sm:px-4 sm:py-2 sm:text-sm">
                        <Clock size={14} />
                        Retirable
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isEditing || isSaving}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
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
              onClick={() => setActiveSection("work")}
              className={`${tabClass("work")} cursor-pointer`}
            >
              Work Information
            </button>
          </div>

          {isLoadingDetails ? (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <Loader2 size={16} className="animate-spin" />
              Loading full employee details...
            </div>
          ) : null}

          {detailsError ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {detailsError}
            </div>
          ) : null}

          {errors.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />
                <div>
                  <p className="mb-1 text-sm font-semibold text-red-800">
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
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {editError}
            </div>
          ) : null}

          {isArchived ? (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
              <div>
                <h3 className="text-lg font-bold text-amber-900">
                  Archive Information
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  This employee is currently archived.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoField
                  label="Archived At"
                  value={formatDate(resolvedDetails?.archived_at)}
                />
                <InfoField label="Archived By" value={archivedByLabel} />
              </div>
              <div className="mt-3">
                <InfoField
                  label="Archive Reason"
                  value={formatValue(resolvedDetails?.archived_reason)}
                  fullWidth
                />
              </div>
            </div>
          ) : null}

          {activeSection === "personal" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Personal Information
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {fullName} •{" "}
                  {formatEmployeeType(
                    resolvedDetails?.employee_type || employee.employeeType,
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.35fr_1.35fr_0.5fr] sm:gap-4">
                  <InfoField
                    label="Last Name"
                    value={formatValue(editLastName)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Last Name")}
                  >
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="First Name"
                    value={formatValue(editFirstName)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("First Name")}
                  >
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="Middle Name"
                    value={formatValue(editMiddleName)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Middle Name")}
                  >
                    <input
                      type="text"
                      value={editMiddleName}
                      onChange={(e) => setEditMiddleName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="M.I."
                    value={formatValue(editMiddleInitial)}
                    isEditing={isEditing}
                    className="lg:w-24"
                    errorMessage={getValidationError("M.I.")}
                  >
                    <input
                      type="text"
                      value={editMiddleInitial}
                      onChange={(e) => setEditMiddleInitial(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2.1fr_1fr_0.45fr] sm:gap-4">
                  <InfoField
                    label="Home Address"
                    value={formatValue(editHomeAddress)}
                    isEditing={isEditing}
                    fullWidth
                    className="lg:col-span-1"
                    errorMessage={getValidationError("Home Address")}
                  >
                    <input
                      type="text"
                      value={editHomeAddress}
                      onChange={(e) => setEditHomeAddress(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="Date of Birth"
                    value={formatDate(editBirthdate)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Date of Birth")}
                  >
                    <input
                      type="date"
                      value={editBirthdate}
                      onChange={(e) => setEditBirthdate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="Age"
                    value={ageValue ? String(ageValue) : "N/A"}
                    className="lg:w-24 lg:justify-self-end"
                    errorMessage={getValidationError("Age")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.25fr_1.25fr_0.5fr] sm:gap-4">
                  <InfoField
                    label="Place of Birth"
                    value={formatValue(editPlaceOfBirth)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Place of Birth")}
                  >
                    <input
                      type="text"
                      value={editPlaceOfBirth}
                      onChange={(e) => setEditPlaceOfBirth(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="Civil Status"
                    value={formatValue(editCivilStatus)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Civil Status")}
                  >
                    <div className="relative">
                      <select
                        value={
                          editCivilStatusId ? String(editCivilStatusId) : ""
                        }
                        onChange={(e) => {
                          const nextValue = e.target.value
                            ? Number(e.target.value)
                            : null;
                          const selected = civilStatuses.find(
                            (item) => item.id === nextValue,
                          );
                          setEditCivilStatusId(selected?.id ?? null);
                          setEditCivilStatus(selected?.civil_status_name || "");
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                      >
                        <option value="">Select civil status</option>
                        {civilStatuses
                          .slice()
                          .sort((a, b) =>
                            a.civil_status_name.localeCompare(
                              b.civil_status_name,
                            ),
                          )
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.civil_status_name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </InfoField>

                  <InfoField
                    label="Sex"
                    value={formatValue(editSex)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Sex")}
                  >
                    <div className="relative">
                      <select
                        value={editSexId ? String(editSexId) : ""}
                        onChange={(e) => {
                          const nextValue = e.target.value
                            ? Number(e.target.value)
                            : null;
                          const selected = sexes.find(
                            (item) => item.id === nextValue,
                          );
                          setEditSexId(selected?.id ?? null);
                          setEditSex(selected?.sex_name || "");
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                      >
                        <option value="">Select sex</option>
                        {sexes
                          .slice()
                          .sort((a, b) => a.sex_name.localeCompare(b.sex_name))
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.sex_name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </InfoField>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.25fr_0.9fr] sm:gap-4">
                  <InfoField
                    label="Personal Email"
                    value={formatValue(editPersonalEmail)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Personal Email")}
                  >
                    <input
                      type="email"
                      value={editPersonalEmail}
                      onChange={(e) => setEditPersonalEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="DepEd Email"
                    value={formatValue(editWorkEmail)}
                    isEditing={isEditing}
                    style={{ maxWidth: "30ch" }}
                    errorMessage={getValidationError("DepEd Email")}
                  >
                    <input
                      type="email"
                      value={editWorkEmail}
                      onChange={(e) => setEditWorkEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="Mobile Number"
                    value={formatValue(editMobileNumber)}
                    isEditing={isEditing}
                    style={{ maxWidth: "22ch" }}
                    errorMessage={getValidationError("Mobile Number")}
                  >
                    <input
                      type="text"
                      value={editMobileNumber}
                      onChange={(e) => {
                        const digitsOnly = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11);
                        setEditMobileNumber(digitsOnly);
                      }}
                      maxLength={11}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>
                </div>
              </div>
            </div>
          )}
          {activeSection === "work" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Work Information
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {formatValue(
                    resolvedDetails?.school_name || employee.schoolName,
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                  <InfoField
                    label="Employee Type"
                    value={formatEmployeeType(editEmployeeType)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Employee Type")}
                  >
                    <select
                      value={editEmployeeType}
                      onChange={(e) =>
                        setEditEmployeeType(
                          e.target.value as "teaching" | "non-teaching",
                        )
                      }
                      className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    >
                      <option value="teaching">Teaching</option>
                      <option value="non-teaching">Non-Teaching</option>
                    </select>
                  </InfoField>

                  <InfoField
                    label="Position"
                    value={formatValue(editPosition)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Position")}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={positionSearch}
                        onChange={(e) => setPositionSearch(e.target.value)}
                        onFocus={() => setShowPositionDropdown(true)}
                        onBlur={() => setShowPositionDropdown(false)}
                        placeholder="Position"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-xs outline-none focus:border-blue-500"
                      />
                      {showPositionDropdown && (
                        <div className="no-scrollbar absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-sm">
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
                                  setPositionSearch(position.position_name);
                                  setShowPositionDropdown(false);
                                }}
                                className="block w-full cursor-pointer border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 first:border-t-0"
                              >
                                {position.position_name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </InfoField>

                  <InfoField
                    label="Plantilla Number"
                    value={formatValue(editPlantillaNo)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Plantilla Number")}
                  >
                    <input
                      type="text"
                      value={editPlantillaNo}
                      onChange={(e) => setEditPlantillaNo(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <InfoField
                    label="District"
                    value={formatValue(editDistrict)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("District")}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        onFocus={() => setShowDistrictDropdown(true)}
                        onBlur={() => setShowDistrictDropdown(false)}
                        placeholder="District"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-xs outline-none focus:border-blue-500"
                      />
                      {showDistrictDropdown && (
                        <div className="no-scrollbar absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-sm">
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
                                  setDistrictSearch(district.district_name);
                                  setShowDistrictDropdown(false);
                                }}
                                className="block w-full cursor-pointer border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 first:border-t-0"
                              >
                                {district.district_name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </InfoField>

                  <InfoField
                    label="School Name"
                    value={formatValue(editSchoolName)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("School")}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={schoolSearch}
                        onChange={(e) => setSchoolSearch(e.target.value)}
                        onFocus={() => setShowSchoolDropdown(true)}
                        onBlur={() => setShowSchoolDropdown(false)}
                        placeholder="School"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-xs outline-none focus:border-blue-500"
                      />
                      {showSchoolDropdown && (
                        <div className="no-scrollbar absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-sm">
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
                                  setSchoolSearch(school.school_name);
                                  setShowSchoolDropdown(false);
                                }}
                                className="block w-full cursor-pointer border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 first:border-t-0"
                              >
                                {school.school_name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </InfoField>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoField
                    label="Employee Number"
                    value={formatValue(editEmployeeNo)}
                    isEditing={isEditing}
                    errorMessage={getValidationError("Employee Number")}
                  >
                    <input
                      type="text"
                      value={editEmployeeNo}
                      onChange={(e) => {
                        const digitsOnly = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 7);
                        setEditEmployeeNo(digitsOnly);
                      }}
                      maxLength={7}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>

                  <InfoField
                    label="License No PRC"
                    value={formatValue(editLicenseNoPrc)}
                    isEditing={isEditing}
                  >
                    <input
                      type="text"
                      value={editLicenseNoPrc}
                      onChange={(e) => setEditLicenseNoPrc(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                    />
                  </InfoField>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {!isEditing && canEdit && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
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
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleOpenSaveConfirmation}
                  disabled={isSaving}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={15} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <ChangesConfirmation
        visible={isSaveConfirmOpen}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        isLoading={isSaving}
      />
    </div>
  );
}
