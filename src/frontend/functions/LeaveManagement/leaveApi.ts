export type LeaveApiRecord = {
  id: number;
  employee_id: number;
  period_of_leave: string;
  particulars: string | null;
  earned_vl: number | string | null;
  abs_with_pay_vl: number | string | null;
  abs_without_pay_vl: number | string | null;
  bal_vl: number | string | null;
  earned_sl: number | string | null;
  abs_with_pay_sl: number | string | null;
  abs_without_pay_sl: number | string | null;
  bal_sl: number | string | null;
  date_of_action: string | null;
  full_name?: string;
  employee_type?: "teaching" | "non-teaching";
};

export type LeaveHistoryRecord = {
  id: number;
  employeeId: number;
  fullName?: string;
  periodOfLeave: string;
  particulars: string;
  earnedVl: number;
  absWithPayVl: number;
  absWithoutPayVl: number;
  balVl: number;
  earnedSl: number;
  absWithPaySl: number;
  absWithoutPaySl: number;
  balSl: number;
  dateOfAction: string;
  employeeType?: "teaching" | "non-teaching";
};

export type CreateLeavePayload = {
  employee_id: number;
  period_of_leave: string;
  particulars: string;
  earned_vl: number;
  abs_with_pay_vl: number;
  abs_without_pay_vl: number;
  earned_sl: number;
  abs_with_pay_sl: number;
  abs_without_pay_sl: number;
};

export type UpdateLeavePayload = {
  period_of_leave: string;
  particulars: string;
  earned_vl: number;
  abs_with_pay_vl: number;
  abs_without_pay_vl: number;
  earned_sl: number;
  abs_with_pay_sl: number;
  abs_without_pay_sl: number;
};

type LeaveListResponse = {
  data?: LeaveApiRecord[];
  message?: string;
};

type ApiResponse = {
  message?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const LEAVE_ENDPOINT = `${API_BASE_URL}/api/leave`;

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapLeaveRecord = (row: LeaveApiRecord): LeaveHistoryRecord => ({
  id: row.id,
  employeeId: row.employee_id,
  fullName: row.full_name,
  periodOfLeave: row.period_of_leave || "",
  particulars: row.particulars || "",
  earnedVl: toNumber(row.earned_vl),
  absWithPayVl: toNumber(row.abs_with_pay_vl),
  absWithoutPayVl: toNumber(row.abs_without_pay_vl),
  balVl: toNumber(row.bal_vl),
  earnedSl: toNumber(row.earned_sl),
  absWithPaySl: toNumber(row.abs_with_pay_sl),
  absWithoutPaySl: toNumber(row.abs_without_pay_sl),
  balSl: toNumber(row.bal_sl),
  dateOfAction: row.date_of_action || "",
  employeeType: row.employee_type,
});

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    throw new Error("Leave API can only be called on the client.");
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("No authentication token found.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const body = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(body.message || "Request failed.");
  }
  return body;
};

export async function getLeaveHistoryByEmployee(
  employeeId: number,
): Promise<LeaveHistoryRecord[]> {
  const response = await fetch(`${LEAVE_ENDPOINT}/employee/${employeeId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const body = await parseResponse<LeaveListResponse>(response);
  return (body.data || []).map(mapLeaveRecord).sort((a, b) => a.id - b.id);
}

export async function createLeave(payload: CreateLeavePayload): Promise<void> {
  const response = await fetch(LEAVE_ENDPOINT, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  await parseResponse<ApiResponse>(response);
}

export async function updateLeave(
  leaveId: number,
  payload: UpdateLeavePayload,
): Promise<void> {
  const response = await fetch(`${LEAVE_ENDPOINT}/${leaveId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  await parseResponse<ApiResponse>(response);
}

export async function deleteLeave(leaveId: number): Promise<void> {
  const response = await fetch(`${LEAVE_ENDPOINT}/${leaveId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseResponse<ApiResponse>(response);
}

export async function creditMonthlyLeave(
  year?: number,
  month?: number,
): Promise<void> {
  const response = await fetch(`${LEAVE_ENDPOINT}/credit-monthly`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ year, month }),
  });

  await parseResponse<ApiResponse>(response);
}
