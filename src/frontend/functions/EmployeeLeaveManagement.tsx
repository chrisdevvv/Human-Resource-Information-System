"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Plus,
  Pencil,
} from "lucide-react";
import EditLeaveModal from "./EditLeaveModal";
import LeaveCardPDFModal from "./LeaveCardPDFModal";
import AddEmployeeModal from "./AddEmployeeModal";
import type { LeaveModalRecord } from "@/frontend/functions/leaveTypes";

type EmployeeRecordApi = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string | null;
  school_name?: string | null;
  employee_type?: "teaching" | "non-teaching";
  created_at?: string | null;
};

type EmployeeRecord = LeaveModalRecord & {
  employeeId: number;
  email: string;
  schoolName: string;
};

const ITEMS_PER_PAGE = 10;

const toEmployeeRecord = (item: EmployeeRecordApi): EmployeeRecord => {
  const firstName = item.first_name?.trim() || "Unknown";
  const lastName = item.last_name?.trim() || "Employee";
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: item.id,
    employeeId: item.id,
    fullName,
    employeeType: item.employee_type || "non-teaching",
    periodOfLeave: "",
    particulars: "",
    balVl: 0,
    balSl: 0,
    dateOfAction: "",
    email: item.email?.trim() || "",
    schoolName: item.school_name?.trim() || "",
  };
};

type EmployeeApiResponse = {
  data?: EmployeeRecordApi[];
  message?: string;
};

export default function EmployeeLeaveManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<
    "ALL" | "teaching" | "non-teaching"
  >("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [letterFilter, setLetterFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [employeeData, setEmployeeData] = useState<EmployeeRecord[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<LeaveModalRecord | null>(null);
  const [pdfTarget, setPdfTarget] = useState<LeaveModalRecord | null>(null);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const fetchEmployees = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setEmployeeLoading(true);
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await fetch("http://localhost:3000/api/employees/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const body = (await response.json()) as EmployeeApiResponse;
      if (!response.ok) {
        throw new Error(body.message || "Failed to fetch employees");
      }

      const mapped = (body.data || []).map(toEmployeeRecord);
      setEmployeeData(mapped);
      setEmployeeError(null);
    } catch (err) {
      setEmployeeError(
        err instanceof Error ? err.message : "An error occurred",
      );
      if (showSpinner) {
        setEmployeeData([]);
      }
    } finally {
      if (showSpinner) {
        setEmployeeLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEmployees();

    const intervalId = window.setInterval(() => {
      fetchEmployees(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEmployees = useMemo(() => {
    return employeeData
      .filter((employee) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          employee.fullName.toLowerCase().includes(query) ||
          employee.email.toLowerCase().includes(query) ||
          employee.schoolName.toLowerCase().includes(query);

        const matchesEmployeeType =
          employeeTypeFilter === "ALL" ||
          employee.employeeType === employeeTypeFilter;

        const matchesLetter =
          letterFilter === "ALL" ||
          employee.fullName.charAt(0).toUpperCase() === letterFilter;

        return matchesSearch && matchesEmployeeType && matchesLetter;
      })
      .sort((a, b) => {
        if (sortOrder === "asc") {
          return a.fullName.localeCompare(b.fullName);
        }

        return b.fullName.localeCompare(a.fullName);
      });
  }, [employeeData, searchQuery, employeeTypeFilter, letterFilter, sortOrder]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE,
  );

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleOpenEdit = (employee: EmployeeRecord) => {
    setEditTarget({
      id: employee.id,
      fullName: employee.fullName,
      employeeType: employee.employeeType,
      periodOfLeave: employee.periodOfLeave,
      particulars: employee.particulars,
      balVl: employee.balVl,
      balSl: employee.balSl,
      dateOfAction: employee.dateOfAction,
    });
  };

  const handleOpenPdf = (employee: EmployeeRecord) => {
    setPdfTarget({
      id: employee.id,
      fullName: employee.fullName,
      employeeType: employee.employeeType,
      periodOfLeave: employee.periodOfLeave,
      particulars: employee.particulars,
      balVl: employee.balVl,
      balSl: employee.balSl,
      dateOfAction: employee.dateOfAction,
    });
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6 sticky top-4 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Leave Management
        </h1>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search employee"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-gray-500 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIsAddEmployeeOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm cursor-pointer"
            >
              <Plus size={16} />
              Add Employee
            </button>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
              <select
                value={employeeTypeFilter}
                onChange={(e) => {
                  setEmployeeTypeFilter(
                    e.target.value as "ALL" | "teaching" | "non-teaching",
                  );
                  setCurrentPage(1);
                }}
                className="text-gray-500 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
              >
                <option value="ALL">All Employee Types</option>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>

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

              <button
                onClick={() => {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
                className="text-gray-500 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium cursor-pointer"
              >
                {sortOrder === "asc" ? (
                  <>
                    <ArrowUpAZ size={16} />
                    A-Z
                  </>
                ) : (
                  <>
                    <ArrowDownAZ size={16} />
                    Z-A
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          {employeeLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading employees...</p>
            </div>
          ) : employeeError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Error: {employeeError}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                    Name
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                    Employee Type
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-blue-600 uppercase text-xs bg-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-2 px-3 text-gray-900 text-sm font-medium">
                        {employee.fullName}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-sm capitalize">
                        {employee.employeeType}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            aria-label="View leave"
                            title="View"
                            className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition cursor-not-allowed"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(employee)}
                            aria-label="Edit leave"
                            title="Edit"
                            className="p-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenPdf(employee)}
                            aria-label="Open leave PDF"
                            title="PDF"
                            className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition cursor-pointer"
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded font-medium text-sm transition cursor-pointer ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

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
        )}
      </div>

      <EditLeaveModal
        isOpen={Boolean(editTarget)}
        leave={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <LeaveCardPDFModal
        isOpen={Boolean(pdfTarget)}
        leave={pdfTarget}
        onClose={() => setPdfTarget(null)}
      />
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={() => {
          setIsAddEmployeeOpen(false);
          fetchEmployees(false);
        }}
      />
    </div>
  );
}
