import React, { useMemo, useRef, useState } from "react";
import { Check, FileText, Info, Pencil, Plus, X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type SalaryHistoryRecord = {
  id: number;
  employee_id?: number;
  salary_date?: string | null;
  plantilla?: string | null;
  sg?: string | number | null;
  step?: string | number | null;
  salary?: string | number | null;
  increment_amount?: string | number | null;
  increment_mode?: "AUTO" | "MANUAL" | string | null;
  remarks?: string | null;
};

export type SalaryHistoryDraft = {
  date: string;
  plantilla: string;
  sg: string;
  step: string;
  salary: string;
  increment: string;
  remarks: string;
};

export type SalaryHistoryEditDraft = SalaryHistoryDraft & {
  id: number;
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

type SalaryInformationProps = {
  InfoField: React.ComponentType<InfoFieldProps>;
  isEditing: boolean;
  canAddSalaryHistory: boolean;
  canEditSalaryHistory: boolean;
  salaryDateOfFirstAppointment: string | null | undefined;
  setEditDateOfFirstAppointment: (value: string) => void;
  salaryYearsInService: number | string | null | undefined;
  salaryLoyaltyBonus: string | number | boolean | null | undefined;
  formatDate: (value: string | null | undefined) => string;
  formatYearsInService: (value: number | string | null | undefined) => string;
  formatLoyaltyBonus: (
    value: string | number | boolean | null | undefined,
  ) => string;
  getValidationError: (field: string) => string | null;
  salaryHistoryRows: SalaryHistoryRecord[];
  salaryHistoryLoading: boolean;
  salaryHistoryError: string | null;
  salaryHistoryCreateDraft: SalaryHistoryDraft | null;
  salaryHistoryCreating: boolean;
  salaryHistoryCreateError: string | null;
  salaryHistoryEditDraft: SalaryHistoryEditDraft | null;
  salaryHistoryUpdating: boolean;
  salaryHistoryUpdateError: string | null;
  salaryHistoryRemarkOptions: string[];
  onStartAddSalaryHistory: () => void;
  onCancelAddSalaryHistory: () => void;
  onChangeSalaryHistoryDraft: (
    field: keyof SalaryHistoryDraft,
    value: string,
  ) => void;
  onSubmitSalaryHistory: () => void;
  onStartEditSalaryHistory: (row: SalaryHistoryRecord) => void;
  onCancelEditSalaryHistory: () => void;
  onChangeSalaryHistoryEditDraft: (
    field: keyof SalaryHistoryDraft,
    value: string,
  ) => void;
  onSubmitSalaryHistoryUpdate: () => void;

  employeeName: string;
  employeeSex: string | null | undefined;
  employeeLastName: string;
  schoolName: string;
  employeeNumber: string;
  districtName: string;
  currentPosition: string;
  currentSalaryGrade: string | number | null | undefined;
  currentPlantillaNo: string;

  editFirstName?: string;
  editMiddleName?: string;
  editLastName?: string;
  fullName?: string;
  editSex?: string;
  resolvedSchoolName?: string | null;
  employeeSchoolName?: string;
  editSchoolName?: string;
  editDistrict?: string;
  editEmployeeNo?: string;
  editCurrentPosition?: string;
  editCurrentSg?: string | number | null | undefined;
  editCurrentPlantillaNo?: string;

  firstName?: string;
  middleName?: string;
  lastName?: string;
  school_name?: string;
  employee_no?: string;
  district?: string;
} & Record<string, unknown>;

type NoticeModalState = {
  isOpen: boolean;
  row: SalaryHistoryRecord | null;
  stationNo: string;
  headOfAgencyName: string;
  headOfAgencyTitle: string;
};

const NOTICE_ELIGIBLE_REMARKS = new Set([
  "Step Increment",
  "Step Increment Increase",
]);

const PDF_PAGE_WIDTH_MM = 210;
const PDF_PAGE_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 25.4;
const PDF_CONTENT_WIDTH_MM = PDF_PAGE_WIDTH_MM - PDF_MARGIN_MM * 2;
const PDF_CONTENT_HEIGHT_MM = PDF_PAGE_HEIGHT_MM - PDF_MARGIN_MM * 2;
const DOCUMENT_FONT = '"Arial Narrow", Arial, sans-serif';

const normalizeText = (value: unknown): string => String(value ?? "").trim();

const isMeaningfulText = (value: unknown): boolean => {
  const normalized = normalizeText(value).replace(/\s+/g, " ").trim();
  if (!normalized) return false;

  const lowered = normalized.toLowerCase();
  return !["n/a", "na", "null", "undefined", "-", "--"].includes(lowered);
};

const firstMeaningful = (...values: unknown[]): string => {
  for (const value of values) {
    if (isMeaningfulText(value)) {
      return normalizeText(value).replace(/\s+/g, " ").trim();
    }
  }
  return "";
};

const buildFullName = (...parts: unknown[]): string =>
  parts
    .map((part) => normalizeText(part))
    .filter((part) => isMeaningfulText(part))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const formatCellValue = (value: string | number | null | undefined): string => {
  const text = firstMeaningful(value);
  return text || "-";
};

const formatDateCell = (value: string | null | undefined): string => {
  if (!value) return "-";

  const raw = String(value).trim();
  if (!raw || raw === "0000-00-00") return "-";

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

const formatAmountCell = (
  value: string | number | null | undefined,
): string => {
  if (value === null || value === undefined || value === "") return "-";

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return formatCellValue(value);
  }

  return `PHP ${numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const toMoneyNumber = (value: string | number | null | undefined): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
};

const toDateOnly = (value: string | null | undefined): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const formatNoticeCurrency = (value: string | number | null | undefined) => {
  const numeric = toMoneyNumber(value);
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const subtractOneDay = (dateString: string): string => {
  if (!dateString) return "";
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() - 1);
  return parsed.toISOString().slice(0, 10);
};

const getSalutation = (sex: string | null | undefined): "Ms." | "Mr." => {
  const normalized = String(sex || "").trim().toLowerCase();
  if (normalized === "f" || normalized === "female") return "Ms.";
  return "Mr.";
};

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_");

const getValueByPath = (source: unknown, path: string): unknown => {
  if (!source || typeof source !== "object") return undefined;

  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
};

const getFirstMeaningfulFromSources = (
  sources: Array<unknown>,
  candidatePaths: string[],
): string => {
  for (const source of sources) {
    for (const path of candidatePaths) {
      const value = getValueByPath(source, path);
      if (isMeaningfulText(value)) {
        return normalizeText(value).replace(/\s+/g, " ").trim();
      }
    }
  }
  return "";
};

const baseInputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

const tableInputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

const actionPrimaryClass =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

const actionSecondaryClass =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60";

const actionAccentClass =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

export default function SalaryInformation({
  InfoField,
  isEditing,
  canAddSalaryHistory,
  canEditSalaryHistory,
  salaryDateOfFirstAppointment,
  setEditDateOfFirstAppointment,
  salaryYearsInService,
  salaryLoyaltyBonus,
  formatDate,
  formatYearsInService,
  formatLoyaltyBonus,
  getValidationError,
  salaryHistoryRows,
  salaryHistoryLoading,
  salaryHistoryError,
  salaryHistoryCreateDraft,
  salaryHistoryCreating,
  salaryHistoryCreateError,
  salaryHistoryEditDraft,
  salaryHistoryUpdating,
  salaryHistoryUpdateError,
  salaryHistoryRemarkOptions,
  onStartAddSalaryHistory,
  onCancelAddSalaryHistory,
  onChangeSalaryHistoryDraft,
  onSubmitSalaryHistory,
  onStartEditSalaryHistory,
  onCancelEditSalaryHistory,
  onChangeSalaryHistoryEditDraft,
  onSubmitSalaryHistoryUpdate,
  employeeName,
  employeeSex,
  employeeLastName,
  schoolName,
  employeeNumber,
  districtName,
  currentPosition,
  currentSalaryGrade,
  currentPlantillaNo,
  editFirstName,
  editMiddleName,
  editLastName,
  fullName,
  editSex,
  resolvedSchoolName,
  employeeSchoolName,
  editSchoolName,
  editDistrict,
  editEmployeeNo,
  editCurrentPosition,
  editCurrentSg,
  editCurrentPlantillaNo,
  firstName,
  middleName,
  lastName,
  school_name,
  employee_no,
  district,
  ...rawProps
}: SalaryInformationProps) {
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [noticeModal, setNoticeModal] = useState<NoticeModalState>({
    isOpen: false,
    row: null,
    stationNo: "",
    headOfAgencyName: "JUAN B. DELA CRUZ",
    headOfAgencyTitle: "Head of Agency",
  });

  const possibleSources = useMemo(
    () => [
      rawProps,
      rawProps.employee,
      rawProps.employeeData,
      rawProps.employeeDetails,
      rawProps.employeeProfile,
      rawProps.personalInformation,
      rawProps.workInformation,
      rawProps.profile,
      rawProps.data,
      rawProps.record,
      rawProps.selectedEmployee,
      rawProps.selectedEmployeeData,
      rawProps.viewEmployee,
      rawProps.employeeInfo,
      rawProps.details,
    ],
    [rawProps],
  );

  const sortedSalaryRows = useMemo(() => {
    return [...salaryHistoryRows].sort((a, b) => {
      const aDate = toDateOnly(a.salary_date);
      const bDate = toDateOnly(b.salary_date);

      if (aDate !== bDate) {
        return aDate.localeCompare(bDate);
      }

      return Number(a.id || 0) - Number(b.id || 0);
    });
  }, [salaryHistoryRows]);

  const resolvedEmployeeName = useMemo(() => {
    const builtEditName = buildFullName(
      editFirstName,
      editMiddleName,
      editLastName,
    );

    const builtDirectName = buildFullName(firstName, middleName, lastName);

    const nestedName =
      getFirstMeaningfulFromSources(possibleSources, [
        "employeeName",
        "fullName",
        "full_name",
        "name",
      ]) ||
      buildFullName(
        getFirstMeaningfulFromSources(possibleSources, [
          "firstName",
          "first_name",
          "employee.firstName",
          "employee.first_name",
          "employeeData.firstName",
          "employeeData.first_name",
          "employeeDetails.firstName",
          "employeeDetails.first_name",
          "personalInformation.firstName",
          "personalInformation.first_name",
          "data.firstName",
          "data.first_name",
        ]),
        getFirstMeaningfulFromSources(possibleSources, [
          "middleName",
          "middle_name",
          "employee.middleName",
          "employee.middle_name",
          "employeeData.middleName",
          "employeeData.middle_name",
          "employeeDetails.middleName",
          "employeeDetails.middle_name",
          "personalInformation.middleName",
          "personalInformation.middle_name",
          "data.middleName",
          "data.middle_name",
        ]),
        getFirstMeaningfulFromSources(possibleSources, [
          "lastName",
          "last_name",
          "employee.lastName",
          "employee.last_name",
          "employeeData.lastName",
          "employeeData.last_name",
          "employeeDetails.lastName",
          "employeeDetails.last_name",
          "personalInformation.lastName",
          "personalInformation.last_name",
          "data.lastName",
          "data.last_name",
        ]),
      );

    return firstMeaningful(
      fullName,
      employeeName,
      builtEditName,
      builtDirectName,
      nestedName,
    );
  }, [
    fullName,
    employeeName,
    editFirstName,
    editMiddleName,
    editLastName,
    firstName,
    middleName,
    lastName,
    possibleSources,
  ]);

  const resolvedSchoolDisplay = useMemo(() => {
    return firstMeaningful(
      schoolName,
      resolvedSchoolName,
      editSchoolName,
      employeeSchoolName,
      school_name,
      getFirstMeaningfulFromSources(possibleSources, [
        "schoolName",
        "school_name",
        "schoolAssigned",
        "school_assigned",
        "employee.schoolName",
        "employee.school_name",
        "employeeData.schoolName",
        "employeeData.school_name",
        "employeeDetails.schoolName",
        "employeeDetails.school_name",
        "workInformation.schoolName",
        "workInformation.school_name",
        "data.schoolName",
        "data.school_name",
      ]),
    );
  }, [
    schoolName,
    resolvedSchoolName,
    editSchoolName,
    employeeSchoolName,
    school_name,
    possibleSources,
  ]);

  const resolvedEmployeeNumber = useMemo(() => {
    return firstMeaningful(
      employeeNumber,
      editEmployeeNo,
      employee_no,
      getFirstMeaningfulFromSources(possibleSources, [
        "employeeNumber",
        "employee_no",
        "employeeNo",
        "employee.no",
        "employee.employee_no",
        "employee.employeeNo",
        "employeeData.employee_no",
        "employeeData.employeeNo",
        "employeeDetails.employee_no",
        "employeeDetails.employeeNo",
        "workInformation.employee_no",
        "workInformation.employeeNo",
        "data.employee_no",
        "data.employeeNo",
      ]),
    );
  }, [employeeNumber, editEmployeeNo, employee_no, possibleSources]);

  const resolvedDistrictDisplay = useMemo(() => {
    return firstMeaningful(
      districtName,
      editDistrict,
      district,
      getFirstMeaningfulFromSources(possibleSources, [
        "district",
        "districtName",
        "employee.district",
        "employee.districtName",
        "employeeData.district",
        "employeeData.districtName",
        "employeeDetails.district",
        "employeeDetails.districtName",
        "workInformation.district",
        "data.district",
      ]),
    );
  }, [districtName, editDistrict, district, possibleSources]);

  const resolvedCurrentPosition = useMemo(
    () =>
      firstMeaningful(
        currentPosition,
        editCurrentPosition,
        getFirstMeaningfulFromSources(possibleSources, [
          "currentPosition",
          "current_position",
          "position",
          "employee.currentPosition",
          "employee.current_position",
          "workInformation.currentPosition",
          "workInformation.current_position",
          "workInformation.position",
          "data.currentPosition",
          "data.current_position",
        ]),
      ),
    [currentPosition, editCurrentPosition, possibleSources],
  );

  const resolvedCurrentSalaryGrade = useMemo(
    () =>
      firstMeaningful(
        currentSalaryGrade,
        editCurrentSg,
        getFirstMeaningfulFromSources(possibleSources, [
          "currentSalaryGrade",
          "current_sg",
          "currentSG",
          "sg",
          "employee.current_sg",
          "employee.currentSalaryGrade",
          "workInformation.current_sg",
          "workInformation.currentSalaryGrade",
          "workInformation.sg",
          "data.current_sg",
          "data.currentSalaryGrade",
        ]),
      ),
    [currentSalaryGrade, editCurrentSg, possibleSources],
  );

  const resolvedCurrentPlantilla = useMemo(
    () =>
      firstMeaningful(
        currentPlantillaNo,
        editCurrentPlantillaNo,
        getFirstMeaningfulFromSources(possibleSources, [
          "currentPlantillaNo",
          "current_plantilla_no",
          "plantilla_no",
          "employee.currentPlantillaNo",
          "employee.current_plantilla_no",
          "workInformation.currentPlantillaNo",
          "workInformation.current_plantilla_no",
          "workInformation.plantilla_no",
          "data.currentPlantillaNo",
          "data.current_plantilla_no",
        ]),
      ),
    [currentPlantillaNo, editCurrentPlantillaNo, possibleSources],
  );

  const resolvedNoticeSex = useMemo(
    () =>
      firstMeaningful(
        employeeSex,
        editSex,
        getFirstMeaningfulFromSources(possibleSources, [
          "sex",
          "employeeSex",
          "employee.sex",
          "employee.employeeSex",
          "employeeData.sex",
          "employeeDetails.sex",
          "personalInformation.sex",
          "data.sex",
        ]),
      ),
    [employeeSex, editSex, possibleSources],
  );

  const resolvedNoticeLastName = useMemo(() => {
    const directLastName = firstMeaningful(employeeLastName);
    if (directLastName) return directLastName;

    const editLast = firstMeaningful(editLastName);
    if (editLast) return editLast;

    const directLast = firstMeaningful(lastName);
    if (directLast) return directLast;

    const nestedLast = getFirstMeaningfulFromSources(possibleSources, [
      "lastName",
      "last_name",
      "employee.lastName",
      "employee.last_name",
      "employeeData.lastName",
      "employeeData.last_name",
      "employeeDetails.lastName",
      "employeeDetails.last_name",
      "personalInformation.lastName",
      "personalInformation.last_name",
      "data.lastName",
      "data.last_name",
    ]);
    if (nestedLast) return nestedLast;

    const wholeName = firstMeaningful(resolvedEmployeeName);
    if (!wholeName) return "";

    const pieces = wholeName.split(/\s+/);
    return pieces[pieces.length - 1] || "";
  }, [
    employeeLastName,
    editLastName,
    lastName,
    resolvedEmployeeName,
    possibleSources,
  ]);

  const getPreviousSalary = (row: SalaryHistoryRecord): number => {
    const currentIndex = sortedSalaryRows.findIndex(
      (item) => Number(item.id) === Number(row.id),
    );

    if (currentIndex <= 0) {
      return 0;
    }

    return toMoneyNumber(sortedSalaryRows[currentIndex - 1]?.salary);
  };

  const isNoticeEligibleRow = (row: SalaryHistoryRecord) =>
    NOTICE_ELIGIBLE_REMARKS.has(String(row.remarks || "").trim());

  const openNoticeModal = (row: SalaryHistoryRecord) => {
    setNoticeModal((current) => ({
      ...current,
      isOpen: true,
      row,
    }));
  };

  const closeNoticeModal = () => {
    if (isDownloadingPdf) return;
    setNoticeModal((current) => ({
      ...current,
      isOpen: false,
      row: null,
    }));
  };

  const handleDownloadPdf = async () => {
    if (!pdfRef.current || !noticeModal.row || isDownloadingPdf) return;

    try {
      setIsDownloadingPdf(true);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      pdf.addImage(
        imageData,
        "PNG",
        0,
        0,
        PDF_PAGE_WIDTH_MM,
        PDF_PAGE_HEIGHT_MM,
        undefined,
        "FAST",
      );

      const safeEmployeeName = sanitizeFileName(
        resolvedEmployeeName || employeeName || "employee",
      );
      pdf.save(`NOSI_${safeEmployeeName}.pdf`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const activeNoticeRow = noticeModal.row;
  const activeNoticeEffectivityDate = toDateOnly(activeNoticeRow?.salary_date);
  const previousDate = subtractOneDay(activeNoticeEffectivityDate);
  const previousSalary = getPreviousSalary(activeNoticeRow || { id: 0 });
  const newSalary = toMoneyNumber(activeNoticeRow?.salary);
  const incrementAmount =
    activeNoticeRow?.increment_amount !== null &&
    activeNoticeRow?.increment_amount !== undefined &&
    activeNoticeRow?.increment_amount !== ""
      ? toMoneyNumber(activeNoticeRow?.increment_amount)
      : Number((newSalary - previousSalary).toFixed(2));

  const salutation = getSalutation(resolvedNoticeSex);
  const noticeLastName = resolvedNoticeLastName.replace(/\s+/g, " ").trim();

  const previousStepValue =
    Number(formatCellValue(activeNoticeRow?.step)) > 1
      ? String(Number(formatCellValue(activeNoticeRow?.step)) - 1)
      : formatCellValue(activeNoticeRow?.step);

  return (
    <>
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-1 sm:mb-5">
          <h3 className="text-lg font-bold text-gray-800 sm:text-xl">
            Salary Information
          </h3>
          <p className="text-sm text-gray-500">
            Employment timeline, bonus, and salary history information
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            <InfoField
              label="Date of First Appointment"
              value={formatDate(salaryDateOfFirstAppointment)}
              isEditing={isEditing}
              errorMessage={getValidationError("Date of First Appointment")}
            >
              <input
                type="date"
                value={salaryDateOfFirstAppointment || ""}
                onChange={(e) => setEditDateOfFirstAppointment(e.target.value)}
                className={baseInputClass}
              />
            </InfoField>

            <InfoField
              label="Years in Service"
              value={formatYearsInService(salaryYearsInService)}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={formatYearsInService(salaryYearsInService)}
                  className={`${baseInputClass} bg-gray-50 cursor-not-allowed`}
                  title="Auto-calculated from appointment date"
                />
                <span className="text-xs text-gray-500" title="Auto-calculated by backend">
                  <Info size={14} className="text-blue-500" />
                </span>
              </div>
            </InfoField>

            <InfoField
              label="Loyalty Bonus"
              value={formatLoyaltyBonus(salaryLoyaltyBonus)}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={formatLoyaltyBonus(salaryLoyaltyBonus)}
                  className={`${baseInputClass} bg-gray-50 cursor-not-allowed`}
                  title="Auto-calculated from years in service"
                />
                <span className="text-xs text-gray-500" title="Auto-calculated by backend">
                  <Info size={14} className="text-blue-500" />
                </span>
              </div>
            </InfoField>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 sm:text-base">
                  Salary History
                </h4>
                <p className="mt-0.5 text-xs text-gray-500">
                  Track plantilla, grade, salary, increment, and remarks
                </p>
              </div>

              {canAddSalaryHistory && !salaryHistoryCreateDraft ? (
                <button
                  type="button"
                  onClick={onStartAddSalaryHistory}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <Plus size={14} />
                  Add row
                </button>
              ) : null}
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-245 border-collapse text-sm">
                  <thead className="bg-blue-100">
                    <tr className="border-b border-blue-200 text-xs uppercase tracking-wide text-blue-800">
                      <th className="px-3 py-3 text-left font-semibold">Date</th>
                      <th className="px-3 py-3 text-left font-semibold">
                        Plantilla
                      </th>
                      <th className="px-3 py-3 text-left font-semibold">SG</th>
                      <th className="px-3 py-3 text-left font-semibold">Step</th>
                      <th className="px-3 py-3 text-right font-semibold">
                        Salary
                      </th>
                      <th className="px-3 py-3 text-right font-semibold">
                        Increment
                      </th>
                      <th className="px-3 py-3 text-left font-semibold">
                        Remarks
                      </th>
                      <th className="px-3 py-3 text-center font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {salaryHistoryLoading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-sm text-gray-500"
                        >
                          Loading salary information...
                        </td>
                      </tr>
                    ) : salaryHistoryError ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-sm font-medium text-red-600"
                        >
                          {salaryHistoryError}
                        </td>
                      </tr>
                    ) : (
                      <>
                        {salaryHistoryRows.length === 0 &&
                        !salaryHistoryCreateDraft ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-10 text-center text-sm text-gray-500"
                            >
                              No salary information found.
                            </td>
                          </tr>
                        ) : null}

                        {salaryHistoryRows.map((row, index) => {
                          const rowBackgroundClass =
                            index % 2 === 1 ? "bg-blue-50/40" : "bg-white";
                          const isEditingRow =
                            salaryHistoryEditDraft?.id === row.id;
                          const canGenerateNotice = isNoticeEligibleRow(row);

                          return (
                            <tr
                              key={row.id}
                              className={`border-b border-gray-100 align-top transition ${rowBackgroundClass}`}
                            >
                              <td className="px-3 py-3 font-medium text-gray-900">
                                {isEditingRow ? (
                                  <input
                                    type="date"
                                    value={salaryHistoryEditDraft?.date || ""}
                                    onChange={(e) =>
                                      onChangeSalaryHistoryEditDraft(
                                        "date",
                                        e.target.value,
                                      )
                                    }
                                    disabled={salaryHistoryUpdating}
                                    className={tableInputClass}
                                  />
                                ) : (
                                  formatDateCell(row.salary_date)
                                )}
                              </td>

                              <td className="px-3 py-3 text-gray-700">
                                {isEditingRow ? (
                                  <input
                                    type="text"
                                    value={
                                      salaryHistoryEditDraft?.plantilla || ""
                                    }
                                    onChange={(e) =>
                                      onChangeSalaryHistoryEditDraft(
                                        "plantilla",
                                        e.target.value,
                                      )
                                    }
                                    disabled={salaryHistoryUpdating}
                                    className={tableInputClass}
                                  />
                                ) : (
                                  formatCellValue(row.plantilla)
                                )}
                              </td>

                              <td className="px-3 py-3 text-gray-700">
                                {isEditingRow ? (
                                  <input
                                    type="text"
                                    value={salaryHistoryEditDraft?.sg || ""}
                                    onChange={(e) =>
                                      onChangeSalaryHistoryEditDraft(
                                        "sg",
                                        e.target.value,
                                      )
                                    }
                                    disabled={salaryHistoryUpdating}
                                    className={tableInputClass}
                                  />
                                ) : (
                                  formatCellValue(row.sg)
                                )}
                              </td>

                              <td className="px-3 py-3 text-gray-700">
                                {isEditingRow ? (
                                  <input
                                    type="text"
                                    value={salaryHistoryEditDraft?.step || ""}
                                    onChange={(e) =>
                                      onChangeSalaryHistoryEditDraft(
                                        "step",
                                        e.target.value,
                                      )
                                    }
                                    disabled={salaryHistoryUpdating}
                                    className={tableInputClass}
                                  />
                                ) : (
                                  formatCellValue(row.step)
                                )}
                              </td>

                              <td className="px-3 py-3 text-right font-medium text-gray-900">
                                {isEditingRow ? (
                                  <input
                                    type="number"
                                    value={salaryHistoryEditDraft?.salary || ""}
                                    onChange={(e) =>
                                      onChangeSalaryHistoryEditDraft(
                                        "salary",
                                        e.target.value,
                                      )
                                    }
                                    disabled={salaryHistoryUpdating}
                                    min="0"
                                    step="0.01"
                                    className={`${tableInputClass} text-right`}
                                  />
                                ) : (
                                  formatAmountCell(row.salary)
                                )}
                              </td>

                              <td className="px-3 py-3 text-right font-medium text-gray-900">
                                {isEditingRow ? (
                                  <input
                                    type="number"
                                    value={
                                      salaryHistoryEditDraft?.increment || ""
                                    }
                                    onChange={(e) =>
                                      onChangeSalaryHistoryEditDraft(
                                        "increment",
                                        e.target.value,
                                      )
                                    }
                                    disabled={salaryHistoryUpdating}
                                    min="0"
                                    step="0.01"
                                    placeholder="Auto"
                                    className={`${tableInputClass} text-right`}
                                  />
                                ) : (
                                  formatAmountCell(row.increment_amount)
                                )}
                              </td>

                              <td className="px-3 py-3 text-gray-700">
                                {isEditingRow ? (
                                  <select
                                    value={salaryHistoryEditDraft?.remarks || ""}
                                    onChange={(e) =>
                                      onChangeSalaryHistoryEditDraft(
                                        "remarks",
                                        e.target.value,
                                      )
                                    }
                                    disabled={salaryHistoryUpdating}
                                    className={`${tableInputClass} cursor-pointer`}
                                  >
                                    <option value="">Select remark</option>
                                    {salaryHistoryRemarkOptions.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  formatCellValue(row.remarks)
                                )}
                              </td>

                              <td className="px-3 py-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  {canEditSalaryHistory ? (
                                    <>
                                      {isEditingRow ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={onSubmitSalaryHistoryUpdate}
                                            disabled={salaryHistoryUpdating}
                                            className={actionPrimaryClass}
                                            title="Update salary row"
                                          >
                                            <Check size={14} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={onCancelEditSalaryHistory}
                                            disabled={salaryHistoryUpdating}
                                            className={actionSecondaryClass}
                                            title="Cancel"
                                          >
                                            <X size={14} />
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onStartEditSalaryHistory(row)
                                          }
                                          disabled={Boolean(
                                            salaryHistoryCreateDraft,
                                          )}
                                          className={actionAccentClass}
                                          title="Edit salary row"
                                        >
                                          <Pencil size={13} />
                                        </button>
                                      )}
                                    </>
                                  ) : null}

                                  {canGenerateNotice && !isEditingRow ? (
                                    <button
                                      type="button"
                                      onClick={() => openNoticeModal(row)}
                                      disabled={Boolean(salaryHistoryCreateDraft)}
                                      className="cursor-pointer inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                      title="Generate NOSI PDF"
                                    >
                                      <FileText size={13} />
                                      PDF
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {salaryHistoryCreateDraft ? (
                          <tr className="border-b border-blue-100 bg-blue-50/70 align-top">
                            <td className="px-3 py-3">
                              <input
                                type="date"
                                value={salaryHistoryCreateDraft.date}
                                onChange={(e) =>
                                  onChangeSalaryHistoryDraft(
                                    "date",
                                    e.target.value,
                                  )
                                }
                                disabled={salaryHistoryCreating}
                                className={tableInputClass}
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={salaryHistoryCreateDraft.plantilla}
                                onChange={(e) =>
                                  onChangeSalaryHistoryDraft(
                                    "plantilla",
                                    e.target.value,
                                  )
                                }
                                disabled={salaryHistoryCreating}
                                placeholder="Plantilla"
                                className={tableInputClass}
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={salaryHistoryCreateDraft.sg}
                                onChange={(e) =>
                                  onChangeSalaryHistoryDraft("sg", e.target.value)
                                }
                                disabled={salaryHistoryCreating}
                                placeholder="SG"
                                className={tableInputClass}
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="text"
                                value={salaryHistoryCreateDraft.step}
                                onChange={(e) =>
                                  onChangeSalaryHistoryDraft(
                                    "step",
                                    e.target.value,
                                  )
                                }
                                disabled={salaryHistoryCreating}
                                placeholder="Step"
                                className={tableInputClass}
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                value={salaryHistoryCreateDraft.salary}
                                onChange={(e) =>
                                  onChangeSalaryHistoryDraft(
                                    "salary",
                                    e.target.value,
                                  )
                                }
                                disabled={salaryHistoryCreating}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className={`${tableInputClass} text-right`}
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                type="number"
                                value={salaryHistoryCreateDraft.increment}
                                onChange={(e) =>
                                  onChangeSalaryHistoryDraft(
                                    "increment",
                                    e.target.value,
                                  )
                                }
                                disabled={salaryHistoryCreating}
                                min="0"
                                step="0.01"
                                placeholder="Auto"
                                className={`${tableInputClass} text-right`}
                              />
                            </td>

                            <td className="px-3 py-3">
                              <select
                                value={salaryHistoryCreateDraft.remarks}
                                onChange={(e) =>
                                  onChangeSalaryHistoryDraft(
                                    "remarks",
                                    e.target.value,
                                  )
                                }
                                disabled={salaryHistoryCreating}
                                className={`${tableInputClass} cursor-pointer`}
                              >
                                <option value="">Select remark</option>
                                {salaryHistoryRemarkOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={onSubmitSalaryHistory}
                                  disabled={salaryHistoryCreating}
                                  className={actionPrimaryClass}
                                  title="Save salary row"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={onCancelAddSalaryHistory}
                                  disabled={salaryHistoryCreating}
                                  className={actionSecondaryClass}
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {salaryHistoryCreateError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {salaryHistoryCreateError}
              </p>
            ) : null}

            {salaryHistoryUpdateError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {salaryHistoryUpdateError}
              </p>
            ) : null}

            {salaryHistoryCreateDraft ? (
              <p className="mt-3 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-gray-500">
                Increment is optional. Leave it blank for AUTO mode, or enter a
                value for MANUAL mode.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {noticeModal.isOpen && activeNoticeRow ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 px-3 py-4">
          <div className="relative flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
              <div>
                <h3 className="text-base font-bold text-gray-800 sm:text-lg">
                  Notice of Step Increment Preview
                </h3>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Review the document details before downloading the PDF
                </p>
              </div>

              <button
                type="button"
                onClick={closeNoticeModal}
                disabled={isDownloadingPdf}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="overflow-y-auto border-b border-gray-200 bg-gray-50 p-4 lg:border-b-0 lg:border-r">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      Editable Fields
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Only the manual document fields are editable here.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Station No.
                    </label>
                    <input
                      type="text"
                      value={noticeModal.stationNo}
                      onChange={(e) =>
                        setNoticeModal((prev) => ({
                          ...prev,
                          stationNo: e.target.value,
                        }))
                      }
                      className={baseInputClass}
                      placeholder="Enter station no."
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Head of Agency Name
                    </label>
                    <input
                      type="text"
                      value={noticeModal.headOfAgencyName}
                      onChange={(e) =>
                        setNoticeModal((prev) => ({
                          ...prev,
                          headOfAgencyName: e.target.value,
                        }))
                      }
                      className={baseInputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Title of Personnel
                    </label>
                    <input
                      type="text"
                      value={noticeModal.headOfAgencyTitle}
                      onChange={(e) =>
                        setNoticeModal((prev) => ({
                          ...prev,
                          headOfAgencyTitle: e.target.value,
                        }))
                      }
                      className={baseInputClass}
                    />
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                    Auto-filled fields are sourced from employee personal and
                    work information, plus the selected step increment row.
                  </div>
                </div>
              </div>

              <div className="min-h-0 overflow-auto bg-[#f3f4f6] p-4 sm:p-6">
                <div className="mx-auto w-fit">
                  <div
                    ref={pdfRef}
                    className="box-border bg-white text-black shadow-lg"
                    style={{
                      width: `${PDF_PAGE_WIDTH_MM}mm`,
                      height: `${PDF_PAGE_HEIGHT_MM}mm`,
                      padding: `${PDF_MARGIN_MM}mm`,
                      fontFamily: DOCUMENT_FONT,
                      fontSize: "12pt",
                      lineHeight: 1,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${PDF_CONTENT_WIDTH_MM}mm`,
                        height: `${PDF_CONTENT_HEIGHT_MM}mm`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        lineHeight: 1,
                      }}
                    >
                      <div>
                        <div style={{ textAlign: "center" }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            Notice of Step Increment Due to Length of Service
                          </p>
                        </div>

                        <div style={{ marginTop: "18mm", textAlign: "right" }}>
                          <p style={{ margin: 0 }}>
                            {formatDateCell(activeNoticeEffectivityDate)}
                          </p>
                        </div>

                        <div style={{ marginTop: "12mm" }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            {resolvedEmployeeName || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            {resolvedSchoolDisplay || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            Employee Number {resolvedEmployeeNumber || "-"}
                          </p>
                          <p style={{ margin: 0 }}>
                            {resolvedDistrictDisplay || "-"}
                          </p>
                          <div
                            style={{
                              marginTop: 0,
                              display: "flex",
                              alignItems: "center",
                              gap: "2mm",
                              flexWrap: "wrap",
                            }}
                          >
                            <span>Station No.</span>
                            <span
                              style={{
                                display: "inline-block",
                                minWidth: "52mm",
                                borderBottom: "1px solid #000",
                                paddingBottom: "1mm",
                              }}
                            >
                              {noticeModal.stationNo || ""}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: "10mm" }}>
                          <p style={{ margin: 0 }}>
                            Dear {salutation} {noticeLastName || "Employee"},
                          </p>
                        </div>

                        <div
                          style={{
                            marginTop: "10mm",
                            textAlign: "justify",
                          }}
                        >
                          <p style={{ margin: 0 }}>
                            Pursuant to Joint Civil Service Commission (CSC) and
                            Department of Budget and Management Circular No. 1
                            dated September 3, 2012, implementing item (4)(d) of
                            the Senate and House of Representatives Joint
                            Resolution No. 4, s. 2009, approved on June 17, 2009,
                            your salary as {formatCellValue(resolvedCurrentPosition)} -
                            Salary Grade {formatCellValue(resolvedCurrentSalaryGrade)}{" "}
                            Step {formatCellValue(activeNoticeRow.step)} is hereby
                            adjusted effective{" "}
                            {formatDateCell(activeNoticeEffectivityDate)} as
                            follows:
                          </p>
                        </div>
                        <div style={{ marginTop: "10mm" }}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto auto",
                              columnGap: "6mm",
                              alignItems: "start",
                            }}
                          >
                            <div>
                              <p style={{ margin: 0 }}>
                                1. Actual Monthly basic salary as of
                              </p>
                              <p style={{ margin: 0, paddingLeft: "12mm" }}>
                                SG-{formatCellValue(resolvedCurrentSalaryGrade)} Step{" "}
                                {previousStepValue}
                              </p>
                            </div>
                            <div style={{ whiteSpace: "nowrap" }}>
                              {formatDateCell(previousDate)}
                            </div>
                            <div style={{ whiteSpace: "nowrap" }}>
                              P {formatNoticeCurrency(previousSalary)}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              columnGap: "6mm",
                              alignItems: "start",
                              marginTop: 0,
                            }}
                          >
                            <div>
                              <p style={{ margin: 0 }}>
                                2. Add ( 1 ) step increment
                              </p>
                            </div>
                            <div style={{ whiteSpace: "nowrap" }}>
                              P {formatNoticeCurrency(incrementAmount)}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto auto",
                              columnGap: "6mm",
                              alignItems: "start",
                              marginTop: 0,
                            }}
                          >
                            <div>
                              <p style={{ margin: 0 }}>
                                3. Adjusted monthly basic salary effective
                              </p>
                            </div>
                            <div style={{ whiteSpace: "nowrap" }}>
                              {formatDateCell(activeNoticeEffectivityDate)}
                            </div>
                            <div style={{ whiteSpace: "nowrap" }}>
                              P {formatNoticeCurrency(newSalary)}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: "10mm",
                            textAlign: "justify",
                          }}
                        >
                          <p style={{ margin: 0 }}>
                            This salary adjustment is subject to review and post
                            audit, and to appropriate re-adjustment and refund if
                            found not in order.
                          </p>
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              width: "72mm",
                              textAlign: "center",
                              overflow: "visible",
                            }}
                          >
                            <p style={{ margin: 0, textAlign: "right" }}>
                              Very truly yours,
                            </p>
                            <div style={{ height: "25mm" }} />
                            <div style={{ marginLeft: "auto", width: "fit-content" }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontFamily: DOCUMENT_FONT,
                                  fontSize: "12pt",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                  whiteSpace: "normal",
                                  textAlign: "center",
                                }}
                              >
                                {noticeModal.headOfAgencyName || "-"}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontFamily: DOCUMENT_FONT,
                                  fontSize: "12pt",
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                  whiteSpace: "normal",
                                  textAlign: "center",
                                }}
                              >
                                {noticeModal.headOfAgencyTitle || "-"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: "12mm" }}>
                          <p style={{ margin: 0 }}>
                            Item No./Unique Item No, FY{" "}
                            {activeNoticeEffectivityDate
                              ? new Date(
                                  `${activeNoticeEffectivityDate}T00:00:00`,
                                ).getFullYear()
                              : ""}
                            {" "}Personal Services Itemization
                          </p>
                          <p style={{ margin: 0 }}>
                            And/or Plantilla of Personnel{" "}
                            {resolvedCurrentPlantilla ||
                              formatCellValue(activeNoticeRow.plantilla)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={closeNoticeModal}
                disabled={isDownloadingPdf}
                className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText size={16} />
                {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}