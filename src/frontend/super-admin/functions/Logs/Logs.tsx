"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
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

export default function Logs() {
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

  const MAX_RANGE_DAYS = 30;

  // Overall allowed window: today and the 30 days before it
  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgoStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - MAX_RANGE_DAYS);
    return d.toISOString().slice(0, 10);
  })();

  // When dateFrom changes, clamp dateTo so the range never exceeds 30 days
  const handleDateFrom = (value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
    if (value && dateTo) {
      const from = new Date(value);
      const to = new Date(dateTo);
      const maxTo = new Date(from);
      maxTo.setDate(maxTo.getDate() + MAX_RANGE_DAYS);
      if (to > maxTo) setDateTo(maxTo.toISOString().slice(0, 10));
      if (to < from) setDateTo(value);
    }
  };

  // When dateTo changes, clamp so range never exceeds 30 days
  const handleDateTo = (value: string) => {
    if (value && dateFrom) {
      const from = new Date(dateFrom);
      const to = new Date(value);
      const maxTo = new Date(from);
      maxTo.setDate(maxTo.getDate() + MAX_RANGE_DAYS);
      if (to > maxTo) value = maxTo.toISOString().slice(0, 10);
      if (to < from) value = dateFrom;
    }
    setDateTo(value);
    setCurrentPage(1);
  };

  // max selectable end date = min(dateFrom + 30 days, today)
  const maxDateTo = (() => {
    if (!dateFrom) return todayStr;
    const d = new Date(dateFrom);
    d.setDate(d.getDate() + MAX_RANGE_DAYS);
    const candidate = d.toISOString().slice(0, 10);
    return candidate < todayStr ? candidate : todayStr;
  })();

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

  const archiveRange = React.useMemo(() => {
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
      if (showSpinner) {
        setLogsLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await fetch(
        `${API_BASE}/api/backlogs?include_archived=false`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch logs");

      const result = await response.json();
      const formatted = (result.data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        firstName: item.first_name || "Unknown",
        lastName: item.last_name || "",
        role: item.role || "N/A",
        email: item.email || "N/A",
        schoolName: item.school_name || "N/A",
        action: item.action || "N/A",
        details: item.details || "",
        createdAt: item.created_at,
      }));
      setLogsData(formatted);
      setLogsError(null);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "An error occurred");
      if (showSpinner) {
        setLogsData([]);
      }
    } finally {
      if (showSpinner) {
        setLogsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs();

    const intervalId = window.setInterval(() => {
      fetchLogs(false);
    }, 5000);

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
      case "LEAVE_MONTHLY_CREDIT": {
        // d: "Name — Period"
        const sep = d.indexOf(" \u2014 ");
        if (sep !== -1) {
          const name = d.slice(0, sep);
          const period = d.slice(sep + 3);
          return `Applied monthly leave credit (+1.25 VL & SL) to ${name} for ${period}.`;
        }
        return d
          ? `Applied monthly leave credit \u2014 ${d}.`
          : "Applied monthly leave credit.";
      }
      case "USER_ROLE_UPDATED": {
        // details examples:
        // "Name: OLD_ROLE → NEW_ROLE"
        // "Name: OLD_ROLE -> NEW_ROLE"
        // "Name: OLD_ROLE to NEW_ROLE"
        const match = d.match(/^(.+?):\s*(.+?)\s*(?:→|->|to)\s*(.+)$/i);
        if (match) {
          const [, name, from, to] = match;
          return `Changed ${name}'s role from ${toRoleLabel(from)} to ${toRoleLabel(to)}.`;
        }
        return d ? `Updated a user's role — ${d}.` : "Updated a user's role.";
      }
      case "USER_STATUS_UPDATED": {
        // details: "Name: Activated" or "Name: Deactivated"
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
        // details: "Name (email)"
        const pi = d.indexOf(" (");
        const name = pi !== -1 ? d.slice(0, pi) : d;
        return name
          ? `Deleted the account of ${name}.`
          : "Deleted a user account.";
      }
      case "USER_PASSWORD_RESET": {
        // details: "Password reset for Name"
        const match = d.match(/^Password reset for (.+)$/);
        return match
          ? `Reset the password of ${match[1]}.`
          : d || "Reset a user's password.";
      }
      case "REGISTRATION_APPROVED": {
        // details: "Name as ROLE"
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
        // details: "Name" or "Name: reason"
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
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 sticky top-4 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Logs</h1>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name, action, or date"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="text-gray-500 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
            >
              Search
            </button>
            <button
              onClick={openLogsReport}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm cursor-pointer"
            >
              Generate Report
            </button>
            <button
              onClick={openArchiveModal}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium text-sm cursor-pointer"
            >
              Archive
            </button>
          </div>
        </div>

        {/* Filter Row 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="DATA_ENCODER">Data Encoder</option>
          </select>

          {/* Alphabet Filter */}
          <select
            value={letterFilter}
            onChange={(e) => {
              setLetterFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="ALL">All Letters</option>
            {alphabet.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortMode}
            onChange={(e) => {
              setSortMode(e.target.value as typeof sortMode);
              setCurrentPage(1);
            }}
            className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
          </select>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              min={thirtyDaysAgoStr}
              max={todayStr}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="text-gray-500 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
            />
            <label className="text-sm text-gray-500 whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || thirtyDaysAgoStr}
              max={maxDateTo}
              onChange={(e) => handleDateTo(e.target.value)}
              className="text-gray-500 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setCurrentPage(1);
                  setPageJumpInput("1");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-sm text-gray-400 sm:ml-auto">
            {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        {logsLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading logs...</p>
          </div>
        ) : logsError ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Error: {logsError}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  Date &amp; Time
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  Name
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  Role
                </th>
                <th className="text-left py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  Action Taken
                </th>
                <th className="text-center py-1 px-3 font-semibold text-blue-600 uppercase text-sm bg-white">
                  View
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-1 px-3 text-gray-500 text-sm whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-1 px-3 text-gray-900 text-sm font-medium">
                      {log.firstName} {log.lastName}
                    </td>
                    <td className="py-1 px-3 text-gray-500 text-sm">
                      {roleLabelMap[log.role] ?? log.role.replace(/_/g, " ")}
                    </td>
                    <td className="py-1 px-3 text-gray-500 text-sm">
                      {formatAction(log.action, log.details)}
                    </td>
                    <td className="py-1 px-3 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-pointer"
                        aria-label={`View log #${log.id}`}
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Show
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                  setPageJumpInput("1");
                }}
                className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              entries
            </label>

            <div className="flex items-center gap-2 text-sm text-gray-600">
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
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-gray-700"
              />
              <button
                onClick={handleJumpToPage}
                className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            {pageNumberItems.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm text-gray-400 select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`w-9 h-9 rounded font-medium text-sm transition cursor-pointer ${
                    currentPage === item
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <ViewLogsModal
        visible={!!selectedLog}
        log={
          selectedLog
            ? {
                name: `${selectedLog.firstName} ${selectedLog.lastName}`.trim(),
                role:
                  roleLabelMap[selectedLog.role] ??
                  selectedLog.role.replace(/_/g, " "),
                email: selectedLog.email,
                school: selectedLog.schoolName,
                dateTime: formatDateTime(selectedLog.createdAt),
                actionTaken: formatAction(
                  selectedLog.action,
                  selectedLog.details,
                ),
              }
            : null
        }
        onClose={() => setSelectedLog(null)}
      />

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">Archive Logs</h2>

            {archiveStep === "range" && (
              <>
                <p className="mt-2 text-sm text-gray-600">
                  Archive range for last month window:
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {archiveRange.fromLabel} to {archiveRange.toLabel} (30 days)
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  You can generate the report now or continue to archive.
                </p>

                {archiveMessage && (
                  <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {archiveMessage}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={closeArchiveModal}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
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
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Generate Report
                  </button>
                  <button
                    onClick={() => {
                      setArchiveStep("generate-prompt");
                      setArchiveMessage(null);
                    }}
                    disabled={archiveBusy}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setArchiveShouldGenerateReport(false);
                      setArchiveStep("confirm");
                    }}
                    className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 cursor-pointer"
                  >
                    No, Archive Only
                  </button>
                  <button
                    onClick={() => {
                      setArchiveShouldGenerateReport(true);
                      setArchiveStep("confirm");
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer"
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
                  <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                    {archiveMessage}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => setArchiveStep("generate-prompt")}
                    disabled={archiveBusy}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Back
                  </button>
                  <button
                    onClick={performArchive}
                    disabled={archiveBusy}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer"
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
