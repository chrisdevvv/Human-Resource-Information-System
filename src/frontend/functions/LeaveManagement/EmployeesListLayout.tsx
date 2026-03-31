"use client";

import React from "react";

export default function EmployeesListLayout() {
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-3 sm:p-6 sticky top-0 sm:top-4 h-screen sm:h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6">
          Employees List
        </h1>

        <div className="flex-1 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center">
          <p className="text-sm sm:text-base text-gray-500 text-center px-4">
            No employee data yet.
          </p>
        </div>
      </div>
    </div>
  );
}
