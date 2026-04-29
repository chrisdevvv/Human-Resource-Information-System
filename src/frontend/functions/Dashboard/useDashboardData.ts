"use client";

import { useEffect, useState } from "react";
import { hasAccessToFeature } from "../../auth/roleAccess";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type ApiListResponse<T> = {
  data?: T[];
  message?: string;
};

type LeaveRecord = {
  status?: string;
  created_at?: string;
  date_of_action?: string;
};

type DashboardEmployeeRecord = {
  age?: number | string | null;
  retirable?: string | null;
};

export type BacklogRecord = {
  id?: number;
  action?: string;
  details?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
};

type EmployeeStatusCountsResponse = {
  data?: {
    on_leave?: number;
    archived?: number;
  };
  message?: string;
};

type ParsedUser = {
  role?: string;
  user_role?: string;
  userRole?: string;
  school_id?: number | string;
};

export type RetirementCounts = {
  retirable: number;
  mandatory: number;
};

type DashboardStats = {
  totalEmployees: number;
  totalUsers: number;
  totalSchools: number;
  pendingRequests: number;
  approvedThisMonth: number;
  pendingRegistrations: number;
  employeesOnLeave: number;
  archivedEmployees: number;
};

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: 0,
  totalUsers: 0,
  totalSchools: 0,
  pendingRequests: 0,
  approvedThisMonth: 0,
  pendingRegistrations: 0,
  employeesOnLeave: 0,
  archivedEmployees: 0,
};

const normalizeList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const withData = payload as ApiListResponse<T>;
    if (Array.isArray(withData.data)) {
      return withData.data;
    }
  }

  return [];
};

const fetchApiList = async <T>(
  endpoint: string,
  token: string,
): Promise<T[]> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = (await response.json().catch(() => ({}))) as
    | ApiListResponse<T>
    | T[];

  if (!response.ok) {
    throw new Error(
      (payload as ApiListResponse<T>)?.message ||
        `Failed to fetch ${endpoint}.`,
    );
  }

  return normalizeList<T>(payload);
};

const fetchStatusCounts = async (
  statusCountsUrl: string,
  token: string,
): Promise<EmployeeStatusCountsResponse> => {
  const response = await fetch(statusCountsUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = (await response.json().catch(() => ({}))) as
    | EmployeeStatusCountsResponse
    | Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      (payload as EmployeeStatusCountsResponse)?.message ||
        "Failed to fetch employee status counts.",
    );
  }

  return payload as EmployeeStatusCountsResponse;
};

const computeRetirementCounts = (
  employees: DashboardEmployeeRecord[],
): RetirementCounts => {
  return employees.reduce<RetirementCounts>(
    (counts, employee) => {
      const retirableValue = String(employee.retirable || "")
        .trim()
        .toLowerCase();
      const ageValue = Number(employee.age);

      if (retirableValue === "mandatory retirement" || ageValue >= 65) {
        counts.mandatory += 1;
        return counts;
      }

      if (
        retirableValue === "yes" ||
        (Number.isFinite(ageValue) && ageValue >= 60)
      ) {
        counts.retirable += 1;
      }

      return counts;
    },
    { retirable: 0, mandatory: 0 },
  );
};

const normalizeRole = (role: unknown) =>
  String(role || "")
    .trim()
    .replace(/[_\s]+/g, "-")
    .toUpperCase();

const readUserContext = () => {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return {
      userRole: "",
      normalizedRole: "",
      schoolId: null as number | null,
    };
  }

  try {
    const parsed = JSON.parse(rawUser) as ParsedUser;
    const userRole = String(
      parsed.role ?? parsed.user_role ?? parsed.userRole ?? "",
    );
    const parsedSchoolId = Number(parsed.school_id);

    return {
      userRole,
      normalizedRole: normalizeRole(userRole),
      schoolId: Number.isFinite(parsedSchoolId) ? parsedSchoolId : null,
    };
  } catch {
    return {
      userRole: "",
      normalizedRole: "",
      schoolId: null as number | null,
    };
  }
};

type UseDashboardDataParams = {
  showRecentLogs: boolean;
};

export const useDashboardData = ({
  showRecentLogs,
}: UseDashboardDataParams) => {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentLogs, setRecentLogs] = useState<BacklogRecord[]>([]);
  const [canAccessDashboard, setCanAccessDashboard] = useState(false);
  const [retirementCounts, setRetirementCounts] = useState<RetirementCounts>({
    retirable: 0,
    mandatory: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          setCanAccessDashboard(false);
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const { userRole, normalizedRole, schoolId } = readUserContext();
        const canAccess = hasAccessToFeature(userRole, "dashboard");

        if (!canAccess) {
          setCanAccessDashboard(false);
          setLoading(false);
          return;
        }

        setCanAccessDashboard(true);

        const isAdmin = normalizedRole === "ADMIN";
        const isSuperAdminRole = normalizedRole === "SUPER-ADMIN";
        setIsSuperAdmin(isSuperAdminRole);

        const scopedEmployeesEndpoint =
          isAdmin && schoolId
            ? `/api/employees/school/${schoolId}`
            : "/api/employees";
        const scopedUsersEndpoint =
          isAdmin && schoolId
            ? `/api/users?school_id=${schoolId}`
            : "/api/users";
        const statusCountsUrl =
          `${API_BASE_URL}/api/employees/status-counts?include_archived=true` +
          (isAdmin && schoolId ? `&school_id=${schoolId}` : "");

        const [
          employees,
          users,
          leaves,
          pendingRegistrationsList,
          schools,
          backlogs,
          employeeStatusCountsResponse,
        ] = await Promise.all([
          fetchApiList<DashboardEmployeeRecord>(scopedEmployeesEndpoint, token),
          fetchApiList<Record<string, unknown>>(scopedUsersEndpoint, token),
          fetchApiList<LeaveRecord>("/api/leave", token),
          fetchApiList<Record<string, unknown>>(
            "/api/registrations/pending",
            token,
          ),
          isSuperAdminRole
            ? fetchApiList<Record<string, unknown>>("/api/schools", token)
            : Promise.resolve([]),
          showRecentLogs
            ? fetchApiList<BacklogRecord>("/api/backlogs", token)
            : Promise.resolve([]),
          fetchStatusCounts(statusCountsUrl, token),
        ]);

        const totalEmployees = employees.length;
        const totalUsers = users.length;
        const totalSchools = schools.length;
        const pendingRegistrations = pendingRegistrationsList.length;
        const employeesOnLeave =
          Number(employeeStatusCountsResponse?.data?.on_leave) || 0;
        const archivedEmployees =
          Number(employeeStatusCountsResponse?.data?.archived) || 0;
        const scopedRetirementCounts = computeRetirementCounts(employees);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let pendingRequests = 0;
        let approvedThisMonth = 0;

        leaves.forEach((leave) => {
          const status = String(leave.status || "").toUpperCase();
          if (status === "PENDING") {
            pendingRequests++;
          }

          if (status === "APPROVED") {
            const dateSource = leave.created_at || leave.date_of_action;
            if (!dateSource) {
              return;
            }

            const leaveDate = new Date(dateSource);
            if (Number.isNaN(leaveDate.getTime())) {
              return;
            }

            if (
              leaveDate.getMonth() === currentMonth &&
              leaveDate.getFullYear() === currentYear
            ) {
              approvedThisMonth++;
            }
          }
        });

        setStats({
          totalEmployees,
          totalUsers,
          totalSchools,
          pendingRequests,
          approvedThisMonth,
          pendingRegistrations,
          employeesOnLeave,
          archivedEmployees,
        });
        setRetirementCounts(scopedRetirementCounts);
        setRecentLogs(showRecentLogs ? backlogs.slice(0, 3) : []);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showRecentLogs]);

  return {
    stats,
    isSuperAdmin,
    loading,
    error,
    recentLogs,
    canAccessDashboard,
    retirementCounts,
  };
};
