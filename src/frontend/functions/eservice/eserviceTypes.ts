export type DistrictOption = {
  districtId: number;
  districtName: string;
  status?: number;
};

export type SchoolOption = {
  id: number | string;
  name: string;
  district?: string | null;
};

export type EmployeePersonalInfoApi = {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  middle_initial?: string | null;
  MISR?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  place?: string | null;
  district?: string | null;
  school?: string | null;
  gender?: string | null;
  civilStatus?: string | null;
  teacher_status?: string | null;
};

export type EmployeePersonalInfoRecord = {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  middleInitial: string;
  misr: string;
  email: string;
  dateOfBirth: string;
  place: string;
  district: string;
  school: string;
  gender: string;
  civilStatus: string;
  teacherStatus: string;
  fullName: string;
};

export type EmployeePersonalInfoForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  middle_initial: string;
  MISR: string;
  email: string;
  dateOfBirth: string;
  place: string;
  district: string;
  school: string;
  gender: string;
  civilStatus: string;
  teacher_status: string;
  isSdoEmployee: boolean;
};

export type EmployeePersonalInfoResponse = {
  data?: EmployeePersonalInfoApi[];
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
};

export const INITIAL_EMPLOYEE_PERSONAL_INFO_FORM: EmployeePersonalInfoForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  middle_initial: "",
  MISR: "",
  email: "",
  dateOfBirth: "",
  place: "",
  district: "",
  school: "",
  gender: "",
  civilStatus: "",
  teacher_status: "Active",
  isSdoEmployee: false,
};

export const CIVIL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Widowed",
  "Separated",
] as const;

export const SEX_OPTIONS = ["Male", "Female"] as const;

export const STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Resigned",
  "Transferred to another SDO",
] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const formatDateForInput = (value?: string | null) => {
  if (!value) return "";

  const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, mm, dd, yyyy] = slashMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const formatDateForDisplay = (value?: string | null) => {
  if (!value) return "—";

  const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

export const mapEmployeePersonalInfoToRecord = (
  item: EmployeePersonalInfoApi,
): EmployeePersonalInfoRecord => {
  const firstName = item.firstName?.trim() || "";
  const lastName = item.lastName?.trim() || "";
  const middleName = item.middleName?.trim() || "";
  const middleInitial = item.middle_initial?.trim() || "";
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  return {
    id: item.id,
    firstName,
    lastName,
    middleName,
    middleInitial,
    misr: item.MISR?.trim() || "",
    email: item.email?.trim() || "",
    dateOfBirth: formatDateForInput(item.dateOfBirth),
    place: item.place?.trim() || "",
    district: item.district?.trim() || "",
    school: item.school?.trim() || "",
    gender: item.gender?.trim() || "",
    civilStatus: item.civilStatus?.trim() || "",
    teacherStatus: item.teacher_status?.trim() || "",
    fullName,
  };
};