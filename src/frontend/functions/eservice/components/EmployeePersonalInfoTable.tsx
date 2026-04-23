"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { EmployeePersonalInfoRecord } from "../modals/AddEmployeePersonalInfoModal";

type Props = {
  loading: boolean;
  error: string | null;
  rows: EmployeePersonalInfoRecord[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  onEdit: (employee: EmployeePersonalInfoRecord) => void;
  onDelete: (employee: EmployeePersonalInfoRecord) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const formatDateForDisplay = (value?: string | null) => {
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

export default function EmployeePersonalInfoTable({
  loading,
  error,
  rows,
  totalItems,
  currentPage,
  itemsPerPage,
  onEdit,
  onDelete,
  onPageChange,
  onItemsPerPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <>
      <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-362.5 w-full">
          <thead className="bg-[#2f80ed] text-white">
            <tr>
              {[
                "ID",
                "DEPED EMAIL",
                "DISTRICT",
                "SCHOOL",
                "LAST NAME",
                "FIRST NAME",
                "MIDDLE NAME",
                "MIDDLE INITIAL",
                "CIVIL STATUS",
                "SEX",
                "DATE OF BIRTH",
                "PLACE OF BIRTH",
                "STATUS",
                "ACTIONS",
              ].map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={14}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  Loading employee records...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={14}
                  className="px-4 py-10 text-center text-sm text-red-500"
                >
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={14}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  No employee records found.
                </td>
              </tr>
            ) : (
              rows.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-t border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
                >
                  <td className="px-3 py-3 align-top">{employee.id}</td>
                  <td className="px-3 py-3 align-top">{employee.email || "—"}</td>
                  <td className="px-3 py-3 align-top">{employee.district || "—"}</td>
                  <td className="px-3 py-3 align-top">{employee.school || "—"}</td>
                  <td className="px-3 py-3 align-top">{employee.lastName || "—"}</td>
                  <td className="px-3 py-3 align-top">{employee.firstName || "—"}</td>
                  <td className="px-3 py-3 align-top">{employee.middleName || "—"}</td>
                  <td className="px-3 py-3 align-top">{employee.middleInitial || "—"}</td>
                  <td className="px-3 py-3 align-top">{employee.civilStatus || "—"}</td>
                  <td className="px-3 py-3 align-top">{employee.gender || "—"}</td>
                  <td className="px-3 py-3 align-top">
                    {formatDateForDisplay(employee.dateOfBirth)}
                  </td>
                  <td className="px-3 py-3 align-top">{employee.place || "—"}</td>
                  <td className="px-3 py-3 align-top">
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      {employee.teacherStatus || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(employee)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white transition hover:bg-indigo-700"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(employee)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white transition hover:bg-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing {startIndex} to {endIndex} of {totalItems} entries
        </p>

        <div className="flex items-center gap-2 self-end">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <button
            type="button"
            className="h-9 min-w-9 rounded-lg bg-[#2f80ed] px-3 text-sm font-medium text-white"
          >
            {currentPage}
          </button>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}