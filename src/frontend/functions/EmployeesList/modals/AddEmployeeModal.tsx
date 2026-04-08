"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, UserPlus, XCircle } from "lucide-react";
import ConfirmationModal from "../../../super-admin/components/ConfirmationModal";

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

type AddEmployeeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (employeeName: string) => void;
};

type SchoolApiResponse = {
  data?: School[];
  message?: string;
};

type PositionApiResponse = {
  data?: Position[];
  message?: string;
};

type DistrictApiResponse = {
  data?: District[];
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
  middle_name: string;
  no_middle_name: boolean;
  last_name: string;
  middle_initial: string;
  personal_email: string;
  email: string;
  mobile_number: string;
  home_address: string;
  employee_type: "teaching" | "non-teaching";
  school_id: number;
  school_name: string;
  employee_no: string;
  work_email: string;
  district: string;
  position: string;
  position_id: number | null;
  plantilla_no: string;
  age: number;
  birthdate: string;
};

type StepKey = "personal" | "work";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const NAME_PATTERN = /^[A-Za-z.\s]+$/;
const MIDDLE_INITIAL_PATTERN = /^[A-Za-z.\s]+$/;
const MOBILE_PATTERN = /^\d{11}$/;
const EMPLOYEE_NO_PATTERN = /^\d{7}$/;

const normalizeRole = (value: unknown): string =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

const isValidEmail = (value: string): boolean => {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const formatEmployeeType = (type: string): string => {
  const normalized = String(type).toLowerCase().trim();
  if (normalized === "non-teaching") return "Non-Teaching";
  if (normalized === "teaching") return "Teaching";
  return type;
};

const computeAgeFromBirthdate = (birthdate: string): number => {
  if (!birthdate) {
    return 0;
  }

  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  const birthdayNotReached =
    monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate());

  if (birthdayNotReached) {
    age -= 1;
  }

  return Math.max(0, age);
};

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddEmployeeModalProps) {
  const [step, setStep] = useState<StepKey>("personal");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [homeAddress, setHomeAddress] = useState("");

  const [employeeNo, setEmployeeNo] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [plantillaNo, setPlantillaNo] = useState("");
  const [employeeType, setEmployeeType] = useState<"teaching" | "non-teaching">(
    "non-teaching",
  );
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
    null,
  );
  const [positionSearch, setPositionSearch] = useState("");
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(
    null,
  );
  const [districtSearch, setDistrictSearch] = useState("");
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [schoolInputValue, setSchoolInputValue] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [assignedSchoolId, setAssignedSchoolId] = useState<number | null>(null);
  const [assignedSchoolName, setAssignedSchoolName] = useState("");

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<PendingEmployeePayload | null>(null);

  const age = useMemo(() => computeAgeFromBirthdate(birthdate), [birthdate]);

  const sortedSchools = useMemo(
    () =>
      [...schools].sort((a, b) => a.school_name.localeCompare(b.school_name)),
    [schools],
  );

  const sortedPositions = useMemo(
    () =>
      [...positions].sort((a, b) =>
        a.position_name.localeCompare(b.position_name),
      ),
    [positions],
  );

  const sortedDistricts = useMemo(
    () =>
      [...districts].sort((a, b) => {
        const aNumber = Number.parseInt(a.district_name.replace(/\D/g, ""), 10);
        const bNumber = Number.parseInt(b.district_name.replace(/\D/g, ""), 10);

        if (!Number.isNaN(aNumber) && !Number.isNaN(bNumber)) {
          return aNumber - bNumber;
        }

        return a.district_name.localeCompare(b.district_name);
      }),
    [districts],
  );

  const filteredPositions = useMemo(() => {
    const query = positionSearch.trim().toLowerCase();

    if (!query) {
      return sortedPositions;
    }

    return sortedPositions.filter((item) =>
      item.position_name.toLowerCase().includes(query),
    );
  }, [sortedPositions, positionSearch]);

  const selectedPosition = useMemo(
    () => positions.find((item) => item.id === selectedPositionId) || null,
    [positions, selectedPositionId],
  );

  const filteredDistricts = useMemo(() => {
    const query = districtSearch.trim().toLowerCase();

    if (!query) {
      return sortedDistricts;
    }

    return sortedDistricts.filter((item) =>
      item.district_name.toLowerCase().includes(query),
    );
  }, [sortedDistricts, districtSearch]);

  const selectedDistrict = useMemo(
    () => districts.find((item) => item.id === selectedDistrictId) || null,
    [districts, selectedDistrictId],
  );

  const filteredSchools = useMemo(() => {
    const query = schoolInputValue.trim().toLowerCase();
    return sortedSchools.filter((school) =>
      school.school_name.trim().toLowerCase().includes(query),
    );
  }, [sortedSchools, schoolInputValue]);

  const resetState = () => {
    setStep("personal");

    setFirstName("");
    setLastName("");
    setMiddleName("");
    setMiddleInitial("");
    setBirthdate("");
    setPersonalEmail("");
    setMobileNumber("");
    setHomeAddress("");

    setEmployeeNo("");
    setWorkEmail("");
    setPlantillaNo("");
    setEmployeeType("non-teaching");
    setSelectedPositionId(null);
    setPositionSearch("");
    setShowPositionDropdown(false);
    setSelectedDistrictId(null);
    setDistrictSearch("");
    setShowDistrictDropdown(false);

    setSchoolId(null);
    setSchoolInputValue("");
    setShowSchoolDropdown(false);

    setCurrentUserRole("");
    setAssignedSchoolId(null);
    setAssignedSchoolName("");

    setSchools([]);
    setSchoolsLoading(false);
    setPositions([]);
    setPositionsLoading(false);
    setDistricts([]);
    setDistrictsLoading(false);
    setSubmitLoading(false);
    setErrorMessage(null);
    setIsConfirmOpen(false);
    setPendingPayload(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
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

        setSchools(body.data || []);
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

    const loadPositions = async () => {
      try {
        setPositionsLoading(true);
        setErrorMessage(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error(
            "No authentication token found. Please log in again.",
          );
        }

        const response = await fetch(`${API_BASE}/api/positions`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const body = (await response.json()) as PositionApiResponse;
        if (!response.ok) {
          throw new Error(body.message || "Failed to load positions");
        }

        setPositions(body.data || []);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load positions",
        );
      } finally {
        setPositionsLoading(false);
      }
    };

    loadPositions();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadDistricts = async () => {
      try {
        setDistrictsLoading(true);
        setErrorMessage(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error(
            "No authentication token found. Please log in again.",
          );
        }

        const response = await fetch(`${API_BASE}/api/districts`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const body = (await response.json()) as DistrictApiResponse;
        if (!response.ok) {
          throw new Error(body.message || "Failed to load districts");
        }

        setDistricts(body.data || []);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load districts",
        );
      } finally {
        setDistrictsLoading(false);
      }
    };

    loadDistricts();
  }, [isOpen]);

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

  if (!isOpen) {
    return null;
  }

  const validateStepOne = (): boolean => {
    const first = firstName.trim();
    const last = lastName.trim();
    const middle = middleName.trim();
    const mi = middleInitial.trim();
    const pEmail = personalEmail.trim();
    const mobile = mobileNumber.trim();
    const address = homeAddress.trim();

    if (!first || !last || !middle || !mi) {
      setErrorMessage(
        "First name, last name, middle name, and middle initial are required.",
      );
      return false;
    }

    if (
      !NAME_PATTERN.test(first) ||
      !NAME_PATTERN.test(last) ||
      !NAME_PATTERN.test(middle)
    ) {
      setErrorMessage("Names must use letters, spaces, or dots only.");
      return false;
    }

    if (!MIDDLE_INITIAL_PATTERN.test(mi)) {
      setErrorMessage("Middle initial must use letters, spaces, or dots only.");
      return false;
    }

    if (!birthdate) {
      setErrorMessage("Date of birth is required.");
      return false;
    }

    if (new Date(birthdate) > new Date()) {
      setErrorMessage("Date of birth cannot be in the future.");
      return false;
    }

    if (!age || age < 0 || age > 150) {
      setErrorMessage("Computed age is invalid. Please check date of birth.");
      return false;
    }

    if (!pEmail || !isValidEmail(pEmail)) {
      setErrorMessage("A valid personal email is required.");
      return false;
    }

    if (!mobile || !MOBILE_PATTERN.test(mobile)) {
      setErrorMessage("Mobile number must be exactly 11 digits.");
      return false;
    }

    if (!address) {
      setErrorMessage("Home address is required.");
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const resolveSchool = (): { id: number; name: string } | null => {
    if (["ADMIN", "DATA_ENCODER"].includes(currentUserRole)) {
      if (!assignedSchoolId) {
        setErrorMessage("Your account has no assigned school.");
        return null;
      }

      return {
        id: assignedSchoolId,
        name: assignedSchoolName || "Assigned school",
      };
    }

    if (!schoolId) {
      setErrorMessage("Please select a valid school from the dropdown.");
      return null;
    }

    const selectedSchool = schools.find((s) => s.id === schoolId);
    if (!selectedSchool) {
      setErrorMessage("Invalid school selection.");
      return null;
    }

    return {
      id: selectedSchool.id,
      name: selectedSchool.school_name,
    };
  };

  const validateStepTwo = (): { id: number; name: string } | null => {
    const eNo = employeeNo.trim();
    const wEmail = workEmail.trim();
    const pNo = plantillaNo.trim();

    if (!employeeType) {
      setErrorMessage("Employee type is required.");
      return null;
    }

    if (!eNo || !EMPLOYEE_NO_PATTERN.test(eNo)) {
      setErrorMessage("Employee number must be exactly 7 digits.");
      return null;
    }

    if (!wEmail || !isValidEmail(wEmail)) {
      setErrorMessage("A valid work email is required.");
      return null;
    }

    if (!selectedDistrict) {
      setErrorMessage("Please select a valid district from the dropdown.");
      return null;
    }

    if (!selectedPosition) {
      setErrorMessage("Please select a valid position from the dropdown.");
      return null;
    }

    if (!pNo) {
      setErrorMessage("Plantilla number is required.");
      return null;
    }

    const school = resolveSchool();
    if (!school) {
      return null;
    }

    setErrorMessage(null);
    return school;
  };

  const handleGoNext = () => {
    if (!validateStepOne()) {
      return;
    }

    setStep("work");
  };

  const handleGoBack = () => {
    setErrorMessage(null);
    setStep("personal");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStepOne()) {
      setStep("personal");
      return;
    }

    const school = validateStepTwo();
    if (!school) {
      setStep("work");
      return;
    }

    if (!selectedPosition) {
      setErrorMessage("Please select a valid position from the dropdown.");
      setStep("work");
      return;
    }

    const districtRecord = selectedDistrict;
    if (!districtRecord) {
      setErrorMessage("Please select a valid district from the dropdown.");
      setStep("work");
      return;
    }

    setPendingPayload({
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      no_middle_name: false,
      last_name: lastName.trim(),
      middle_initial: middleInitial.trim(),
      personal_email: personalEmail.trim(),
      email: personalEmail.trim(),
      mobile_number: mobileNumber.trim(),
      home_address: homeAddress.trim(),
      employee_type: employeeType,
      school_id: school.id,
      school_name: school.name,
      employee_no: employeeNo.trim(),
      work_email: workEmail.trim(),
      district: districtRecord.district_name,
      position: selectedPosition.position_name,
      position_id: selectedPosition.id,
      plantilla_no: plantillaNo.trim(),
      age,
      birthdate,
    });
    setIsConfirmOpen(true);
  };

  const handleConfirmAddEmployee = async () => {
    if (!pendingPayload) {
      return;
    }

    try {
      setSubmitLoading(true);
      setErrorMessage(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
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
          middle_initial: pendingPayload.middle_initial,
          personal_email: pendingPayload.personal_email,
          email: pendingPayload.email,
          mobile_number: pendingPayload.mobile_number,
          home_address: pendingPayload.home_address,
          employee_type: pendingPayload.employee_type,
          school_id: pendingPayload.school_id,
          employee_no: pendingPayload.employee_no,
          work_email: pendingPayload.work_email,
          district: pendingPayload.district,
          position: pendingPayload.position,
          position_id: pendingPayload.position_id,
          plantilla_no: pendingPayload.plantilla_no,
          age: pendingPayload.age,
          birthdate: pendingPayload.birthdate,
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
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-blue-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
              Add Employee
            </h2>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Fill out personal details first, then work details.
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:text-sm">
            Step {step === "personal" ? "1" : "2"} of 2
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div
            className={`rounded-lg border px-3 py-2 text-center text-xs font-medium sm:text-sm ${
              step === "personal"
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            Personal Information
          </div>
          <div
            className={`rounded-lg border px-3 py-2 text-center text-xs font-medium sm:text-sm ${
              step === "work"
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            Work Information
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {step === "personal" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
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
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="Dela Cruz"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="Santos"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Middle Initial
                </label>
                <input
                  type="text"
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="S"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  value={age || ""}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  placeholder="Auto computed"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Personal Email
                </label>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="name@email.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 11);
                    setMobileNumber(digitsOnly);
                  }}
                  inputMode="numeric"
                  pattern="[0-9]{11}"
                  maxLength={11}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="09123456789"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Home Address
                </label>
                <input
                  type="text"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="Street, Barangay, City"
                />
              </div>
            </div>
          )}

          {step === "work" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Employee Number
                </label>
                <input
                  type="text"
                  value={employeeNo}
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 7);
                    setEmployeeNo(digitsOnly);
                  }}
                  inputMode="numeric"
                  pattern="[0-9]{7}"
                  maxLength={7}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="1234567"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Work Email
                </label>
                <input
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="employee@deped.gov.ph"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  District
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={districtSearch}
                    onChange={(e) => {
                      setDistrictSearch(e.target.value);
                      setShowDistrictDropdown(true);
                      setSelectedDistrictId(null);
                    }}
                    onFocus={() => setShowDistrictDropdown(true)}
                    onBlur={() => {
                      window.setTimeout(
                        () => setShowDistrictDropdown(false),
                        150,
                      );
                    }}
                    disabled={districtsLoading}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder={
                      districtsLoading
                        ? "Loading districts..."
                        : "Type to search district..."
                    }
                  />

                  {showDistrictDropdown && (
                    <div className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-blue-200 bg-white shadow-lg">
                      {districtsLoading ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          Loading districts...
                        </div>
                      ) : sortedDistricts.length === 0 ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          No districts available
                        </div>
                      ) : filteredDistricts.length > 0 ? (
                        filteredDistricts.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setSelectedDistrictId(item.id);
                              setDistrictSearch(item.district_name);
                              setShowDistrictDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm transition hover:bg-blue-50 ${
                              selectedDistrictId === item.id
                                ? "bg-blue-100 font-medium text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
                            {item.district_name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          No districts match &quot;{districtSearch}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Position
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={positionSearch}
                    onChange={(e) => {
                      setPositionSearch(e.target.value);
                      setShowPositionDropdown(true);
                      setSelectedPositionId(null);
                    }}
                    onFocus={() => setShowPositionDropdown(true)}
                    onBlur={() => {
                      window.setTimeout(
                        () => setShowPositionDropdown(false),
                        150,
                      );
                    }}
                    disabled={positionsLoading}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder={
                      positionsLoading
                        ? "Loading positions..."
                        : "Type to search position..."
                    }
                  />

                  {showPositionDropdown && (
                    <div className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-blue-200 bg-white shadow-lg">
                      {positionsLoading ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          Loading positions...
                        </div>
                      ) : sortedPositions.length === 0 ? (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          No positions available
                        </div>
                      ) : filteredPositions.length > 0 ? (
                        filteredPositions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setSelectedPositionId(item.id);
                              setPositionSearch(item.position_name);
                              setShowPositionDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm transition hover:bg-blue-50 ${
                              selectedPositionId === item.id
                                ? "bg-blue-100 font-medium text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
                            {item.position_name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-sm text-gray-500">
                          No positions match &quot;{positionSearch}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                        // Delay close so users can click an option.
                        window.setTimeout(
                          () => setShowSchoolDropdown(false),
                          150,
                        );
                      }}
                      disabled={schoolsLoading}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                      placeholder={
                        schoolsLoading
                          ? "Loading schools..."
                          : "Type to search schools..."
                      }
                    />
                    {showSchoolDropdown && (
                      <div className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-blue-200 bg-white shadow-lg">
                        {schoolsLoading ? (
                          <div className="px-4 py-3 text-center text-sm text-gray-500">
                            Loading schools...
                          </div>
                        ) : schools.length === 0 ? (
                          <div className="px-4 py-3 text-center text-sm text-gray-500">
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
                              className={`w-full px-4 py-2 text-left text-sm transition hover:bg-blue-50 ${
                                schoolId === school.id
                                  ? "bg-blue-100 font-medium text-blue-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {school.school_name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-sm text-gray-500">
                            No schools match &quot;{schoolInputValue}&quot;
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {schoolId && currentUserRole === "SUPER_ADMIN" && (
                  <p className="mt-1 text-xs text-green-700">
                    Selected school is valid.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Plantilla Number
                </label>
                <input
                  type="text"
                  value={plantillaNo}
                  onChange={(e) => setPlantillaNo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="PL-0001"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Employee Type
                </label>
                <select
                  value={employeeType}
                  onChange={(e) =>
                    setEmployeeType(
                      e.target.value as "teaching" | "non-teaching",
                    )
                  }
                  className="mt-1 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="teaching">Teaching</option>
                  <option value="non-teaching">Non-Teaching</option>
                </select>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              disabled={submitLoading || isConfirmOpen}
            >
              <span className="inline-flex items-center gap-1">
                <XCircle size={14} />
                Cancel
              </span>
            </button>

            {step === "work" && (
              <button
                type="button"
                onClick={handleGoBack}
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                disabled={submitLoading || isConfirmOpen}
              >
                <span className="inline-flex items-center gap-1">
                  <ChevronLeft size={14} />
                  Back
                </span>
              </button>
            )}

            {step === "personal" ? (
              <button
                type="button"
                onClick={handleGoNext}
                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                disabled={submitLoading || isConfirmOpen}
              >
                <span className="inline-flex items-center gap-1">
                  Next
                  <ChevronRight size={14} />
                </span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitLoading || isConfirmOpen || schoolsLoading}
                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-1">
                  <UserPlus size={14} />
                  {submitLoading ? "Saving..." : "Add Employee"}
                </span>
              </button>
            )}
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
            <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-800">Name:</span>{" "}
                {pendingPayload.first_name} {pendingPayload.middle_name}{" "}
                {pendingPayload.last_name}
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  Personal Email:
                </span>{" "}
                {pendingPayload.personal_email}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Work Email:</span>{" "}
                {pendingPayload.work_email}
              </p>
              <p>
                <span className="font-semibold text-gray-800">
                  Employee No:
                </span>{" "}
                {pendingPayload.employee_no}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Position:</span>{" "}
                {pendingPayload.position}
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
