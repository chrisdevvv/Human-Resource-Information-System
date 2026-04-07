"use client";

import React from "react";
import EditEmployee from "../../../super-admin/functions/EmployeesList/EditEmployee";

type ViewEmployeeModalProps = {
  visible: boolean;
  employee: {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    fullName: string;
    email: string;
    employeeType: "teaching" | "non-teaching";
    schoolId: number | null;
    schoolName: string;
    birthdate: string;
  } | null;
  canEdit: boolean;
  onEmployeeUpdated: (employee: {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    fullName: string;
    email: string;
    employeeType: "teaching" | "non-teaching";
    schoolId: number | null;
    schoolName: string;
    birthdate: string;
  }) => void;
  onClose: () => void;
};

export default function ViewEmployeeModal({
  visible,
  employee,
  canEdit,
  onEmployeeUpdated,
  onClose,
}: ViewEmployeeModalProps) {
  if (!visible || !employee) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-blue-200 bg-white p-6 shadow-lg sm:p-8">
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Employee Details
        </h2>

        <EditEmployee
          employee={employee}
          canEdit={canEdit}
          onClose={onClose}
          onEmployeeUpdated={onEmployeeUpdated}
        />
      </div>
    </div>
  );
}
