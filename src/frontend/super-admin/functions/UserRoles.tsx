"use client";

import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type RegistrationRequest = {
  id: number;
  username: string;
  email: string;
  school: string;
  requested_role: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

export default function UserRoles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data - will connect to backend later
  const mockData: RegistrationRequest[] = [
    {
      id: 1,
      username: "carmen.lee",
      email: "carmen.lee@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "DATA_ENCODER",
      status: "PENDING",
      created_at: "2026-03-09",
    },
    {
      id: 2,
      username: "benito.santos",
      email: "benito.santos@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "ADMIN",
      status: "PENDING",
      created_at: "2026-03-09",
    },
    {
      id: 3,
      username: "arianna.cruz",
      email: "arianna.cruz@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "DATA_ENCODER",
      status: "PENDING",
      created_at: "2026-03-08",
    },
    {
      id: 4,
      username: "mable.siriwalee",
      email: "mable.siriwalee@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "ADMIN",
      status: "PENDING",
      created_at: "2026-03-08",
    },
    {
      id: 5,
      username: "june.nannipin",
      email: "june.nannipin@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "DATA_ENCODER",
      status: "PENDING",
      created_at: "2026-03-07",
    },
    {
      id: 6,
      username: "enjoy.thidarut",
      email: "enjoy.thidarut@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "ADMIN",
      status: "PENDING",
      created_at: "2026-03-07",
    },
    {
      id: 7,
      username: "jingjing.yu",
      email: "jingjing.yu@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "DATA_ENCODER",
      status: "PENDING",
      created_at: "2026-03-06",
    },
    {
      id: 8,
      username: "nur.desorayat",
      email: "nur.desorayat@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "ADMIN",
      status: "PENDING",
      created_at: "2026-03-06",
    },
    {
      id: 9,
      username: "tangkwa.phinyanech",
      email: "tangkwa.phinyanech@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "DATA_ENCODER",
      status: "PENDING",
      created_at: "2026-03-05",
    },
    {
      id: 10,
      username: "bonnie.pattraphus",
      email: "bonnie.pattraphus@deped.gov.ph",
      school: "San Jose Del Monte National High School",
      requested_role: "ADMIN",
      status: "PENDING",
      created_at: "2026-03-05",
    },
  ];

  const filteredData = mockData.filter((item) => {
    const matchesSearch =
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.school.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "DATA_ENCODER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User & Roles</h1>

      {/* Header with search and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search username, email, or school"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          Search
        </button>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-0.75 px-4 font-semibold text-blue-600 uppercase text-sm">
                Username
              </th>
              <th className="text-left py-0.75 px-4 font-semibold text-blue-600 uppercase text-sm">
                Email
              </th>
              <th className="text-left py-0.75 px-4 font-semibold text-blue-600 uppercase text-sm">
                School
              </th>
              <th className="text-left py-0.75 px-4 font-semibold text-blue-600 uppercase text-sm">
                Requested Role
              </th>
              <th className="text-center py-0.75 px-4 font-semibold text-blue-600 uppercase text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-0.75 px-4 text-gray-900 text-sm font-medium">
                    {item.username}
                  </td>
                  <td className="py-0.75 px-4 text-gray-700 text-sm">
                    {item.email}
                  </td>
                  <td className="py-0.75 px-4 text-gray-700 text-sm">
                    {item.school}
                  </td>
                  <td className="py-0.75 px-4">
                    <span
                      className={`px-3 py-0 rounded-full text-xs font-medium ${getRoleBadgeColor(item.requested_role)}`}
                    >
                      {item.requested_role === "DATA_ENCODER"
                        ? "Data Encoder"
                        : item.requested_role}
                    </span>
                  </td>
                  <td className="py-0.75 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="px-3 py-0 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium">
                        Details
                      </button>
                      <button className="px-3 py-0 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-medium">
                        Approve
                      </button>
                      <button className="px-3 py-0 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium">
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No registration requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-9 h-9 rounded font-medium text-sm transition ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
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
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
