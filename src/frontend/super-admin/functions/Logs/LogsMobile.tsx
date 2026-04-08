"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText, Search } from "lucide-react";
import ViewLogsModal from "../../components/ViewLogsModal";
import LogsReportGeneration, {
  downloadLogsReportPdf,
  type LogsReportRecord,
} from "./LogsReportGeneration";

type Log = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  schoolName: string;
  action: string;
  details: string;
  createdAt: string;
};

type ArchiveFlowStep = "range" | "generate-prompt" | "confirm" | "success";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function LogsMobile() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState<
    "date-desc" | "date-asc" | "name-asc" | "name-desc"
  >("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [pageJumpInput, setPageJumpInput] = useState("1");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleDateFrom = (value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
    if (value && dateTo && new Date(dateTo) < new Date(value)) {
      setDateTo(value);
    }
  };

  const handleDateTo = (value: string) => {
    if (value && dateFrom && new Date(value) < new Date(dateFrom)) {
      value = dateFrom;
    }
    setDateTo(value);
    setCurrentPage(1);
  };

  const [logsData, setLogsData] = useState<Log[]>([]);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveStep, setArchiveStep] = useState<ArchiveFlowStep>("range");
  const [archiveShouldGenerateReport, setArchiveShouldGenerateReport] =
    useState(false);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);
  const [archivedCount, setArchivedCount] = useState(0);
  const [reportGeneratedBy, setReportGeneratedBy] = useState("System");
  const archiveReportRef = React.useRef<HTMLDivElement | null>(null);

  const formatIsoDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const defaultArchiveRange = React.useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(from);
    to.setDate(to.getDate() + 29);

    return {
      fromIso: formatIsoDate(from),
      toIso: formatIsoDate(to),
      fromLabel: from.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      toLabel: to.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }, []);

  const archiveRange = React.useMemo(() => {
    let fromIso = defaultArchiveRange.fromIso;
    let toIso = defaultArchiveRange.toIso;

    if (dateFrom || dateTo) {
      fromIso = dateFrom || dateTo || defaultArchiveRange.fromIso;
      toIso = dateTo || todayStr;

      if (new Date(toIso) < new Date(fromIso)) {
        toIso = fromIso;
      }
    }

    const from = new Date(`${fromIso}T00:00:00`);
    const to = new Date(`${toIso}T00:00:00`);

    return {
      fromIso,
      toIso,
      fromLabel: from.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      toLabel: to.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      usesCustomRange: Boolean(dateFrom || dateTo),
    };
  }, [
    dateFrom,
    dateTo,
    defaultArchiveRange.fromIso,
    defaultArchiveRange.toIso,
    todayStr,
  ]);

  const archiveReportRows = React.useMemo<LogsReportRecord[]>(() => {
    const from = new Date(`${archiveRange.fromIso}T00:00:00`);
    const to = new Date(`${archiveRange.toIso}T23:59:59`);

    return logsData
      .filter((log) => {
        const logDate = new Date(log.createdAt);
        return logDate >= from && logDate <= to;
      })
      .map((log) => ({
        id: log.id,
        userId: log.userId,
        firstName: log.firstName,
        lastName: log.lastName,
        role: log.role,
        email: log.email,
        schoolName: log.schoolName,
        action: log.action,
        details: log.details,
        createdAt: log.createdAt,
      }));
  }, [archiveRange.fromIso, archiveRange.toIso, logsData]);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;

    try {
      const user = JSON.parse(rawUser) as {
        firstName?: string;
        first_name?: string;
        lastName?: string;
        last_name?: string;
        name?: string;
      };
      const firstName = user.firstName || user.first_name || "";
      const lastName = user.lastName || user.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();
      setReportGeneratedBy(fullName || user.name || "System");
    } catch {
      setReportGeneratedBy("System");
    }
  }, []);

  const downloadArchiveRangeReport = async () => {
    if (!archiveReportRef.current) {
      throw new Error("Archive report preview is not ready yet.");
    }

    await downloadLogsReportPdf(
      archiveReportRef.current,
      `Activity Logs Report - ${archiveRange.fromIso} to ${archiveRange.toIso}.pdf`,
    );
  };

  const openArchiveModal = () => {
    setArchiveModalOpen(true);
    setArchiveStep("range");
    setArchiveShouldGenerateReport(false);
    setArchiveMessage(null);
    setArchivedCount(0);
  };

  const closeArchiveModal = () => {
    if (archiveBusy) return;
    setArchiveModalOpen(false);
    setArchiveStep("range");
    setArchiveShouldGenerateReport(false);
    setArchiveMessage(null);
  };

  const performArchive = async () => {
    try {
      setArchiveBusy(true);
      setArchiveMessage(null);

      const archiveTargetIds = filteredLogs.map((log) => log.id);

      if (archiveShouldGenerateReport) {
        await downloadArchiveRangeReport();
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch(`${API_BASE}/api/backlogs/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: archiveRange.fromIso,
          to: archiveRange.toIso,
          ids: archiveTargetIds,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to archive logs.");
      }

      const count = Number(payload?.data?.archivedCount || 0);
      setArchivedCount(count);
      setArchiveStep("success");
      setArchiveMessage(
        count > 0
          ? `${count} log record${count !== 1 ? "s" : ""} archived successfully.`
          : "No logs found for the selected archive range.",
      );

      if (count > 0 && archiveTargetIds.length > 0) {
        // Immediate UI refresh: remove just-archived rows from active logs list.
        setLogsData((prev) =>
          prev.filter((log) => !archiveTargetIds.includes(log.id)),
        );
      }

      await fetchLogs(false);
    } catch (err) {
      setArchiveMessage(
        err instanceof Error ? err.message : "Archive process failed.",
      );
    } finally {
      setArchiveBusy(false);
    }
  };

  const openLogsReport = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    const query = params.toString();
    router.push(
      query
        ? `/super-admin/logsreportgeneration?${query}`
        : "/super-admin/logsreportgeneration",
    );
  };

  const fetchLogs = async (showSpinner = true) => {
    try {
      if (showSpinner) setLogsLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch(
        `${API_BASE}/api/backlogs?include_archived=false`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch logs");

      const result = await response.json();
      const formatted = (result.data || []).map(
        (item: Record<string, unknown>) => ({
          id: item.id as number,
          userId: item.user_id as number,
          firstName: (item.first_name as string) || "Unknown",
          lastName: (item.last_name as string) || "",
          role: (item.role as string) || "N/A",
          email: (item.email as string) || "N/A",
          schoolName: (item.school_name as string) || "N/A",
          action: (item.action as string) || "N/A",
          details: (item.details as string) || "",
          createdAt: item.created_at as string,
        }),
      );
      setLogsData(formatted);
      setLogsError(null);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) setLogsData([]);
    } finally {
      if (showSpinner) setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const intervalId = window.setInterval(() => fetchLogs(false), 5000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLogs = logsData
    .filter((log) => {
      const query = searchQuery.trim().toLowerCase();
      const fullName = `${log.firstName} ${log.lastName}`.toLowerCase();
      const logDate = new Date(log.createdAt);

      const searchableDateParts = Number.isNaN(logDate.getTime())
        ? []
        : [
            log.createdAt.toLowerCase(),
            logDate.toISOString().slice(0, 10),
            logDate.toLocaleDateString("en-PH"),
            logDate.toLocaleString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            logDate.toLocaleString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          ].map((value) => value.toLowerCase());

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        log.action.toLowerCase().includes(query) ||
        searchableDateParts.some((datePart) => datePart.includes(query));
      const matchesRole = roleFilter === "ALL" || log.role === roleFilter;
      const matchesLetter =
        letterFilter === "ALL" ||
        log.firstName.charAt(0).toUpperCase() === letterFilter;
      const afterFrom = !dateFrom || logDate >= new Date(dateFrom);
      const beforeTo = !dateTo
        ? true
        : (() => {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            return logDate <= end;
          })();
      return (
        matchesSearch && matchesRole && matchesLetter && afterFrom && beforeTo
      );
    })
    .sort((a, b) => {
      if (sortMode === "name-asc")
        return a.firstName.localeCompare(b.firstName);
      if (sortMode === "name-desc")
        return b.firstName.localeCompare(a.firstName);
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortMode === "date-desc" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIdx, startIdx + itemsPerPage);
  const PAGE_WINDOW_SIZE = 5;
  const pageGroupStart =
    Math.floor((currentPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1;
  const pageGroupEnd = Math.min(
    totalPages,
    pageGroupStart + PAGE_WINDOW_SIZE - 1,
  );
  const pageNumberItems: Array<number | "ellipsis"> = Array.from(
    { length: pageGroupEnd - pageGroupStart + 1 },
    (_, i) => pageGroupStart + i,
  );
  if (pageGroupEnd < totalPages) {
    if (totalPages - pageGroupEnd > 1) {
      pageNumberItems.push("ellipsis");
    }
    pageNumberItems.push(totalPages);
  }

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      return;
    }

    setPageJumpInput(String(currentPage));
  }, [currentPage, totalPages]);

  const handleJumpToPage = () => {
    const parsed = Number.parseInt(pageJumpInput, 10);
    if (Number.isNaN(parsed)) {
      setPageJumpInput(String(currentPage));
      return;
    }

    const nextPage = Math.min(totalPages, Math.max(1, parsed));
    setCurrentPage(nextPage);
    setPageJumpInput(String(nextPage));
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setLetterFilter("ALL");
    setSortMode("date-desc");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    setPageJumpInput("1");
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleFilter !== "ALL" ||
    letterFilter !== "ALL" ||
    sortMode !== "date-desc" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const roleLabelMap: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    DATA_ENCODER: "Data Encoder",
  };

  const toRoleLabel = (raw: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      DATA_ENCODER: "Data Encoder",
    };

    const value = String(raw || "").trim();
    const normalized = value.toUpperCase().replace(/\s+/g, "_");
    if (map[normalized]) return map[normalized];

    return value
      ? value
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : value;
  };

  const formatAction = (action: string, details: string): string => {
    const d = details?.trim() || "";
    const normalizedAction = String(action || "")
      .trim()
      .toUpperCase();

    if (!normalizedAction || normalizedAction === "N/A") {
      const roleChange = d.match(/^(.+?):\s*(.+?)\s*(?:→|->|to)\s*(.+)$/i);
      if (roleChange) {
        const [, name, from, to] = roleChange;
        return `Changed ${name}'s role from ${toRoleLabel(from)} to ${toRoleLabel(to)}.`;
      }

      const assignedRole = d.match(/^(.+?)\s+as\s+(.+)$/i);
      if (assignedRole) {
        const [, name, role] = assignedRole;
        return `Assigned ${name} as ${toRoleLabel(role)}.`;
      }

      const pwdReset = d.match(/^Password reset for (.+)$/i);
      if (pwdReset) {
        return `Reset the password of ${pwdReset[1]}.`;
      }

      return d || "No action details available.";
    }

    switch (normalizedAction) {
      case "EMPLOYEE_CREATED":
        return d ? `Added ${d} as a new employee.` : "Added a new employee.";
      case "EMPLOYEE_UPDATED":
        return d
          ? `Updated the record of ${d}.`
          : "Updated an employee record.";
      case "EMPLOYEE_DELETED":
        return d ? `Removed ${d} from the system.` : "Removed an employee.";
      case "EMPLOYEE_ARCHIVED":
        return d
          ? `Archived ${d} from the active employee list.`
          : "Archived an employee.";
      case "EMPLOYEE_UNARCHIVED":
        return d
          ? `Restored ${d} to the active employee list.`
          : "Restored an employee.";
      case "EMPLOYEE_MARKED_ON_LEAVE":
        return d
          ? `Marked ${d} as currently on leave.`
          : "Marked an employee as on leave.";
      case "EMPLOYEE_MARKED_AVAILABLE":
        return d
          ? `Marked ${d} as available for work.`
          : "Marked an employee as available.";
      case "LEAVE_CREATED":
        return d ? `Filed a leave request for ${d}.` : "Filed a leave request.";
      case "LEAVE_UPDATED":
        return d
          ? `Updated a leave request — ${d}.`
          : "Updated a leave request.";
      case "LEAVE_DELETED":
        return d
          ? `Deleted the leave request for ${d}.`
          : "Deleted a leave request.";
      case "SCHOOL_CREATED":
        return d ? `Added ${d} as a new school.` : "Added a new school.";
      case "SCHOOL_UPDATED":
        return d ? `Updated the school details for ${d}.` : "Updated a school.";
      case "SCHOOL_DELETED":
        return d ? `Removed ${d} from the school list.` : "Removed a school.";
      case "LEAVE_PARTICULAR_CREATED":
        return d
          ? `Added ${d} as a leave particular.`
          : "Added a leave particular.";
      case "LEAVE_PARTICULAR_UPDATED":
        return d
          ? `Updated the leave particular ${d}.`
          : "Updated a leave particular.";
      case "LEAVE_PARTICULAR_DELETED":
        return d
          ? `Removed ${d} from the leave particulars list.`
          : "Removed a leave particular.";
      case "USER_ROLE_UPDATED": {
        const match = d.match(/^(.+?):\s*(.+?)\s*(?:→|->|to)\s*(.+)$/i);
        if (match) {
          const [, name, from, to] = match;
          return `Changed ${name}'s role from ${toRoleLabel(from)} to ${toRoleLabel(to)}.`;
        }
        return d ? `Updated a user's role — ${d}.` : "Updated a user's role.";
      }
      case "USER_STATUS_UPDATED": {
        const ci = d.indexOf(": ");
        if (ci !== -1) {
          const name = d.slice(0, ci);
          const status = d.slice(ci + 2).toLowerCase();
          return status === "activated"
            ? `Activated ${name}'s account.`
            : `Deactivated ${name}'s account.`;
        }
        return d || "Updated a user's account status.";
      }
      case "USER_DELETED": {
        const pi = d.indexOf(" (");
        const name = pi !== -1 ? d.slice(0, pi) : d;
        return name
          ? `Deleted the account of ${name}.`
          : "Deleted a user account.";
      }
      case "USER_PASSWORD_RESET": {
        const match = d.match(/^Password reset for (.+)$/);
        return match
          ? `Reset the password of ${match[1]}.`
          : d || "Reset a user's password.";
      }
      case "REGISTRATION_APPROVED": {
        const ai = d.lastIndexOf(" as ");
        if (ai !== -1) {
          const name = d.slice(0, ai);
          const role = toRoleLabel(d.slice(ai + 4));
          return `Approved the registration of ${name} as ${role}.`;
        }
        return d
          ? `Approved the registration of ${d}.`
          : "Approved a registration request.";
      }
      case "REGISTRATION_REJECTED": {
        const ci = d.indexOf(": ");
        if (ci !== -1) {
          const name = d.slice(0, ci);
          const reason = d.slice(ci + 2);
          return `Rejected the registration of ${name} — ${reason}.`;
        }
        return d
          ? `Rejected the registration of ${d}.`
          : "Rejected a registration request.";
      }
      default:
        return d
          ? `${normalizedAction.replace(/_/g, " ")}: ${d}.`
          : normalizedAction.replace(/_/g, " ");
    }
  };

  return (
    <div className="w-full px-3 py-4">
      <h1 className="text-lg font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
        <FileText size={16} className="text-blue-600" />
        Activity Logs
      </h1>

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Search */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by name, action, or date"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setCurrentPage(1)}
            className="inline-flex items-center gap-1 px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            <Search size={14} />
            Search
          </button>
          <button
            onClick={openLogsReport}
            className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition cursor-pointer"
          >
            Generate Report
          </button>
          <button
            onClick={openArchiveModal}
            className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition cursor-pointer"
          >
            Archive
          </button>
        </div>

        {/* Filters 2×2 grid */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="DATA_ENCODER">Data Encoder</option>
          </select>

          <select
            value={letterFilter}
            onChange={(e) => {
              setLetterFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Letters</option>
            {alphabet.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>

          <select
            value={sortMode}
            onChange={(e) => {
              setSortMode(e.target.value as typeof sortMode);
              setCurrentPage(1);
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
          </select>

          <select
            value=""
            onChange={(e) => {
              if (e.target.value === "clear") {
                setDateFrom("");
                setDateTo("");
                setCurrentPage(1);
                setPageJumpInput("1");
              }
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Date Range</option>
            <option value="clear">Clear Dates</option>
          </select>
        </div>

        {/* Date inputs - stacked on mobile */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-500 whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              max={todayStr}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-xs text-gray-500 whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || ""}
              max={todayStr}
              onChange={(e) => handleDateTo(e.target.value)}
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <p className="text-xs text-gray-400">
          {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""}
        </p>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-sm text-gray-500 underline hover:text-gray-700 transition cursor-pointer text-center"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Logs list */}
      <div className="border border-blue-200 bg-white rounded-xl shadow-lg p-4 flex flex-col gap-4">
        {logsLoading ? (
          <p className="text-center text-sm text-gray-500 py-8">
            Loading logs...
          </p>
        ) : logsError ? (
          <p className="text-center text-sm text-red-500 py-8">
            Error: {logsError}
          </p>
        ) : paginatedLogs.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            No logs found.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400 truncate">
                    {formatDateTime(log.createdAt)}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {log.firstName} {log.lastName}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {formatAction(log.action, log.details)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(log)}
                  className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition cursor-pointer shrink-0"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                Show
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                    setPageJumpInput("1");
                  }}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                entries
              </label>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>Jump to</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageJumpInput}
                  onChange={(e) => setPageJumpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleJumpToPage();
                    }
                  }}
                  className="w-14 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700"
                />
                <button
                  onClick={handleJumpToPage}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 cursor-pointer"
                >
                  Go
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft size={15} />
                Prev
              </button>

              <span className="text-sm text-gray-500">
                Page{" "}
                <span className="font-semibold text-gray-800">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {totalPages}
                </span>
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1">
              {pageNumberItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-xs text-gray-400 select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`h-8 min-w-8 rounded px-2 text-xs font-medium transition cursor-pointer ${
                      currentPage === item
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      {/* View logs modal */}
      {selectedLog && (
        <ViewLogsModal
          visible={true}
          log={{
            name: `${selectedLog.firstName} ${selectedLog.lastName}`.trim(),
            role:
              roleLabelMap[selectedLog.role] ??
              selectedLog.role.replace(/_/g, " "),
            email: selectedLog.email,
            school: selectedLog.schoolName,
            dateTime: formatDateTime(selectedLog.createdAt),
            actionTaken: formatAction(selectedLog.action, selectedLog.details),
          }}
          onClose={() => setSelectedLog(null)}
        />
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 opacity-0"
        style={{ left: "-100000px" }}
      >
        <LogsReportGeneration
          ref={archiveReportRef}
          rows={archiveReportRows}
          generatedBy={reportGeneratedBy}
          dateFrom={archiveRange.fromIso}
          dateTo={archiveRange.toIso}
        />
      </div>

      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl border border-blue-200 bg-white p-4 shadow-2xl sm:rounded-xl sm:p-5">
            <h2 className="text-base font-bold text-gray-900">Archive Logs</h2>

            {archiveStep === "range" && (
              <>
                <p className="mt-2 text-sm text-gray-600">Archive range:</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {archiveRange.fromLabel} to {archiveRange.toLabel}
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  {archiveRange.usesCustomRange
                    ? "Using your selected date filter range."
                    : "No date filter selected, using the default monthly archive window."}
                </p>

                {archiveMessage && (
                  <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {archiveMessage}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={closeArchiveModal}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setArchiveBusy(true);
                        setArchiveMessage(null);
                        await downloadArchiveRangeReport();
                        setArchiveMessage("Report generated successfully.");
                      } catch (err) {
                        setArchiveMessage(
                          err instanceof Error
                            ? err.message
                            : "Failed to generate report.",
                        );
                      } finally {
                        setArchiveBusy(false);
                      }
                    }}
                    disabled={archiveBusy}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Generate Report
                  </button>
                  <button
                    onClick={() => {
                      setArchiveStep("confirm");
                      setArchiveShouldGenerateReport(false);
                      setArchiveMessage(null);
                    }}
                    disabled={archiveBusy}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Continue to Archive
                  </button>
                </div>
              </>
            )}

            {archiveStep === "generate-prompt" && (
              <>
                <p className="mt-3 text-sm text-gray-700">
                  Do you want to generate a report before archiving logs?
                </p>
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => setArchiveStep("range")}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setArchiveShouldGenerateReport(false);
                      setArchiveStep("confirm");
                    }}
                    className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 cursor-pointer"
                  >
                    No, Archive Only
                  </button>
                  <button
                    onClick={() => {
                      setArchiveShouldGenerateReport(true);
                      setArchiveStep("confirm");
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    Yes, Generate Then Archive
                  </button>
                </div>
              </>
            )}

            {archiveStep === "confirm" && (
              <>
                <p className="mt-3 text-sm text-gray-700">
                  Confirmation: archive logs from {archiveRange.fromLabel} to{" "}
                  {archiveRange.toLabel}? This action will hide them from active
                  logs.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Generate report before archive:{" "}
                  {archiveShouldGenerateReport ? "Yes" : "No"}
                </p>

                {archiveMessage && (
                  <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {archiveMessage}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => setArchiveStep("range")}
                    disabled={archiveBusy}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Back
                  </button>
                  <button
                    onClick={performArchive}
                    disabled={archiveBusy}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {archiveBusy ? "Processing..." : "Confirm Archive"}
                  </button>
                </div>
              </>
            )}

            {archiveStep === "success" && (
              <>
                <p className="mt-3 text-sm text-green-700">Success message:</p>
                <p className="mt-1 text-sm text-gray-700">{archiveMessage}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Archived count: {archivedCount}
                </p>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={closeArchiveModal}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
