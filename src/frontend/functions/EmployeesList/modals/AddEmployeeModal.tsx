"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, UserPlus, XCircle } from "lucide-react";
import ConfirmationModal from "../../../super-admin/components/ConfirmationModal";
import { createClearHandler } from "../../../utils/clearFormUtils";

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

type CivilStatusApiResponse = {
  data?: CivilStatus[];
  message?: string;
};

type SexApiResponse = {
  data?: Sex[];
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
  error?: string;
};

type EmployeeRecordResponse = {
  data?: Array<
    Partial<PendingEmployeePayload> & {
      id?: number;
    }
  >;
  message?: string;
};

type EmployeeDetailsRecordResponse = {
  data?: Partial<PendingEmployeePayload> & {
    id?: number;
  };
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
  place_of_birth: string;
  civil_status: string;
  civil_status_id: number | null;
  sex: string;
  sex_id: number | null;
  employee_type: "teaching" | "non-teaching" | "teaching-related";
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
  prc_license_no: string;
  license_no_prc: string;
  tin: string;
  gsis_bp_no: string;
  gsis_crn_no: string;
  pagibig_no: string;
  philhealth_no: string;
  date_of_first_appointment: string;
};

type StepKey = "personal" | "work" | "salary";

type ValidationError = {
  field: string;
  message: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const NAME_PATTERN = /^[A-Za-z.\s]+$/;
const MIDDLE_INITIAL_PATTERN = /^[A-Z.]{1,2}$/;
const MOBILE_PATTERN = /^\d{11}$/;
const EMPLOYEE_NO_PATTERN = /^\d{7}$/;
type IdMaskConfig = {
  maxDigits: number;
  groups: number[];
};

const GOV_ID_MASKS = {
  tin: { maxDigits: 9, groups: [3, 3, 3] },
  gsisBpNo: { maxDigits: 11, groups: [2, 7, 2] },
  gsisCrnNo: { maxDigits: 12, groups: [4, 4, 4] },
  pagibigNo: { maxDigits: 12, groups: [4, 4, 4] },
  philhealthNo: { maxDigits: 12, groups: [2, 9, 1] },
} as const satisfies Record<string, IdMaskConfig>;

const stripToDigits = (value: string): string => value.replace(/\D/g, "");
const stripToAlphaNumericUpper = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
const normalizeMiddleInitialInput = (value: string): string =>
  value
    .replace(/[^a-zA-Z.]/g, "")
    .toUpperCase()
    .slice(0, 2);

const formatMaskedId = (value: string, config: IdMaskConfig): string => {
  const digits = stripToDigits(value).slice(0, config.maxDigits);
  const chunks: string[] = [];
  let cursor = 0;

  for (const groupSize of config.groups) {
    if (cursor >= digits.length) break;
    const chunk = digits.slice(cursor, cursor + groupSize);
    if (!chunk) break;
    chunks.push(chunk);
    cursor += groupSize;
  }

  return chunks.join("-");
};

const formatGsisBp = (value: string): string => {
  const compact = stripToAlphaNumericUpper(value).slice(0, 11);
  if (compact.length <= 5) {
    return compact;
  }
  return `${compact.slice(0, 5)}-${compact.slice(5)}`;
};

const isGsisBpValid = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized || normalized.toUpperCase() === "N/A") {
    return true;
  }
  return /^[A-Z0-9]{5}-[A-Z0-9]{6}$/.test(normalized);
};

const normalizePhilhealth = (value: string): string =>
  stripToDigits(value).slice(0, 12);

const normalize12Digits = (value: string): string =>
  stripToDigits(value).slice(0, 12);

const normalizeUniqueIdentifier = (value: string): string =>
  value.trim().toUpperCase().replace(/[\s-]/g, "");

const hasComparableUniqueValue = (value: string): boolean => {
  const normalized = value.trim();
  return Boolean(normalized) && normalized.toUpperCase() !== "N/A";
};

const isPhilhealthValid = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized || normalized.toUpperCase() === "N/A") {
    return true;
  }
  return /^\d{12}$/.test(normalized);
};

const isGovernmentIdValid = (value: string, config: IdMaskConfig): boolean => {
  const normalized = value.trim();
  if (!normalized || normalized.toUpperCase() === "N/A") {
    return true;
  }

  const expected = formatMaskedId(normalized, config);
  return (
    normalized === expected &&
    stripToDigits(normalized).length === config.maxDigits
  );
};

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

const isValidDepEdEmail = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase();
  return /^[^\s@]+@deped\.gov\.ph$/.test(trimmed);
};

const formatEmployeeType = (type: string): string => {
  const normalized = String(type).toLowerCase().trim();
  if (normalized === "non-teaching") return "Non-Teaching";
  if (normalized === "teaching") return "Teaching";
  if (normalized === "teaching-related") return "Teaching-Related";
  return type;
};

const computeAgeFromBirthdate = (birthdate: string): number => {
  if (!birthdate) return 0;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
};

const isValidDateValue = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return !Number.isNaN(new Date(trimmed).getTime());
};

const formatYearsInService = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "N/A";
  }
  const text = String(value).trim();
  return text ? text : "N/A";
};

const formatLoyaltyBonus = (
  value: string | number | boolean | null | undefined,
): string => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (value === 1) return "Yes";
    if (value === 0) return "No";
    return "N/A";
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return "N/A";
  if (["yes", "true", "1"].includes(normalized)) return "Yes";
  if (["no", "false", "0"].includes(normalized)) return "No";
  return "N/A";
};

const computeServiceMetrics = (
  dateOfFirstAppointment: string | null | undefined,
): { yearsInService: number | null; loyaltyBonus: "Yes" | "No" } => {
  const normalizedDate = String(dateOfFirstAppointment || "").trim();
  if (!normalizedDate) {
    return { yearsInService: null, loyaltyBonus: "No" };
  }

  const [yearPart, monthPart, dayPart] = normalizedDate.split("-").map(Number);
  if (!yearPart || !monthPart || !dayPart) {
    return { yearsInService: null, loyaltyBonus: "No" };
  }

  const now = new Date();
  let years = now.getFullYear() - yearPart;
  const hasReachedAnniversary =
    now.getMonth() + 1 > monthPart ||
    (now.getMonth() + 1 === monthPart && now.getDate() >= dayPart);

  if (!hasReachedAnniversary) {
    years -= 1;
  }

  const yearsInService = Math.max(0, years);
  const loyaltyBonus =
    yearsInService > 0 && yearsInService % 5 === 0 ? "Yes" : "No";

  return { yearsInService, loyaltyBonus };
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
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [birthdate, setBirthdate] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [selectedCivilStatusId, setSelectedCivilStatusId] = useState<
    number | null
  >(null);
  const [selectedSexId, setSelectedSexId] = useState<number | null>(null);

  const [employeeNo, setEmployeeNo] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [plantillaNo, setPlantillaNo] = useState("");
  const [employeeType, setEmployeeType] = useState<
    "teaching" | "non-teaching" | "teaching-related"
  >("non-teaching");
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
  const [licenseNoPrc, setLicenseNoPrc] = useState("");
  const [tin, setTin] = useState("");
  const [gsisBpNo, setGsisBpNo] = useState("");
  const [gsisCrnNo, setGsisCrnNo] = useState("");
  const [pagibigNo, setPagibigNo] = useState("");
  const [philhealthNo, setPhilhealthNo] = useState("");
  const [dateOfFirstAppointment, setDateOfFirstAppointment] = useState("");
  const [tinNotAvailable, setTinNotAvailable] = useState(false);
  const [gsisBpNotAvailable, setGsisBpNotAvailable] = useState(false);
  const [gsisCrnNotAvailable, setGsisCrnNotAvailable] = useState(false);
  const [pagibigNotAvailable, setPagibigNotAvailable] = useState(false);
  const [philhealthNotAvailable, setPhilhealthNotAvailable] = useState(false);

  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [civilStatuses, setCivilStatuses] = useState<CivilStatus[]>([]);
  const [civilStatusesLoading, setCivilStatusesLoading] = useState(false);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [sexesLoading, setSexesLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<PendingEmployeePayload | null>(null);

  const age = useMemo(() => computeAgeFromBirthdate(birthdate), [birthdate]);
  const computedSalaryMetrics = useMemo(
    () => computeServiceMetrics(dateOfFirstAppointment),
    [dateOfFirstAppointment],
  );

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
        if (!Number.isNaN(aNumber) && !Number.isNaN(bNumber))
          return aNumber - bNumber;
        return a.district_name.localeCompare(b.district_name);
      }),
    [districts],
  );

  const sortedCivilStatuses = useMemo(
    () =>
      [...civilStatuses].sort((a, b) =>
        a.civil_status_name.localeCompare(b.civil_status_name),
      ),
    [civilStatuses],
  );

  const sortedSexes = useMemo(
    () => [...sexes].sort((a, b) => a.sex_name.localeCompare(b.sex_name)),
    [sexes],
  );

  const filteredPositions = useMemo(() => {
    const query = positionSearch.trim().toLowerCase();
    return query
      ? sortedPositions.filter((item) =>
          item.position_name.toLowerCase().includes(query),
        )
      : sortedPositions;
  }, [positionSearch, sortedPositions]);

  const filteredDistricts = useMemo(() => {
    const query = districtSearch.trim().toLowerCase();
    return query
      ? sortedDistricts.filter((item) =>
          item.district_name.toLowerCase().includes(query),
        )
      : sortedDistricts;
  }, [districtSearch, sortedDistricts]);

  const filteredSchools = useMemo(() => {
    const query = schoolInputValue.trim().toLowerCase();
    return sortedSchools.filter((school) =>
      school.school_name.trim().toLowerCase().includes(query),
    );
  }, [sortedSchools, schoolInputValue]);

  const selectedPosition = useMemo(
    () => positions.find((item) => item.id === selectedPositionId) || null,
    [positions, selectedPositionId],
  );
  const selectedDistrict = useMemo(
    () => districts.find((item) => item.id === selectedDistrictId) || null,
    [districts, selectedDistrictId],
  );
  const selectedCivilStatus = useMemo(
    () =>
      civilStatuses.find((item) => item.id === selectedCivilStatusId) || null,
    [civilStatuses, selectedCivilStatusId],
  );
  const selectedSex = useMemo(
    () => sexes.find((item) => item.id === selectedSexId) || null,
    [sexes, selectedSexId],
  );

  const getFieldError = (field: string): string | null =>
    validationErrors.find((error) => error.field === field)?.message ?? null;
  const renderFieldError = (field: string) => {
    const message = getFieldError(field);
    return message ? (
      <p className="mt-1 text-xs font-medium text-red-600">{message}</p>
    ) : null;
  };

  const resetState = () => {
    setStep("personal");
    setFirstName("");
    setLastName("");
    setMiddleName("");
    setMiddleInitial("");
    setNoMiddleName(false);
    setBirthdate("");
    setPersonalEmail("");
    setMobileNumber("");
    setHomeAddress("");
    setPlaceOfBirth("");
    setSelectedCivilStatusId(null);
    setSelectedSexId(null);
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
    setLicenseNoPrc("");
    setTin("");
    setGsisBpNo("");
    setGsisCrnNo("");
    setPagibigNo("");
    setPhilhealthNo("");
    setDateOfFirstAppointment("");
    setTinNotAvailable(false);
    setGsisBpNotAvailable(false);
    setGsisCrnNotAvailable(false);
    setPagibigNotAvailable(false);
    setPhilhealthNotAvailable(false);
    setSchools([]);
    setSchoolsLoading(false);
    setPositions([]);
    setPositionsLoading(false);
    setDistricts([]);
    setDistrictsLoading(false);
    setCivilStatuses([]);
    setCivilStatusesLoading(false);
    setSexes([]);
    setSexesLoading(false);
    setSubmitLoading(false);
    setErrorMessage(null);
    setValidationErrors([]);
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

    const loadCivilStatusesAndSexes = async () => {
      try {
        setCivilStatusesLoading(true);
        setSexesLoading(true);
        setErrorMessage(null);

        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error(
            "No authentication token found. Please log in again.",
          );
        }

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

        const civilStatusesBody =
          (await civilStatusesRes.json()) as CivilStatusApiResponse;
        const sexesBody = (await sexesRes.json()) as SexApiResponse;

        if (!civilStatusesRes.ok) {
          throw new Error(
            civilStatusesBody.message || "Failed to load civil statuses",
          );
        }

        if (!sexesRes.ok) {
          throw new Error(sexesBody.message || "Failed to load sexes");
        }

        setCivilStatuses(civilStatusesBody.data || []);
        setSexes(sexesBody.data || []);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load lookup data",
        );
      } finally {
        setCivilStatusesLoading(false);
        setSexesLoading(false);
      }
    };

    loadCivilStatusesAndSexes();
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
    const fieldErrors: ValidationError[] = [];
    const first = firstName.trim();
    const last = lastName.trim();
    const middle = middleName.trim();
    const mi = normalizeMiddleInitialInput(middleInitial.trim());
    const pEmail = personalEmail.trim();
    const mobile = mobileNumber.trim();
    const address = homeAddress.trim();

    if (!first) {
      fieldErrors.push({
        field: "First Name",
        message: "First name is required.",
      });
    }

    if (!last) {
      fieldErrors.push({
        field: "Last Name",
        message: "Last name is required.",
      });
    }

    if (!noMiddleName && !middle) {
      fieldErrors.push({
        field: "Middle Name",
        message: "Middle name is required unless not applicable.",
      });
    }

    if (!noMiddleName && !mi) {
      fieldErrors.push({
        field: "M.I.",
        message: "M.I. is required unless not applicable.",
      });
    }

    if (first && !NAME_PATTERN.test(first)) {
      fieldErrors.push({
        field: "First Name",
        message: "First name must use letters, spaces, or dots only.",
      });
    }

    if (last && !NAME_PATTERN.test(last)) {
      fieldErrors.push({
        field: "Last Name",
        message: "Last name must use letters, spaces, or dots only.",
      });
    }

    if (!noMiddleName && middle && !NAME_PATTERN.test(middle)) {
      fieldErrors.push({
        field: "Middle Name",
        message: "Middle name must use letters, spaces, or dots only.",
      });
    }

    if (!noMiddleName && mi && !MIDDLE_INITIAL_PATTERN.test(mi)) {
      fieldErrors.push({
        field: "M.I.",
        message: "M.I. must be letters/dots only, max 2 characters.",
      });
    }

    if (!birthdate) {
      fieldErrors.push({
        field: "Date of Birth",
        message: "Date of birth is required.",
      });
    }

    if (birthdate && new Date(birthdate) > new Date()) {
      fieldErrors.push({
        field: "Date of Birth",
        message: "Date of birth cannot be in the future.",
      });
    }

    if (birthdate && (!age || age < 0 || age > 150)) {
      fieldErrors.push({
        field: "Age",
        message: "Computed age is invalid. Please check date of birth.",
      });
    }

    if (!pEmail || !isValidEmail(pEmail)) {
      fieldErrors.push({
        field: "Personal Email",
        message: "A valid personal email is required.",
      });
    }

    if (!workEmail.trim() || !isValidEmail(workEmail.trim())) {
      fieldErrors.push({
        field: "DepEd Email",
        message: "A valid DepEd email is required.",
      });
    } else if (!isValidDepEdEmail(workEmail)) {
      fieldErrors.push({
        field: "DepEd Email",
        message: "DepEd email must end with @deped.gov.ph.",
      });
    }

    if (!mobile || !MOBILE_PATTERN.test(mobile)) {
      fieldErrors.push({
        field: "Mobile Number",
        message: "Mobile number must be exactly 11 digits.",
      });
    }

    if (!address) {
      fieldErrors.push({
        field: "Home Address",
        message: "Home address is required.",
      });
    }

    if (!placeOfBirth.trim()) {
      fieldErrors.push({
        field: "Place of Birth",
        message: "Place of birth is required.",
      });
    }

    if (!selectedCivilStatus) {
      fieldErrors.push({
        field: "Civil Status",
        message: "Civil status is required.",
      });
    }

    if (!selectedSex) {
      fieldErrors.push({
        field: "Sex",
        message: "Sex is required.",
      });
    }

    if (fieldErrors.length > 0) {
      setValidationErrors(fieldErrors);
      setErrorMessage(null);
      return false;
    }

    setValidationErrors([]);
    setErrorMessage(null);
    return true;
  };

  const resolveSchool = (
    fieldErrors: ValidationError[],
  ): { id: number; name: string } | null => {
    if (["ADMIN", "DATA_ENCODER"].includes(currentUserRole)) {
      if (!assignedSchoolId) {
        fieldErrors.push({
          field: "School",
          message: "Your account has no assigned school.",
        });
        return null;
      }

      return {
        id: assignedSchoolId,
        name: assignedSchoolName || "Assigned school",
      };
    }

    if (!schoolId) {
      fieldErrors.push({
        field: "School",
        message: "Please select a valid school from the dropdown.",
      });
      return null;
    }

    const selectedSchool = schools.find((s) => s.id === schoolId);
    if (!selectedSchool) {
      fieldErrors.push({
        field: "School",
        message: "Invalid school selection.",
      });
      return null;
    }

    return {
      id: selectedSchool.id,
      name: selectedSchool.school_name,
    };
  };

  const validateStepTwo = (): { id: number; name: string } | null => {
    const fieldErrors: ValidationError[] = [];
    const eNo = employeeNo.trim();
    const wEmail = workEmail.trim();
    const pNo = plantillaNo.trim();

    if (!employeeType) {
      fieldErrors.push({
        field: "Employee Type",
        message: "Employee type is required.",
      });
    }

    if (!eNo || !EMPLOYEE_NO_PATTERN.test(eNo)) {
      fieldErrors.push({
        field: "Employee Number",
        message: "Employee number must be exactly 7 digits.",
      });
    }

    if (!selectedDistrict) {
      fieldErrors.push({
        field: "District",
        message: "Please select a valid district from the dropdown.",
      });
    }

    if (!selectedPosition) {
      fieldErrors.push({
        field: "Position",
        message: "Please select a valid position from the dropdown.",
      });
    }

    if (!pNo) {
      fieldErrors.push({
        field: "Plantilla Number",
        message: "Plantilla number is required.",
      });
    }

    if (!isGovernmentIdValid(tin, GOV_ID_MASKS.tin)) {
      fieldErrors.push({
        field: "TIN",
        message: "TIN must follow 000-000-000 format.",
      });
    }

    if (!isGsisBpValid(gsisBpNo)) {
      fieldErrors.push({
        field: "GSIS BP Number",
        message: "GSIS BP Number must follow 00000-000000 format.",
      });
    }

    if (!isPhilhealthValid(philhealthNo)) {
      fieldErrors.push({
        field: "PhilHealth Number",
        message: "PhilHealth Number must be exactly 12 digits.",
      });
    }

    const school = resolveSchool(fieldErrors);
    if (!school) {
      setValidationErrors(fieldErrors);
      setErrorMessage(null);
      return null;
    }

    if (fieldErrors.length > 0) {
      setValidationErrors(fieldErrors);
      setErrorMessage(null);
      return null;
    }

    setValidationErrors([]);
    setErrorMessage(null);
    return school;
  };

  const validateStepThree = (): boolean => {
    const fieldErrors: ValidationError[] = [];

    if (!dateOfFirstAppointment.trim()) {
      fieldErrors.push({
        field: "Date of First Appointment",
        message: "Date of First Appointment is required.",
      });
    }

    if (!isValidDateValue(dateOfFirstAppointment)) {
      fieldErrors.push({
        field: "Date of First Appointment",
        message: "Date of First Appointment must be a valid date.",
      });
    }

    if (dateOfFirstAppointment) {
      const appointmentDate = new Date(dateOfFirstAppointment);
      const today = new Date();
      if (appointmentDate > today) {
        fieldErrors.push({
          field: "Date of First Appointment",
          message: "Date of First Appointment cannot be in the future.",
        });
      }
    }

    if (fieldErrors.length > 0) {
      setValidationErrors(fieldErrors);
      setErrorMessage(null);
      return false;
    }

    setValidationErrors([]);
    setErrorMessage(null);
    return true;
  };

  const handleGoNext = () => {
    if (step === "personal") {
      if (!validateStepOne()) {
        return;
      }
      setStep("work");
      return;
    }

    if (step === "work") {
      if (!validateStepTwo()) {
        return;
      }
      setStep("salary");
    }
  };

  const handleGoBack = () => {
    setErrorMessage(null);
    setValidationErrors([]);
    if (step === "salary") {
      setStep("work");
      return;
    }
    setStep("personal");
  };

  const checkUniqueIdentifiers = async (): Promise<ValidationError[]> => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return [
        {
          field: "Work Information",
          message: "Unable to validate unique fields. Please log in again.",
        },
      ];
    }

    const uniqueTargets = [
      { field: "Employee Number", key: "employee_no", value: employeeNo },
      { field: "Plantilla Number", key: "plantilla_no", value: plantillaNo },
      { field: "License No PRC", key: "prc_license_no", value: licenseNoPrc },
      { field: "TIN", key: "tin", value: tin },
      { field: "GSIS BP Number", key: "gsis_bp_no", value: gsisBpNo },
      { field: "GSIS CRN Number", key: "gsis_crn_no", value: gsisCrnNo },
      { field: "PAG-IBIG Number", key: "pagibig_no", value: pagibigNo },
      { field: "PhilHealth Number", key: "philhealth_no", value: philhealthNo },
    ] as const;

    try {
      const listResponse = await fetch(`${API_BASE}/api/employees/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const listBody = (await listResponse.json()) as EmployeeRecordResponse;
      if (!listResponse.ok) {
        return [
          {
            field: "Work Information",
            message:
              listBody.message ||
              "Unable to validate unique fields. Please try again.",
          },
        ];
      }

      let employees = Array.isArray(listBody.data) ? listBody.data : [];
      const hasUniqueFieldsInList = employees.some(
        (row) =>
          row.employee_no !== undefined ||
          row.plantilla_no !== undefined ||
          row.prc_license_no !== undefined ||
          row.tin !== undefined ||
          row.gsis_bp_no !== undefined ||
          row.gsis_crn_no !== undefined ||
          row.pagibig_no !== undefined ||
          row.philhealth_no !== undefined,
      );

      if (!hasUniqueFieldsInList) {
        const ids = employees
          .map((row) => Number(row.id))
          .filter((id) => Number.isFinite(id) && id > 0);

        const detailResponses = await Promise.all(
          ids.map(async (id) => {
            const response = await fetch(`${API_BASE}/api/employees/${id}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            if (!response.ok) return null;
            const body = (await response
              .json()
              .catch(() => ({}))) as EmployeeDetailsRecordResponse;
            return body.data || null;
          }),
        );

        employees = detailResponses.filter(
          (row): row is NonNullable<typeof row> => Boolean(row),
        );
      }

      const duplicateErrors: ValidationError[] = [];

      for (const target of uniqueTargets) {
        if (!hasComparableUniqueValue(target.value)) {
          continue;
        }

        const targetNormalized = normalizeUniqueIdentifier(target.value);
        const isDuplicate = employees.some((row) => {
          const candidate = String(row[target.key] || "").trim();
          if (!hasComparableUniqueValue(candidate)) {
            return false;
          }
          return normalizeUniqueIdentifier(candidate) === targetNormalized;
        });

        if (isDuplicate) {
          duplicateErrors.push({
            field: target.field,
            message: `${target.field} already exists. Please use a unique value.`,
          });
        }
      }

      return duplicateErrors;
    } catch {
      return [
        {
          field: "Work Information",
          message: "Unable to validate unique fields. Please try again.",
        },
      ];
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleAddEmployee = async () => {
    // Never allow submit flow before the final salary step.
    if (step !== "salary") {
      return;
    }

    if (!validateStepOne()) {
      setStep("personal");
      return;
    }

    const school = validateStepTwo();
    if (!school) {
      setStep("work");
      return;
    }

    if (!validateStepThree()) {
      setStep("salary");
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

    const civilStatusRecord = selectedCivilStatus;
    if (!civilStatusRecord) {
      setErrorMessage("Civil status is required.");
      setStep("personal");
      return;
    }

    const sexRecord = selectedSex;
    if (!sexRecord) {
      setErrorMessage("Sex is required.");
      setStep("personal");
      return;
    }

    const duplicateErrors = await checkUniqueIdentifiers();
    if (duplicateErrors.length > 0) {
      setValidationErrors(duplicateErrors);
      setErrorMessage(null);
      setStep("work");
      return;
    }

    setPendingPayload({
      first_name: firstName.trim(),
      middle_name: noMiddleName ? "N/A" : middleName.trim(),
      no_middle_name: noMiddleName,
      last_name: lastName.trim(),
      middle_initial: noMiddleName
        ? "N/A"
        : normalizeMiddleInitialInput(middleInitial.trim()),
      personal_email: personalEmail.trim(),
      email: personalEmail.trim(),
      mobile_number: mobileNumber.trim(),
      home_address: homeAddress.trim(),
      place_of_birth: placeOfBirth.trim(),
      civil_status: civilStatusRecord.civil_status_name,
      civil_status_id: civilStatusRecord.id,
      sex: sexRecord.sex_name,
      sex_id: sexRecord.id,
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
      prc_license_no: licenseNoPrc.trim(),
      license_no_prc: licenseNoPrc.trim(),
      tin: tin.trim(),
      gsis_bp_no: gsisBpNo.trim(),
      gsis_crn_no: gsisCrnNo.trim(),
      pagibig_no: pagibigNo.trim(),
      philhealth_no: philhealthNo.trim(),
      date_of_first_appointment: dateOfFirstAppointment.trim(),
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
          place_of_birth: pendingPayload.place_of_birth,
          civil_status: pendingPayload.civil_status,
          civil_status_id: pendingPayload.civil_status_id,
          sex: pendingPayload.sex,
          sex_id: pendingPayload.sex_id,
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
          prc_license_no: pendingPayload.prc_license_no,
          license_no_prc: pendingPayload.license_no_prc,
          tin: pendingPayload.tin,
          gsis_bp_no: pendingPayload.gsis_bp_no,
          gsis_crn_no: pendingPayload.gsis_crn_no,
          pagibig_no: pendingPayload.pagibig_no,
          philhealth_no: pendingPayload.philhealth_no,
          date_of_first_appointment:
            pendingPayload.date_of_first_appointment || null,
        }),
      });

      const body = (await response.json()) as CreateEmployeeResponse;
      if (!response.ok) {
        throw new Error(
          body.message || body.error || "Failed to create employee",
        );
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

  const handleClearAllFields = () => {
    // Reset personal information fields
    setFirstName("");
    setLastName("");
    setMiddleName("");
    setMiddleInitial("");
    setNoMiddleName(false);
    setBirthdate("");
    setPersonalEmail("");
    setMobileNumber("");
    setHomeAddress("");
    setPlaceOfBirth("");
    setSelectedCivilStatusId(null);
    setSelectedSexId(null);

    // Reset work information fields
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

    // Reset government IDs
    setLicenseNoPrc("");
    setTin("");
    setGsisBpNo("");
    setGsisCrnNo("");
    setPagibigNo("");
    setPhilhealthNo("");
    setDateOfFirstAppointment("");
    setTinNotAvailable(false);
    setGsisBpNotAvailable(false);
    setGsisCrnNotAvailable(false);
    setPagibigNotAvailable(false);
    setPhilhealthNotAvailable(false);

    // Reset form state
    setStep("personal");
    setErrorMessage(null);
    setValidationErrors([]);
    setIsConfirmOpen(false);
    setPendingPayload(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-blue-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
              Add Employee
            </h2>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Fill out personal, work, and salary details.
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:text-sm">
            Step {step === "personal" ? "1" : step === "work" ? "2" : "3"} of 3
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
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
          <div
            className={`rounded-lg border px-3 py-2 text-center text-xs font-medium sm:text-sm ${
              step === "salary"
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
          >
            Salary Information
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {step === "personal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.35fr_1.35fr_0.5fr] sm:gap-4">
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
                  {renderFieldError("Last Name")}
                </div>

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
                  {renderFieldError("First Name")}
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
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder="Santos"
                  />
                  {renderFieldError("Middle Name")}
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={noMiddleName}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNoMiddleName(checked);
                        if (checked) {
                          setMiddleName("N/A");
                          setMiddleInitial("N/A");
                        } else {
                          setMiddleName("");
                          setMiddleInitial("");
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    I don&apos;t have a middle name
                  </label>
                </div>

                <div className="lg:w-24">
                  <label className="text-sm font-medium text-gray-700">
                    M.I.
                  </label>
                  <input
                    type="text"
                    value={middleInitial}
                    onChange={(e) =>
                      setMiddleInitial(
                        normalizeMiddleInitialInput(e.target.value),
                      )
                    }
                    disabled={noMiddleName}
                    maxLength={2}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                    placeholder="S"
                  />
                  {renderFieldError("M.I.")}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2.1fr_1fr_0.45fr] sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium text-gray-700">
                    Home Address
                  </label>
                  <textarea
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap wrap-break-word"
                    placeholder="Street, Barangay, City"
                  />
                  {renderFieldError("Home Address")}
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
                  {renderFieldError("Date of Birth")}
                </div>

                <div className="lg:w-24 lg:justify-self-end">
                  <label className="text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age || ""}
                    readOnly
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                    placeholder="Auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.25fr_1.25fr_0.5fr] sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Place of Birth
                  </label>
                  <input
                    type="text"
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                    placeholder="City / Municipality"
                  />
                  {renderFieldError("Place of Birth")}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Civil Status
                  </label>
                  <select
                    value={
                      selectedCivilStatusId ? String(selectedCivilStatusId) : ""
                    }
                    onChange={(e) => {
                      const nextValue = e.target.value
                        ? Number(e.target.value)
                        : null;
                      setSelectedCivilStatusId(
                        Number.isFinite(nextValue) ? nextValue : null,
                      );
                    }}
                    disabled={civilStatusesLoading}
                    className="mt-1 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">
                      {civilStatusesLoading
                        ? "Loading civil statuses..."
                        : "Select civil status"}
                    </option>
                    {sortedCivilStatuses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.civil_status_name}
                      </option>
                    ))}
                  </select>
                  {renderFieldError("Civil Status")}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sex
                  </label>
                  <select
                    value={selectedSexId ? String(selectedSexId) : ""}
                    onChange={(e) => {
                      const nextValue = e.target.value
                        ? Number(e.target.value)
                        : null;
                      setSelectedSexId(
                        Number.isFinite(nextValue) ? nextValue : null,
                      );
                    }}
                    disabled={sexesLoading}
                    className="mt-1 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">
                      {sexesLoading ? "Loading sexes..." : "Select sex"}
                    </option>
                    {sortedSexes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sex_name}
                      </option>
                    ))}
                  </select>
                  {renderFieldError("Sex")}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.25fr_0.9fr] sm:gap-4">
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
                  {renderFieldError("Personal Email")}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    DepEd Email
                  </label>
                  <input
                    type="email"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                    placeholder="employee@deped.gov.ph"
                  />
                  {renderFieldError("DepEd Email")}
                </div>

                <div style={{ maxWidth: "22ch" }}>
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
                  {renderFieldError("Mobile Number")}
                </div>
              </div>
            </div>
          )}

          {step === "work" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {renderFieldError("District")}
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
                {renderFieldError("School")}
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
                {renderFieldError("Plantilla Number")}
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
                {renderFieldError("Position")}
              </div>

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
                {renderFieldError("Employee Number")}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Employee Type
                </label>
                <select
                  value={employeeType}
                  onChange={(e) =>
                    setEmployeeType(
                      e.target.value as
                        | "teaching"
                        | "non-teaching"
                        | "teaching-related",
                    )
                  }
                  className="mt-1 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="teaching">Teaching</option>
                  <option value="non-teaching">Non-Teaching</option>
                  <option value="teaching-related">Teaching-Related</option>
                </select>
                {renderFieldError("Employee Type")}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  License No PRC
                </label>
                <input
                  type="text"
                  value={licenseNoPrc}
                  onChange={(e) => setLicenseNoPrc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  placeholder="PRC License Number"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">TIN</label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) =>
                    setTin(formatMaskedId(e.target.value, GOV_ID_MASKS.tin))
                  }
                  disabled={tinNotAvailable}
                  inputMode="numeric"
                  maxLength={11}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="000-000-000"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={tinNotAvailable}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTinNotAvailable(checked);
                      setTin(checked ? "N/A" : "");
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Not Available
                </label>
                {renderFieldError("TIN")}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  GSIS BP Number
                </label>
                <input
                  type="text"
                  value={gsisBpNo}
                  onChange={(e) => setGsisBpNo(formatGsisBp(e.target.value))}
                  disabled={gsisBpNotAvailable}
                  inputMode="text"
                  maxLength={12}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="00000-000000"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={gsisBpNotAvailable}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setGsisBpNotAvailable(checked);
                      setGsisBpNo(checked ? "N/A" : "");
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Not Available
                </label>
                {renderFieldError("GSIS BP Number")}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  GSIS CRN Number
                </label>
                <input
                  type="text"
                  value={gsisCrnNo}
                  onChange={(e) =>
                    setGsisCrnNo(normalize12Digits(e.target.value))
                  }
                  disabled={gsisCrnNotAvailable}
                  inputMode="numeric"
                  maxLength={12}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="000000000000"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={gsisCrnNotAvailable}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setGsisCrnNotAvailable(checked);
                      setGsisCrnNo(checked ? "N/A" : "");
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Not Available
                </label>
                {renderFieldError("GSIS CRN Number")}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  PAG-IBIG Number
                </label>
                <input
                  type="text"
                  value={pagibigNo}
                  onChange={(e) =>
                    setPagibigNo(normalize12Digits(e.target.value))
                  }
                  disabled={pagibigNotAvailable}
                  inputMode="numeric"
                  maxLength={12}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="000000000000"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={pagibigNotAvailable}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPagibigNotAvailable(checked);
                      setPagibigNo(checked ? "N/A" : "");
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Not Available
                </label>
                {renderFieldError("PAG-IBIG Number")}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  PhilHealth Number
                </label>
                <input
                  type="text"
                  value={philhealthNo}
                  onChange={(e) =>
                    setPhilhealthNo(normalizePhilhealth(e.target.value))
                  }
                  disabled={philhealthNotAvailable}
                  inputMode="numeric"
                  maxLength={12}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="000000000000"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={philhealthNotAvailable}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPhilhealthNotAvailable(checked);
                      setPhilhealthNo(checked ? "N/A" : "");
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Not Available
                </label>
                {renderFieldError("PhilHealth Number")}
              </div>
            </div>
          )}

          {step === "salary" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Salary Information
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Employment timeline and bonus information
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Date of First Appointment{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfFirstAppointment}
                    onChange={(e) => setDateOfFirstAppointment(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  />
                  {renderFieldError("Date of First Appointment")}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Years in Service
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatYearsInService(
                      computedSalaryMetrics.yearsInService,
                    )}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Loyalty Bonus
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatLoyaltyBonus(
                      computedSalaryMetrics.loyaltyBonus,
                    )}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {!!(
              firstName ||
              lastName ||
              middleName ||
              birthdate ||
              personalEmail ||
              selectedCivilStatusId ||
              employeeNo ||
              workEmail ||
              selectedPositionId ||
              selectedDistrictId ||
              schoolId ||
              tin ||
              gsisBpNo ||
              dateOfFirstAppointment
            ) && (
              <button
                type="button"
                onClick={createClearHandler(
                  handleClearAllFields,
                  !!(
                    firstName ||
                    lastName ||
                    middleName ||
                    birthdate ||
                    personalEmail ||
                    selectedCivilStatusId ||
                    employeeNo ||
                    workEmail ||
                    selectedPositionId ||
                    selectedDistrictId ||
                    schoolId ||
                    tin ||
                    gsisBpNo ||
                    dateOfFirstAppointment
                  ),
                )}
                className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60 disabled:no-underline"
                disabled={submitLoading || isConfirmOpen}
              >
                Clear All
              </button>
            )}

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

            {step !== "personal" && (
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

            {step === "salary" ? (
              <button
                type="button"
                onClick={() => {
                  void handleAddEmployee();
                }}
                disabled={submitLoading || isConfirmOpen || schoolsLoading}
                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-1">
                  <UserPlus size={14} />
                  {submitLoading ? "Saving..." : "Add Employee"}
                </span>
              </button>
            ) : (
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
                <span className="font-semibold text-gray-800">
                  DepEd Email:
                </span>{" "}
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
