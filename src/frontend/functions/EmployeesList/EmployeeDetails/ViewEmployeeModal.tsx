"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pencil,
  XCircle,
  Save,
  X,
  AlertCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import ChangesToast from "../modals/ChangesToast";
import SaveChanges from "../modals/SaveChanges";
import PersonalInformation from "./PersonalInformation";
import WorkInformation from "./WorkInformation";
import SalaryInformation, {
  type SalaryHistoryDraft,
  type SalaryHistoryEditDraft,
  type SalaryHistoryRecord,
} from "./SalaryInformation";
import { createClearHandler } from "../../../utils/clearFormUtils";
import { InlineModalSkeleton } from "../../../components/Skeleton/SkeletonLoaders";

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

type EditSnapshot = {
  firstName: string;
  middleName: string;
  noMiddleName: boolean;
  middleInitial: string;
  lastName: string;
  birthdate: string;
  personalEmail: string;
  mobileNumber: string;
  homeAddress: string;
  placeOfBirth: string;
  civilStatus: string;
  civilStatusId: number | null;
  sex: string;
  sexId: number | null;
  employeeNo: string;
  workEmail: string;
  district: string;
  position: string;
  plantillaNo: string;
  dateOfFirstAppointment: string;
  currentEmployeeType: string;
  currentPosition: string;
  currentPlantillaNo: string;
  currentAppointmentDate: string;
  currentSg: string;
  employeeType: "teaching" | "non-teaching" | "teaching-related";
  schoolId: number | null;
  schoolName: string;
  positionId: number | null;
  licenseNoPrc: string;
  tin: string;
  gsisBpNo: string;
  gsisCrnNo: string;
  pagibigNo: string;
  philhealthNo: string;
};

type EmployeeListResponse = {
  data?: Array<
    Partial<EmployeeDetailsResponse> & {
      id?: number;
    }
  >;
  message?: string;
};

type EmployeeDetailsApiResponse = {
  data?: Partial<EmployeeDetailsResponse> & {
    id?: number;
  };
  message?: string;
};

type SalaryInformationListResponse = {
  data?: SalaryHistoryRecord[];
  message?: string;
};

type SalaryInformationMutationResponse = {
  data?: SalaryHistoryRecord;
  message?: string;
  error?: string;
};

type EmployeeDetailsResponse = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  no_middle_name?: boolean | null;
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
  employee_type?: "teaching" | "non-teaching" | "teaching-related";
  resolved_employee_type?: "teaching" | "non-teaching" | "teaching-related";
  resolved_position?: string | null;
  resolved_plantilla_no?: string | null;
  resolved_appointment_date?: string | null;
  resolved_sg?: string | null;
  school_id?: number | null;
  school_name?: string | null;
  employee_no?: string | null;
  work_email?: string | null;
  district?: string | null;
  work_district?: string | null;
  position?: string | null;
  position_id?: number | null;
  plantilla_no?: string | null;
  sg?: string | null;
  current_employee_type?: string | null;
  current_position?: string | null;
  current_plantilla_no?: string | null;
  current_appointment_date?: string | null;
  current_sg?: string | null;
  age?: number | null;
  birthdate?: string | null;
  date_of_first_appointment?: string | null;
  years_in_service?: number | string | null;
  loyalty_bonus?: string | number | boolean | null;
  prc_license_no?: string | null;
  license_no_prc?: string | null;
  tin?: string | null;
  gsis_bp_no?: string | null;
  gsis_crn_no?: string | null;
  pagibig_no?: string | null;
  philhealth_no?: string | null;
  retirable?: "Yes" | "No" | "Mandatory Retirement" | null;
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
    employeeType: "teaching" | "non-teaching" | "teaching-related";
    schoolId: number | null;
    schoolName: string;
    birthdate: string;
    sg?: string | null;
  } | null;
  canEdit: boolean;
  onEmployeeUpdated: (employee: {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    fullName: string;
    email: string;
    employeeType: "teaching" | "non-teaching" | "teaching-related";
    schoolId: number | null;
    schoolName: string;
    birthdate: string;
    sg?: string | null;
  }) => void;
  onClose: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const SALARY_HISTORY_REMARK_OPTIONS = [
  "Step Increment",
  "Promotion",
  "Step Increment Increase",
] as const;

const formatValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  const text = String(value).trim();
  return text ? text : "N/A";
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "N/A";

  const raw = String(value).trim();
  if (!raw) return "N/A";
  if (raw === "0000-00-00") return "N/A";

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw === "0000-00-00") return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

const createEditSnapshotFromDetails = (
  data: EmployeeDetailsResponse,
): EditSnapshot => {
  const nextTin = String(data.tin || "").trim();
  const nextGsisBpNo = String(data.gsis_bp_no || "").trim();
  const nextGsisCrnNo = String(data.gsis_crn_no || "").trim();
  const nextPagibigNo = String(data.pagibig_no || "").trim();
  const nextPhilhealthNo = String(data.philhealth_no || "").trim();

  const normalizedMiddleName = String(data.middle_name || "").trim();
  const explicitNoMiddleName = Boolean(data.no_middle_name);
  const computedNoMiddleName =
    explicitNoMiddleName || normalizedMiddleName.toUpperCase() === "N/A";

  return {
    firstName: data.first_name || "",
    middleName: computedNoMiddleName ? "N/A" : normalizedMiddleName,
    noMiddleName: computedNoMiddleName,
    middleInitial: computedNoMiddleName ? "N/A" : data.middle_initial || "",
    lastName: data.last_name || "",
    birthdate: toDateInputValue(data.birthdate),
    personalEmail: data.email || "",
    mobileNumber: data.mobile_number || "",
    homeAddress: data.home_address || "",
    placeOfBirth: data.place_of_birth || "",
    civilStatus: data.civil_status || "",
    civilStatusId: data.civil_status_id || null,
    sex: data.sex || "",
    sexId: data.sex_id || null,
    employeeNo: data.employee_no || "",
    workEmail: data.work_email || "",
    district: data.district || data.work_district || "",
    position: data.position || "",
    plantillaNo: normalizePlantillaNo(data.plantilla_no || ""),
    dateOfFirstAppointment: toDateInputValue(data.date_of_first_appointment),
    currentEmployeeType: String(data.current_employee_type || "").trim(),
    currentPosition: String(data.current_position || "").trim(),
    currentPlantillaNo: normalizePlantillaNo(data.current_plantilla_no || ""),
    currentAppointmentDate: toDateInputValue(data.current_appointment_date),
    currentSg: String(data.current_sg || "").trim(),
    employeeType: data.employee_type || "non-teaching",
    schoolId: data.school_id || null,
    schoolName: data.school_name || "",
    positionId: data.position_id || null,
    licenseNoPrc: data.prc_license_no || data.license_no_prc || "",
    tin: formatMaskedId(nextTin, GOV_ID_MASKS.tin),
    gsisBpNo: formatGsisBp(nextGsisBpNo),
    gsisCrnNo: normalize12Digits(nextGsisCrnNo),
    pagibigNo: normalize12Digits(nextPagibigNo),
    philhealthNo: normalizePhilhealth(nextPhilhealthNo),
  };
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

const normalizeRetirableValue = (
  value: string | null | undefined,
): "Yes" | "No" | "Mandatory Retirement" | null => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "yes") return "Yes";
  if (normalized === "no") return "No";
  if (
    normalized === "mandatory retirement" ||
    normalized === "mandatory-retirement"
  ) {
    return "Mandatory Retirement";
  }
  return null;
};

const getRetirableFromAge = (
  age: number | null | undefined,
): "Yes" | "No" | "Mandatory Retirement" | null => {
  if (!Number.isFinite(age)) return null;
  if (Number(age) >= 65) return "Mandatory Retirement";
  if (Number(age) >= 60) return "Yes";
  return "No";
};

const isValidDepEdEmail = (value: string): boolean => {
  const trimmed = value.trim().toLowerCase();
  return /^[^\s@]+@deped\.gov\.ph$/.test(trimmed);
};

const PLANTILLA_PREFIX = "OSEC-DECSB-";
const PLANTILLA_SUFFIX_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

const normalizePlantillaNo = (value: string): string => {
  const upper = String(value || "")
    .toUpperCase()
    .trim();
  const suffixSource = upper.startsWith(PLANTILLA_PREFIX)
    ? upper.slice(PLANTILLA_PREFIX.length)
    : upper.replace(/^OSEC-DECSB-?/, "");
  const suffix = suffixSource.replace(/[^A-Z0-9-]/g, "");
  return `${PLANTILLA_PREFIX}${suffix}`;
};

const isValidPlantillaNo = (value: string): boolean => {
  const normalized = normalizePlantillaNo(value);
  const suffix = normalized.slice(PLANTILLA_PREFIX.length);
  return Boolean(suffix) && PLANTILLA_SUFFIX_PATTERN.test(suffix);
};

const normalizeMiddleInitialInput = (value: string): string =>
  value
    .replace(/[^a-zA-Z.]/g, "")
    .toUpperCase()
    .slice(0, 2);

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
  const [activeSection, setActiveSection] = useState<
    "personal" | "work" | "salary"
  >("personal");

  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [noMiddleName, setNoMiddleName] = useState(false);
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
  const [editPlantillaNo, setEditPlantillaNo] = useState(PLANTILLA_PREFIX);
  const [editDateOfFirstAppointment, setEditDateOfFirstAppointment] =
    useState("");
  const [editCurrentEmployeeType, setEditCurrentEmployeeType] = useState("");
  const [editCurrentPosition, setEditCurrentPosition] = useState("");
  const [editCurrentPlantillaNo, setEditCurrentPlantillaNo] = useState("");
  const [editCurrentAppointmentDate, setEditCurrentAppointmentDate] =
    useState("");
  const [editCurrentSg, setEditCurrentSg] = useState("");
  const [editWorkSg, setEditWorkSg] = useState("");
  const [initialWorkSg, setInitialWorkSg] = useState("");
  const [editEmployeeType, setEditEmployeeType] = useState<
    "teaching" | "non-teaching" | "teaching-related"
  >("non-teaching");
  const [editSchoolId, setEditSchoolId] = useState<number | null>(null);
  const [editSchoolName, setEditSchoolName] = useState("");
  const [editPositionId, setEditPositionId] = useState<number | null>(null);
  const [editLicenseNoPrc, setEditLicenseNoPrc] = useState("");
  const [editTin, setEditTin] = useState("");
  const [editGsisBpNo, setEditGsisBpNo] = useState("");
  const [editGsisCrnNo, setEditGsisCrnNo] = useState("");
  const [editPagibigNo, setEditPagibigNo] = useState("");
  const [editPhilhealthNo, setEditPhilhealthNo] = useState("");

  const [schools, setSchools] = useState<School[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [civilStatuses, setCivilStatuses] = useState<CivilStatus[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showCurrentPositionDropdown, setShowCurrentPositionDropdown] =
    useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [positionSearch, setPositionSearch] = useState("");
  const [currentPositionSearch, setCurrentPositionSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  const [editError, setEditError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [initialEditSnapshot, setInitialEditSnapshot] =
    useState<EditSnapshot | null>(null);
  const [salaryHistoryRows, setSalaryHistoryRows] = useState<
    SalaryHistoryRecord[]
  >([]);
  const [salaryHistoryLoading, setSalaryHistoryLoading] = useState(false);
  const [salaryHistoryError, setSalaryHistoryError] = useState<string | null>(
    null,
  );
  const [salaryHistoryCreateDraft, setSalaryHistoryCreateDraft] =
    useState<SalaryHistoryDraft | null>(null);
  const [salaryHistoryCreateError, setSalaryHistoryCreateError] = useState<
    string | null
  >(null);
  const [salaryHistoryCreating, setSalaryHistoryCreating] = useState(false);
  const [salaryHistoryEditDraft, setSalaryHistoryEditDraft] =
    useState<SalaryHistoryEditDraft | null>(null);
  const [salaryHistoryUpdateError, setSalaryHistoryUpdateError] = useState<
    string | null
  >(null);
  const [salaryHistoryUpdating, setSalaryHistoryUpdating] = useState(false);
  const [
    salaryHistoryEditIncrementTouched,
    setSalaryHistoryEditIncrementTouched,
  ] = useState(false);

  const applyEditSnapshot = (snapshot: EditSnapshot) => {
    setEditFirstName(snapshot.firstName);
    setEditMiddleName(snapshot.middleName);
    setNoMiddleName(snapshot.noMiddleName);
    setEditMiddleInitial(snapshot.middleInitial);
    setEditLastName(snapshot.lastName);
    setEditBirthdate(snapshot.birthdate);
    setEditPersonalEmail(snapshot.personalEmail);
    setEditMobileNumber(snapshot.mobileNumber);
    setEditHomeAddress(snapshot.homeAddress);
    setEditPlaceOfBirth(snapshot.placeOfBirth);
    setEditCivilStatus(snapshot.civilStatus);
    setEditCivilStatusId(snapshot.civilStatusId);
    setEditSex(snapshot.sex);
    setEditSexId(snapshot.sexId);
    setEditEmployeeNo(snapshot.employeeNo);
    setEditWorkEmail(snapshot.workEmail);
    setEditDistrict(snapshot.district);
    setEditPosition(snapshot.position);
    setEditPlantillaNo(normalizePlantillaNo(snapshot.plantillaNo));
    setEditDateOfFirstAppointment(snapshot.dateOfFirstAppointment);
    setEditCurrentEmployeeType(snapshot.currentEmployeeType);
    setEditCurrentPosition(snapshot.currentPosition);
    setEditCurrentPlantillaNo(normalizePlantillaNo(snapshot.currentPlantillaNo));
    setEditCurrentAppointmentDate(snapshot.currentAppointmentDate);
    setEditCurrentSg(snapshot.currentSg);
    setEditEmployeeType(snapshot.employeeType);
    setEditSchoolId(snapshot.schoolId);
    setEditSchoolName(snapshot.schoolName);
    setEditPositionId(snapshot.positionId);
    setEditLicenseNoPrc(snapshot.licenseNoPrc);
    setEditTin(snapshot.tin);
    setEditGsisBpNo(snapshot.gsisBpNo);
    setEditGsisCrnNo(snapshot.gsisCrnNo);
    setEditPagibigNo(snapshot.pagibigNo);
    setEditPhilhealthNo(snapshot.philhealthNo);
  };

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
      sg: employee.sg || null,
    };
  }, [employee]);

  const resolvedDetails = details || fallbackDetails;
  const resolvedSalaryDate = isEditing
    ? editDateOfFirstAppointment
    : (resolvedDetails?.resolved_appointment_date || 
       resolvedDetails?.current_appointment_date || 
       resolvedDetails?.date_of_first_appointment || 
       null);
  const computedSalaryMetrics = computeServiceMetrics(resolvedSalaryDate);
  const resolvedYearsInService = isEditing
    ? computedSalaryMetrics.yearsInService
    : (resolvedDetails?.years_in_service ??
      computedSalaryMetrics.yearsInService);
  const resolvedLoyaltyBonus = isEditing
    ? computedSalaryMetrics.loyaltyBonus
    : (resolvedDetails?.loyalty_bonus ?? computedSalaryMetrics.loyaltyBonus);
  const latestSalaryHistoryRow = useMemo(() => {
    if (!salaryHistoryRows.length) return null;

    const normalizeSalaryDate = (value: string | null | undefined) => {
      const raw = String(value || "").trim();
      return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "";
    };

    return salaryHistoryRows.reduce<SalaryHistoryRecord | null>(
      (latest, row) => {
        if (!latest) return row;

        const latestDate = normalizeSalaryDate(latest.salary_date || null);
        const rowDate = normalizeSalaryDate(row.salary_date || null);
        const dateCompare = rowDate.localeCompare(latestDate);

        if (dateCompare > 0) return row;
        if (dateCompare < 0) return latest;

        return Number(row.id || 0) > Number(latest.id || 0) ? row : latest;
      },
      null,
    );
  }, [salaryHistoryRows]);
  const resolvedWorkSg =
    latestSalaryHistoryRow?.sg ?? 
    resolvedDetails?.resolved_sg ?? 
    resolvedDetails?.current_sg ?? 
    resolvedDetails?.sg ?? 
    null;
  const canManageSalaryHistory = isEditing && canEdit;
  const hasPendingSalaryHistoryDraft =
    Boolean(salaryHistoryCreateDraft) || Boolean(salaryHistoryEditDraft);

  const loadSalaryHistory = useCallback(async (employeeId: number) => {
    try {
      setSalaryHistoryLoading(true);
      setSalaryHistoryError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE}/api/employees/${employeeId}/salary-information`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const body = (await response.json()) as SalaryInformationListResponse;

      if (!response.ok) {
        throw new Error(body.message || "Failed to load salary information");
      }

      setSalaryHistoryRows(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setSalaryHistoryError(
        err instanceof Error
          ? err.message
          : "Failed to load salary information",
      );
    } finally {
      setSalaryHistoryLoading(false);
    }
  }, []);

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
            const snapshot = createEditSnapshotFromDetails(data);

            applyEditSnapshot(snapshot);
            setInitialEditSnapshot(snapshot);
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
    setInitialEditSnapshot(null);
    setEditError(null);
    setErrors([]);
    setActiveSection("personal");
    setSalaryHistoryCreateDraft(null);
    setSalaryHistoryCreateError(null);
    setSalaryHistoryEditDraft(null);
    setSalaryHistoryUpdateError(null);
    setSalaryHistoryCreating(false);
    setSalaryHistoryUpdating(false);
    setSalaryHistoryEditIncrementTouched(false);
    loadDetails();

    return () => {
      disposed = true;
    };
  }, [employee, visible]);

  useEffect(() => {
    if (!visible || !employee) return;

    setSalaryHistoryRows([]);
    setSalaryHistoryError(null);
    setSalaryHistoryCreateDraft(null);
    setSalaryHistoryCreateError(null);
    setSalaryHistoryEditDraft(null);
    setSalaryHistoryUpdateError(null);
    setSalaryHistoryEditIncrementTouched(false);
    void loadSalaryHistory(employee.id);
  }, [employee, loadSalaryHistory, visible]);

  useEffect(() => {
    if (isEditing) return;

    setSalaryHistoryCreateDraft(null);
    setSalaryHistoryCreateError(null);
    setSalaryHistoryEditDraft(null);
    setSalaryHistoryUpdateError(null);
    setSalaryHistoryEditIncrementTouched(false);
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) return;

    const normalizedSg = String(resolvedWorkSg ?? "").trim();
    setEditWorkSg(normalizedSg);
    setInitialWorkSg(normalizedSg);
  }, [isEditing, resolvedWorkSg]);

  useEffect(() => {
    if (isEditing) {
      setDistrictSearch(editDistrict);
      setPositionSearch(editPosition);
      setCurrentPositionSearch(editCurrentPosition);
      setSchoolSearch(editSchoolName);
    } else {
      setDistrictSearch("");
      setPositionSearch("");
      setCurrentPositionSearch("");
      setSchoolSearch("");
    }
  }, [
    isEditing,
    editDistrict,
    editPosition,
    editCurrentPosition,
    editSchoolName,
  ]);

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
  const headerEmployeeName = [
    resolvedDetails?.first_name || employee.firstName,
    String(resolvedDetails?.middle_name || employee.middleName || "")
      .trim()
      .toUpperCase() === "N/A"
      ? ""
      : resolvedDetails?.middle_name || employee.middleName,
    resolvedDetails?.last_name || employee.lastName,
  ]
    .filter((part) => Boolean(String(part || "").trim()))
    .join(" ")
    .trim();

  const ageValue =
    resolvedDetails?.age ??
    computeAge(resolvedDetails?.birthdate || employee.birthdate);
  const isArchived = Boolean(resolvedDetails?.is_archived);
  const retirableValue =
    normalizeRetirableValue(resolvedDetails?.retirable) ||
    getRetirableFromAge(ageValue);
  const archivedByLabel =
    resolvedDetails?.archived_by_name ||
    (resolvedDetails?.archived_by
      ? `User #${resolvedDetails.archived_by}`
      : "N/A");

  const displayEmployeeType: "teaching" | "non-teaching" | "teaching-related" = (() => {
    const type = 
      resolvedDetails?.current_employee_type || 
      resolvedDetails?.employee_type || 
      employee.employeeType;
    
    if (type === "teaching" || type === "non-teaching" || type === "teaching-related") {
      return type;
    }
    return "non-teaching";
  })();

  const getValidationError = (field: string): string | null =>
    errors.find((error) => error.field === field)?.message ?? null;

  const hasEditChanges =
    isEditing &&
    initialEditSnapshot !== null &&
    (JSON.stringify({
      firstName: editFirstName,
      middleName: editMiddleName,
      noMiddleName,
      middleInitial: editMiddleInitial,
      lastName: editLastName,
      birthdate: editBirthdate,
      personalEmail: editPersonalEmail,
      mobileNumber: editMobileNumber,
      homeAddress: editHomeAddress,
      placeOfBirth: editPlaceOfBirth,
      civilStatus: editCivilStatus,
      civilStatusId: editCivilStatusId,
      sex: editSex,
      sexId: editSexId,
      employeeNo: editEmployeeNo,
      workEmail: editWorkEmail,
      district: editDistrict,
      position: editPosition,
      plantillaNo: editPlantillaNo,
      dateOfFirstAppointment: editDateOfFirstAppointment,
      currentEmployeeType: editCurrentEmployeeType,
      currentPosition: editCurrentPosition,
      currentPlantillaNo: editCurrentPlantillaNo,
      currentAppointmentDate: editCurrentAppointmentDate,
      currentSg: editCurrentSg,
      employeeType: editEmployeeType,
      schoolId: editSchoolId,
      schoolName: editSchoolName,
      positionId: editPositionId,
      licenseNoPrc: editLicenseNoPrc,
      tin: editTin,
      gsisBpNo: editGsisBpNo,
      gsisCrnNo: editGsisCrnNo,
      pagibigNo: editPagibigNo,
      philhealthNo: editPhilhealthNo,
    }) !== JSON.stringify(initialEditSnapshot) ||
      editWorkSg.trim() !== initialWorkSg.trim());

  const handleClearEditChanges = () => {
    if (!initialEditSnapshot) return;
    applyEditSnapshot(initialEditSnapshot);
    setEditWorkSg(initialWorkSg);
    setErrors([]);
    setEditError(null);
  };

  const handleEditPlantillaNoChange = (value: string) => {
    setEditPlantillaNo(normalizePlantillaNo(value));
  };

  const handleEditCurrentPlantillaNoChange = (value: string) => {
    setEditCurrentPlantillaNo(normalizePlantillaNo(value));
  };

  const handleSaveChanges = async () => {
    setEditError(null);
    const newErrors: ValidationError[] = [];
    let selectedDistrict: District | null = null;

    if (!editFirstName.trim()) {
      newErrors.push({
        field: "First Name",
        message: "First name is required",
      });
    }

    if (!editLastName.trim()) {
      newErrors.push({ field: "Last Name", message: "Last name is required" });
    }

    if (editMiddleInitial.trim().length > 2) {
      newErrors.push({
        field: "M.I.",
        message: "M.I. must be at most 2 characters.",
      });
    }

    if (!editBirthdate) {
      newErrors.push({
        field: "Date of Birth",
        message: "Date of birth is required",
      });
    }

    const firstAppointmentDate = editDateOfFirstAppointment.trim();
    const normalizedWorkSg = editWorkSg.trim();
    if (firstAppointmentDate && !isValidDateValue(firstAppointmentDate)) {
      newErrors.push({
        field: "Date of First Appointment",
        message: "Date of First Appointment must be a valid date",
      });
    }

    if (firstAppointmentDate) {
      const parsedAppointmentDate = new Date(firstAppointmentDate);
      const currentDate = new Date();
      if (
        !Number.isNaN(parsedAppointmentDate.getTime()) &&
        parsedAppointmentDate > currentDate
      ) {
        newErrors.push({
          field: "Date of First Appointment",
          message: "Date of First Appointment cannot be in the future",
        });
      }
    }

    if (normalizedWorkSg.length > 20) {
      newErrors.push({
        field: "SG",
        message: "SG must be at most 20 characters",
      });
    }

    const normalizedCurrentAppointmentDate =
      editCurrentAppointmentDate.trim();
    if (
      normalizedCurrentAppointmentDate &&
      !isValidDateValue(normalizedCurrentAppointmentDate)
    ) {
      newErrors.push({
        field: "Current Appointment Date",
        message: "Current Appointment Date must be a valid date",
      });
    }

    if (normalizedCurrentAppointmentDate) {
      const parsedCurrentAppointmentDate = new Date(normalizedCurrentAppointmentDate);
      const currentDate = new Date();
      if (
        !Number.isNaN(parsedCurrentAppointmentDate.getTime()) &&
        parsedCurrentAppointmentDate > currentDate
      ) {
        newErrors.push({
          field: "Current Appointment Date",
          message: "Current Appointment Date cannot be in the future",
        });
      }
    }

    if (editCurrentSg.trim().length > 20) {
      newErrors.push({
        field: "Current SG",
        message: "Current SG must be at most 20 characters",
      });
    }

    if (
      editPersonalEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editPersonalEmail.trim())
    ) {
      newErrors.push({
        field: "Personal Email",
        message: "Personal email must be a valid email",
      });
    }

    if (editMobileNumber.trim() && !/^\d{11}$/.test(editMobileNumber.trim())) {
      newErrors.push({
        field: "Mobile Number",
        message: "Mobile number must be exactly 11 digits",
      });
    }

    if (editEmployeeNo.trim() && !/^\d{7}$/.test(editEmployeeNo.trim())) {
      newErrors.push({
        field: "Employee Number",
        message: "Employee number must be exactly 7 digits",
      });
    }

    if (
      editWorkEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editWorkEmail.trim())
    ) {
      newErrors.push({
        field: "DepEd Email",
        message: "DepEd email must be a valid email",
      });
    } else if (editWorkEmail.trim() && !isValidDepEdEmail(editWorkEmail)) {
      newErrors.push({
        field: "DepEd Email",
        message: "DepEd email must end with @deped.gov.ph",
      });
    }

    if (!isValidPlantillaNo(editPlantillaNo)) {
      newErrors.push({
        field: "Plantilla Number",
        message:
          "Plantilla number must follow OSEC-DECSB- format using uppercase letters, numbers, and hyphens only",
      });
    }

    if (!editSchoolId) {
      newErrors.push({
        field: "School",
        message: "School is required",
      });
    }

    const normalizedDistrictInput = editDistrict.trim();
    if (!normalizedDistrictInput) {
      newErrors.push({
        field: "District",
        message: "District is required",
      });
    } else {
      selectedDistrict =
        districts.find(
          (item) =>
            item.district_name.trim().toLowerCase() ===
            normalizedDistrictInput.toLowerCase(),
        ) || null;

      if (!selectedDistrict) {
        newErrors.push({
          field: "District",
          message: "Please select a valid district from the list.",
        });
      }
    }

    if (!editTin.trim() || !isGovernmentIdValid(editTin, GOV_ID_MASKS.tin)) {
      newErrors.push({
        field: "TIN",
        message: "TIN must follow 000-000-000 format",
      });
    }

    if (!editGsisBpNo.trim() || !isGsisBpValid(editGsisBpNo)) {
      newErrors.push({
        field: "GSIS BP Number",
        message: "GSIS BP Number must follow 00000-000000 format",
      });
    }

    if (!editGsisCrnNo.trim() || !/^\d{12}$/.test(editGsisCrnNo.trim())) {
      newErrors.push({
        field: "GSIS CRN Number",
        message: "GSIS CRN Number must be exactly 12 digits",
      });
    }

    if (!editPagibigNo.trim() || !/^\d{12}$/.test(editPagibigNo.trim())) {
      newErrors.push({
        field: "PAG-IBIG Number",
        message: "PAG-IBIG Number must be exactly 12 digits",
      });
    }

    if (!editPhilhealthNo.trim() || !isPhilhealthValid(editPhilhealthNo)) {
      newErrors.push({
        field: "PhilHealth Number",
        message: "PhilHealth Number must be exactly 12 digits",
      });
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      showToast("Please fix the highlighted fields before saving.", "error");
      return;
    }

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
        { field: "Employee Number", key: "employee_no", value: editEmployeeNo },
        {
          field: "Plantilla Number",
          key: "plantilla_no",
          value: editPlantillaNo,
        },
        {
          field: "License No PRC",
          key: "prc_license_no",
          value: editLicenseNoPrc,
        },
        { field: "TIN", key: "tin", value: editTin },
        { field: "GSIS BP Number", key: "gsis_bp_no", value: editGsisBpNo },
        { field: "GSIS CRN Number", key: "gsis_crn_no", value: editGsisCrnNo },
        { field: "PAG-IBIG Number", key: "pagibig_no", value: editPagibigNo },
        {
          field: "PhilHealth Number",
          key: "philhealth_no",
          value: editPhilhealthNo,
        },
      ] as const;

      try {
        const listResponse = await fetch(`${API_BASE}/api/employees/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const listBody = (await listResponse.json()) as EmployeeListResponse;
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
                .catch(() => ({}))) as EmployeeDetailsApiResponse;
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
            if (Number(row.id) === Number(employee.id)) {
              return false;
            }
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

    const duplicateErrors = await checkUniqueIdentifiers();
    if (duplicateErrors.length > 0) {
      setErrors(duplicateErrors);
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

      const firstAppointmentMetrics = computeServiceMetrics(
        firstAppointmentDate || null,
      );
      const normalizedMiddleName = editMiddleName.trim();
      const hasSgChanged = normalizedWorkSg !== initialWorkSg.trim();
      const updatePayload = {
        first_name: editFirstName.trim(),
        middle_name: noMiddleName ? "N/A" : normalizedMiddleName || null,
        no_middle_name: noMiddleName,
        middle_initial: noMiddleName
          ? "N/A"
          : normalizeMiddleInitialInput(editMiddleInitial.trim()),
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
        district: selectedDistrict?.district_name || editDistrict.trim(),
        position: editPosition.trim(),
        position_id: editPositionId,
        plantilla_no: editPlantillaNo.trim(),
        ...(hasSgChanged ? { sg: normalizedWorkSg || null } : {}),
        date_of_first_appointment: firstAppointmentDate || null,
        current_employee_type: editCurrentEmployeeType.trim() || null,
        current_position: editCurrentPosition.trim() || null,
        current_plantilla_no: editCurrentPlantillaNo.trim() || null,
        current_appointment_date: normalizedCurrentAppointmentDate || null,
        current_sg: editCurrentSg.trim() || null,
        dateOfFirstAppointment: firstAppointmentDate || null,
        years_in_service: firstAppointmentMetrics.yearsInService,
        yearsInService: firstAppointmentMetrics.yearsInService,
        loyalty_bonus: firstAppointmentMetrics.loyaltyBonus,
        loyaltyBonus: firstAppointmentMetrics.loyaltyBonus,
        employee_type: editEmployeeType,
        school_id: editSchoolId,
        prc_license_no: editLicenseNoPrc.trim(),
        license_no_prc: editLicenseNoPrc.trim(),
        tin: editTin.trim(),
        gsis_bp_no: editGsisBpNo.trim(),
        gsis_crn_no: editGsisCrnNo.trim(),
        pagibig_no: editPagibigNo.trim(),
        philhealth_no: editPhilhealthNo.trim(),
      };

      const response = await fetch(`${API_BASE}/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      let updateResponse = response;
      if (
        !response.ok &&
        (response.status === 404 ||
          response.status === 405 ||
          response.status === 501)
      ) {
        updateResponse = await fetch(
          `${API_BASE}/api/employees/${employee.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatePayload),
          },
        );
      }

      let body: { message?: string } = {};
      try {
        body = (await updateResponse.json()) as { message?: string };
      } catch {
        body = {};
      }

      if (!updateResponse.ok) {
        throw new Error(body.message || "Failed to update employee");
      }

      const refreshedResponse = await fetch(
        `${API_BASE}/api/employees/${employee.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const refreshedBody = (await refreshedResponse.json()) as {
        data?: EmployeeDetailsResponse;
        message?: string;
      };

      if (refreshedResponse.ok && refreshedBody.data) {
        const refreshedDetails = refreshedBody.data;
        setDetails(refreshedDetails);
        const refreshedSnapshot =
          createEditSnapshotFromDetails(refreshedDetails);
        setInitialEditSnapshot(refreshedSnapshot);
      }

      if (hasSgChanged) {
        await loadSalaryHistory(employee.id);
      }

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
    if (hasPendingSalaryHistoryDraft) {
      showToast(
        "Finish Salary History row action first (save or cancel row edit).",
        "error",
      );
      return;
    }

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

  const handleStartAddSalaryHistory = () => {
    if (!canManageSalaryHistory) return;

    setSalaryHistoryEditDraft(null);
    setSalaryHistoryUpdateError(null);
    setSalaryHistoryCreateError(null);
    setSalaryHistoryCreateDraft({
      date: "",
      plantilla: "",
      sg: "",
      step: "",
      salary: "",
      increment: "",
      remarks: "",
    });
  };

  const handleCancelAddSalaryHistory = () => {
    if (salaryHistoryCreating || salaryHistoryUpdating) return;
    setSalaryHistoryCreateDraft(null);
    setSalaryHistoryCreateError(null);
  };

  const handleChangeSalaryHistoryDraft = (
    field: keyof SalaryHistoryDraft,
    value: string,
  ) => {
    setSalaryHistoryCreateDraft((current) => {
      if (!current) return current;
      return { ...current, [field]: value };
    });
  };

  const handleSubmitSalaryHistory = async () => {
    if (!employee || !salaryHistoryCreateDraft) return;

    const dateValue = salaryHistoryCreateDraft.date.trim();
    const salaryValueRaw = salaryHistoryCreateDraft.salary.trim();
    const incrementValueRaw = salaryHistoryCreateDraft.increment.trim();
    const numericSalary = Number(salaryValueRaw);
    const numericIncrement = Number(incrementValueRaw);
    const remarksValue = salaryHistoryCreateDraft.remarks.trim();

    if (!dateValue) {
      setSalaryHistoryCreateError("Date is required.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      setSalaryHistoryCreateError("Date must be in YYYY-MM-DD format.");
      return;
    }

    if (
      !salaryValueRaw ||
      !Number.isFinite(numericSalary) ||
      numericSalary < 0
    ) {
      setSalaryHistoryCreateError(
        "Salary is required and must be a non-negative number.",
      );
      return;
    }

    if (
      incrementValueRaw &&
      (!Number.isFinite(numericIncrement) || numericIncrement < 0)
    ) {
      setSalaryHistoryCreateError(
        "Increment must be a non-negative number when provided.",
      );
      return;
    }

    if (
      remarksValue &&
      !(SALARY_HISTORY_REMARK_OPTIONS as readonly string[]).includes(
        remarksValue,
      )
    ) {
      setSalaryHistoryCreateError("Please select a valid remarks value.");
      return;
    }

    try {
      setSalaryHistoryCreating(true);
      setSalaryHistoryCreateError(null);
      setSalaryHistoryUpdateError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE}/api/employees/${employee.id}/salary-information`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: dateValue,
            plantilla: salaryHistoryCreateDraft.plantilla.trim() || null,
            sg: salaryHistoryCreateDraft.sg.trim() || null,
            step: salaryHistoryCreateDraft.step.trim() || null,
            salary: Number(numericSalary.toFixed(2)),
            ...(incrementValueRaw
              ? { increment_amount: Number(numericIncrement.toFixed(2)) }
              : {}),
            remarks: remarksValue || null,
          }),
        },
      );

      const body = (await response
        .json()
        .catch(() => ({}))) as SalaryInformationMutationResponse;

      if (!response.ok) {
        const detail = [body.message, body.error]
          .filter((part) => Boolean(String(part || "").trim()))
          .join(": ");
        throw new Error(detail || "Failed to add salary history row");
      }

      await loadSalaryHistory(employee.id);
      setSalaryHistoryCreateDraft(null);
      setSalaryHistoryCreateError(null);
      showToast("Salary history row added successfully.", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add salary history row";
      setSalaryHistoryCreateError(message);
      showToast("Unable to add salary history row.", "error");
    } finally {
      setSalaryHistoryCreating(false);
    }
  };

  const handleStartEditSalaryHistory = (row: SalaryHistoryRecord) => {
    if (!canManageSalaryHistory) return;

    const normalizedSalary = Number(row.salary);

    setSalaryHistoryCreateDraft(null);
    setSalaryHistoryCreateError(null);
    setSalaryHistoryUpdateError(null);
    setSalaryHistoryEditIncrementTouched(false);
    setSalaryHistoryEditDraft({
      id: row.id,
      date: toDateInputValue(row.salary_date || null),
      plantilla: String(row.plantilla || "").trim(),
      sg: String(row.sg || "").trim(),
      step: String(row.step || "").trim(),
      salary:
        Number.isFinite(normalizedSalary) && row.salary !== null
          ? String(Number(normalizedSalary.toFixed(2)))
          : "",
      increment:
        row.increment_amount !== null && row.increment_amount !== undefined
          ? String(row.increment_amount)
          : "",
      remarks: String(row.remarks || "").trim(),
    });
  };

  const handleCancelEditSalaryHistory = () => {
    if (salaryHistoryUpdating) return;

    setSalaryHistoryEditDraft(null);
    setSalaryHistoryUpdateError(null);
    setSalaryHistoryEditIncrementTouched(false);
  };

  const handleChangeSalaryHistoryEditDraft = (
    field: keyof SalaryHistoryDraft,
    value: string,
  ) => {
    if (field === "increment") {
      setSalaryHistoryEditIncrementTouched(true);
    }

    setSalaryHistoryEditDraft((current) => {
      if (!current) return current;
      return { ...current, [field]: value };
    });
  };

  const handleSubmitSalaryHistoryUpdate = async () => {
    if (!employee || !salaryHistoryEditDraft) return;

    const dateValue = salaryHistoryEditDraft.date.trim();
    const salaryValueRaw = salaryHistoryEditDraft.salary.trim();
    const incrementValueRaw = salaryHistoryEditDraft.increment.trim();
    const numericSalary = Number(salaryValueRaw);
    const numericIncrement = Number(incrementValueRaw);
    const remarksValue = salaryHistoryEditDraft.remarks.trim();

    if (!dateValue) {
      setSalaryHistoryUpdateError("Date is required.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      setSalaryHistoryUpdateError("Date must be in YYYY-MM-DD format.");
      return;
    }

    if (
      !salaryValueRaw ||
      !Number.isFinite(numericSalary) ||
      numericSalary < 0
    ) {
      setSalaryHistoryUpdateError(
        "Salary is required and must be a non-negative number.",
      );
      return;
    }

    if (
      incrementValueRaw &&
      (!Number.isFinite(numericIncrement) || numericIncrement < 0)
    ) {
      setSalaryHistoryUpdateError(
        "Increment must be a non-negative number when provided.",
      );
      return;
    }

    if (
      remarksValue &&
      !(SALARY_HISTORY_REMARK_OPTIONS as readonly string[]).includes(
        remarksValue,
      )
    ) {
      setSalaryHistoryUpdateError("Please select a valid remarks value.");
      return;
    }

    try {
      setSalaryHistoryUpdating(true);
      setSalaryHistoryUpdateError(null);
      setSalaryHistoryCreateError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(
        `${API_BASE}/api/employees/${employee.id}/salary-information/${salaryHistoryEditDraft.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: dateValue,
            plantilla: salaryHistoryEditDraft.plantilla.trim() || null,
            sg: salaryHistoryEditDraft.sg.trim() || null,
            step: salaryHistoryEditDraft.step.trim() || null,
            salary: Number(numericSalary.toFixed(2)),
            ...(salaryHistoryEditIncrementTouched
              ? {
                  increment_amount: incrementValueRaw
                    ? Number(numericIncrement.toFixed(2))
                    : null,
                }
              : {}),
            remarks: remarksValue || null,
          }),
        },
      );

      const body = (await response
        .json()
        .catch(() => ({}))) as SalaryInformationMutationResponse;

      if (!response.ok) {
        const detail = [body.message, body.error]
          .filter((part) => Boolean(String(part || "").trim()))
          .join(": ");
        throw new Error(detail || "Failed to update salary history row");
      }

      await loadSalaryHistory(employee.id);
      setSalaryHistoryEditDraft(null);
      setSalaryHistoryUpdateError(null);
      setSalaryHistoryEditIncrementTouched(false);
      showToast("Salary history row updated successfully.", "success");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update salary history row";
      setSalaryHistoryUpdateError(message);
      showToast("Unable to update salary history row.", "error");
    } finally {
      setSalaryHistoryUpdating(false);
    }
  };

  const tabClass = (tab: "personal" | "work" | "salary") =>
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
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-blue-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="show-scrollbar">
          <div className="mb-3 sm:mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
                  {isEditing
                    ? `Edit Employee`
                    : `View Employee • ${headerEmployeeName || fullName}`}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isEditing
                    ? "Update personal details first, then work details."
                    : "View personal details and work details of the employee."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  if (retirableValue === "Mandatory Retirement") {
                    return (
                      <div className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600 sm:px-4 sm:py-2 sm:text-sm">
                        <AlertTriangle size={14} />
                        Mandatory Retirement
                      </div>
                    );
                  }
                  if (retirableValue === "Yes") {
                    return (
                      <div className="inline-flex items-center gap-1 rounded-xl bg-yellow-100 px-3 py-1.5 text-xs font-bold text-orange-600 sm:px-4 sm:py-2 sm:text-sm">
                        <Clock size={14} />
                        Retirable
                      </div>
                    );
                  }
                  return null;
                })()}

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isEditing || isSaving}
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-2 sm:mb-4 sm:grid-cols-3">
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
            <button
              type="button"
              onClick={() => setActiveSection("salary")}
              className={`${tabClass("salary")} cursor-pointer`}
            >
              Salary Information
            </button>
          </div>

          {isLoadingDetails ? (
            <div className="mb-3">
              <InlineModalSkeleton fields={6} />
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
            <PersonalInformation
              InfoField={InfoField}
              isEditing={isEditing}
              fullName={fullName}
              employeeType={displayEmployeeType}
              resolvedEmployeeType={displayEmployeeType}
              editLastName={editLastName}
              setEditLastName={setEditLastName}
              editFirstName={editFirstName}
              setEditFirstName={setEditFirstName}
              editMiddleName={editMiddleName}
              setEditMiddleName={setEditMiddleName}
              noMiddleName={noMiddleName}
              setNoMiddleName={setNoMiddleName}
              editMiddleInitial={editMiddleInitial}
              setEditMiddleInitial={setEditMiddleInitial}
              normalizeMiddleInitialInput={normalizeMiddleInitialInput}
              editHomeAddress={editHomeAddress}
              setEditHomeAddress={setEditHomeAddress}
              editBirthdate={editBirthdate}
              setEditBirthdate={setEditBirthdate}
              ageValue={ageValue}
              editPlaceOfBirth={editPlaceOfBirth}
              setEditPlaceOfBirth={setEditPlaceOfBirth}
              editCivilStatus={editCivilStatus}
              editCivilStatusId={editCivilStatusId}
              setEditCivilStatus={setEditCivilStatus}
              setEditCivilStatusId={setEditCivilStatusId}
              civilStatuses={civilStatuses}
              editSex={editSex}
              editSexId={editSexId}
              setEditSex={setEditSex}
              setEditSexId={setEditSexId}
              sexes={sexes}
              editPersonalEmail={editPersonalEmail}
              setEditPersonalEmail={setEditPersonalEmail}
              editWorkEmail={editWorkEmail}
              setEditWorkEmail={setEditWorkEmail}
              editMobileNumber={editMobileNumber}
              setEditMobileNumber={setEditMobileNumber}
              formatEmployeeType={formatEmployeeType}
              formatValue={formatValue}
              formatDate={formatDate}
              getValidationError={getValidationError}
            />
          )}
          {activeSection === "work" && (
            <WorkInformation
              InfoField={InfoField}
              isEditing={isEditing}
              resolvedSchoolName={resolvedDetails?.school_name}
              employeeSchoolName={employee.schoolName}
              workDateOfFirstAppointment={resolvedDetails?.date_of_first_appointment || null}
              setEditDateOfFirstAppointment={setEditDateOfFirstAppointment}
              workSg={isEditing ? editWorkSg : resolvedWorkSg}
              setEditWorkSg={setEditWorkSg}
              editEmployeeType={editEmployeeType}
              setEditEmployeeType={setEditEmployeeType}
              editPosition={editPosition}
              setEditPosition={setEditPosition}
              editPositionId={editPositionId}
              setEditPositionId={setEditPositionId}
              editPlantillaNo={editPlantillaNo}
              setEditPlantillaNo={handleEditPlantillaNoChange}
              editCurrentEmployeeType={editCurrentEmployeeType}
              setEditCurrentEmployeeType={setEditCurrentEmployeeType}
              editCurrentPosition={editCurrentPosition}
              setEditCurrentPosition={setEditCurrentPosition}
              currentPositionSearch={currentPositionSearch}
              setCurrentPositionSearch={setCurrentPositionSearch}
              showCurrentPositionDropdown={showCurrentPositionDropdown}
              setShowCurrentPositionDropdown={setShowCurrentPositionDropdown}
              editCurrentPlantillaNo={editCurrentPlantillaNo}
              setEditCurrentPlantillaNo={handleEditCurrentPlantillaNoChange}
              editCurrentAppointmentDate={editCurrentAppointmentDate}
              setEditCurrentAppointmentDate={setEditCurrentAppointmentDate}
              editCurrentSg={editCurrentSg}
              setEditCurrentSg={setEditCurrentSg}
              positionSearch={positionSearch}
              setPositionSearch={setPositionSearch}
              showPositionDropdown={showPositionDropdown}
              setShowPositionDropdown={setShowPositionDropdown}
              positions={positions}
              editDistrict={editDistrict}
              setEditDistrict={setEditDistrict}
              districtSearch={districtSearch}
              setDistrictSearch={setDistrictSearch}
              showDistrictDropdown={showDistrictDropdown}
              setShowDistrictDropdown={setShowDistrictDropdown}
              districts={districts}
              editSchoolName={editSchoolName}
              setEditSchoolName={setEditSchoolName}
              editSchoolId={editSchoolId}
              setEditSchoolId={setEditSchoolId}
              schoolSearch={schoolSearch}
              setSchoolSearch={setSchoolSearch}
              showSchoolDropdown={showSchoolDropdown}
              setShowSchoolDropdown={setShowSchoolDropdown}
              schools={schools}
              editEmployeeNo={editEmployeeNo}
              setEditEmployeeNo={setEditEmployeeNo}
              editLicenseNoPrc={editLicenseNoPrc}
              setEditLicenseNoPrc={setEditLicenseNoPrc}
              editTin={editTin}
              setEditTin={setEditTin}
              editGsisBpNo={editGsisBpNo}
              setEditGsisBpNo={setEditGsisBpNo}
              editGsisCrnNo={editGsisCrnNo}
              setEditGsisCrnNo={setEditGsisCrnNo}
              editPagibigNo={editPagibigNo}
              setEditPagibigNo={setEditPagibigNo}
              editPhilhealthNo={editPhilhealthNo}
              setEditPhilhealthNo={setEditPhilhealthNo}
              formatEmployeeType={formatEmployeeType}
              formatValue={formatValue}
              formatDate={formatDate}
              getValidationError={getValidationError}
              formatMaskedId={formatMaskedId}
              formatGsisBp={formatGsisBp}
              normalize12Digits={normalize12Digits}
              normalizePhilhealth={normalizePhilhealth}
              GOV_ID_MASKS={{ tin: GOV_ID_MASKS.tin }}
            />
          )}
          {activeSection === "salary" && (
            <SalaryInformation
              InfoField={InfoField}
              isEditing={isEditing}
              canAddSalaryHistory={canManageSalaryHistory}
              canEditSalaryHistory={canManageSalaryHistory}
              salaryDateOfFirstAppointment={resolvedSalaryDate}
              setEditDateOfFirstAppointment={setEditDateOfFirstAppointment}
              salaryYearsInService={resolvedYearsInService}
              salaryLoyaltyBonus={resolvedLoyaltyBonus}
              formatDate={formatDate}
              formatYearsInService={formatYearsInService}
              formatLoyaltyBonus={formatLoyaltyBonus}
              getValidationError={getValidationError}
              salaryHistoryRows={salaryHistoryRows}
              salaryHistoryLoading={salaryHistoryLoading}
              salaryHistoryError={salaryHistoryError}
              salaryHistoryCreateDraft={salaryHistoryCreateDraft}
              salaryHistoryCreating={salaryHistoryCreating}
              salaryHistoryCreateError={salaryHistoryCreateError}
              salaryHistoryEditDraft={salaryHistoryEditDraft}
              salaryHistoryUpdating={salaryHistoryUpdating}
              salaryHistoryUpdateError={salaryHistoryUpdateError}
              salaryHistoryRemarkOptions={[...SALARY_HISTORY_REMARK_OPTIONS]}
              onStartAddSalaryHistory={handleStartAddSalaryHistory}
              onCancelAddSalaryHistory={handleCancelAddSalaryHistory}
              onChangeSalaryHistoryDraft={handleChangeSalaryHistoryDraft}
              onSubmitSalaryHistory={handleSubmitSalaryHistory}
              onStartEditSalaryHistory={handleStartEditSalaryHistory}
              onCancelEditSalaryHistory={handleCancelEditSalaryHistory}
              onChangeSalaryHistoryEditDraft={handleChangeSalaryHistoryEditDraft}
              onSubmitSalaryHistoryUpdate={handleSubmitSalaryHistoryUpdate}
              employeeName={fullName}
              employeeSex={resolvedDetails?.sex}
              employeeLastName={resolvedDetails?.last_name || employee.lastName}
              schoolName={resolvedDetails?.school_name || employee.schoolName}
              employeeNumber={resolvedDetails?.employee_no || ""}
              districtName={resolvedDetails?.district || resolvedDetails?.work_district || ""}
              currentPosition={resolvedDetails?.current_position || resolvedDetails?.position || ""}
              currentSalaryGrade={resolvedDetails?.current_sg || resolvedDetails?.sg}
              currentPlantillaNo={resolvedDetails?.current_plantilla_no || resolvedDetails?.plantilla_no || ""}
            />
          )}
          <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {!isEditing && canEdit && (
              <button
                type="button"
                onClick={() => {
                  const baselineSg = String(resolvedWorkSg ?? "").trim();
                  setEditWorkSg(baselineSg);
                  setInitialWorkSg(baselineSg);
                  setIsEditing(true);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Pencil size={14} />
                Edit Details
              </button>
            )}

            {isEditing && (
              <>
                {hasEditChanges && (
                  <button
                    type="button"
                    onClick={createClearHandler(
                      handleClearEditChanges,
                      hasEditChanges,
                    )}
                    disabled={
                      isSaving || salaryHistoryCreating || salaryHistoryUpdating
                    }
                    className="mr-auto cursor-pointer items-center gap-1.5 rounded-xl text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear All
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (hasPendingSalaryHistoryDraft) {
                      showToast(
                        "Finish Salary History row action first (save or cancel row edit).",
                        "error",
                      );
                      return;
                    }
                    setIsEditing(false);
                  }}
                  disabled={
                    isSaving || salaryHistoryCreating || salaryHistoryUpdating
                  }
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={14} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleOpenSaveConfirmation}
                  disabled={
                    isSaving || salaryHistoryCreating || salaryHistoryUpdating
                  }
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={14} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <SaveChanges
        visible={isSaveConfirmOpen}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        isLoading={isSaving}
      />
    </div>
  );
}