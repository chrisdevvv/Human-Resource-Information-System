const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type ApiMessage = {
  message?: string;
};

const parseApiBody = async <T extends ApiMessage>(
  response: Response,
): Promise<T> => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("application/json")) {
    return (await response.json().catch(() => ({}))) as T;
  }

  const text = await response.text().catch(() => "");
  return {
    message: text || undefined,
  } as T;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("No authentication token found.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

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

type EmployeePersonalInfoResponse = {
  data?: EmployeePersonalInfoApi[];
  total?: number;
  page?: number;
  pageSize?: number;
  message?: string;
};

export const getEServiceEmployees = async (params: {
  search?: string;
  district?: string;
  school?: string;
  civilStatus?: string;
  sex?: string;
  sortOrder?: "ASC" | "DESC";
  page?: number;
  pageSize?: number;
}) => {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.district?.trim()) query.set("district", params.district.trim());
  if (params.school?.trim()) query.set("school", params.school.trim());
  if (params.civilStatus?.trim()) {
    query.set("civilStatus", params.civilStatus.trim());
  }
  if (params.sex?.trim()) query.set("sex", params.sex.trim());
  query.set("sortOrder", params.sortOrder || "DESC");
  query.set("page", String(params.page || 1));
  query.set("pageSize", String(params.pageSize || 10));

  const response = await fetch(
    `${API_BASE}/api/eservice/employees?${query.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const body = await parseApiBody<EmployeePersonalInfoResponse>(response);

  if (!response.ok) {
    throw new Error(
      body.message ||
        `Failed to fetch employee personal info (HTTP ${response.status}).`,
    );
  }

  return body;
};

export const getEServiceDistricts = async (): Promise<DistrictOption[]> => {
  const response = await fetch(`${API_BASE}/api/eservice/districts`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const body = await parseApiBody<{ data?: DistrictOption[]; message?: string }>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      body.message || `Failed to fetch districts (HTTP ${response.status}).`,
    );
  }

  return body.data || [];
};

export const getEServiceSchools = async (
  district?: string,
): Promise<SchoolOption[]> => {
  const query = new URLSearchParams();
  if (district?.trim()) query.set("district", district.trim());

  const response = await fetch(
    `${API_BASE}/api/eservice/schools${query.toString() ? `?${query.toString()}` : ""}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  const body = await parseApiBody<{ data?: SchoolOption[]; message?: string }>(
    response,
  );

  if (!response.ok) {
    throw new Error(
      body.message || `Failed to fetch schools (HTTP ${response.status}).`,
    );
  }

  return body.data || [];
};

export const createEServiceEmployee = async (
  payload: EmployeePersonalInfoForm,
) => {
  const response = await fetch(`${API_BASE}/api/eservice/employees`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      middleName: payload.middleName,
      middle_initial: payload.middle_initial,
      MISR: payload.MISR,
      email: payload.email,
      dateOfBirth: payload.dateOfBirth,
      place: payload.place,
      district: payload.district,
      school: payload.school,
      gender: payload.gender,
      civilStatus: payload.civilStatus,
      teacher_status: payload.teacher_status,
    }),
  });

  const body = await parseApiBody<{ message?: string }>(response);

  if (!response.ok) {
    throw new Error(
      body.message ||
        `Failed to create employee personal info (HTTP ${response.status}).`,
    );
  }

  return body;
};

export const updateEServiceEmployee = async (
  id: number,
  payload: EmployeePersonalInfoForm,
) => {
  const response = await fetch(`${API_BASE}/api/eservice/employees/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      middleName: payload.middleName,
      middle_initial: payload.middle_initial,
      MISR: payload.MISR,
      email: payload.email,
      dateOfBirth: payload.dateOfBirth,
      place: payload.place,
      district: payload.district,
      school: payload.school,
      gender: payload.gender,
      civilStatus: payload.civilStatus,
      teacher_status: payload.teacher_status,
    }),
  });

  const body = await parseApiBody<{ message?: string }>(response);

  if (!response.ok) {
    throw new Error(
      body.message ||
        `Failed to update employee personal info (HTTP ${response.status}).`,
    );
  }

  return body;
};

export const deleteEServiceEmployee = async (id: number) => {
  const response = await fetch(`${API_BASE}/api/eservice/employees/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const body = await parseApiBody<{ message?: string }>(response);

  if (!response.ok) {
    throw new Error(
      body.message ||
        `Failed to delete employee personal info (HTTP ${response.status}).`,
    );
  }

  return body;
};