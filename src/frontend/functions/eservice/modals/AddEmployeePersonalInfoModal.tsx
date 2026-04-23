"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, UserPlus, X } from "lucide-react";
import type {
  DistrictOption,
  EmployeePersonalInfoForm,
  SchoolOption,
} from "../eserviceApi";

export type EmployeePersonalInfoRecord = {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  middleInitial: string;
  misr: string;
  email: string;
  dateOfBirth: string;
  place: string;
  district: string;
  school: string;
  gender: string;
  civilStatus: string;
  teacherStatus: string;
  fullName: string;
};

const CIVIL_STATUS_OPTIONS = ["Single", "Married", "Widowed", "Separated"];
const SEX_OPTIONS = ["Male", "Female"];
const STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Resigned",
  "Transferred to another SDO",
];

const INITIAL_FORM: EmployeePersonalInfoForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  middle_initial: "",
  MISR: "",
  email: "",
  dateOfBirth: "",
  place: "",
  district: "",
  school: "",
  gender: "",
  civilStatus: "",
  teacher_status: "Active",
  isSdoEmployee: false,
};

type Props = {
  isOpen: boolean;
  mode?: "add" | "edit";
  districts: DistrictOption[];
  schools: SchoolOption[];
  initialData?: EmployeePersonalInfoRecord | null;
  onClose: () => void;
  onSubmit: (payload: EmployeePersonalInfoForm) => Promise<void> | void;
};

export default function AddEmployeePersonalInfoModal({
  isOpen,
  mode = "add",
  districts,
  schools,
  initialData,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<EmployeePersonalInfoForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      const isSdoEmployee =
        initialData.district.toUpperCase() === "SDO" ||
        initialData.school.toUpperCase() === "SDO";

      setForm({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        middleName: initialData.middleName,
        middle_initial: initialData.middleInitial,
        MISR: initialData.misr,
        email: initialData.email,
        dateOfBirth: initialData.dateOfBirth,
        place: initialData.place,
        district: initialData.district,
        school: initialData.school,
        gender: initialData.gender,
        civilStatus: initialData.civilStatus,
        teacher_status: initialData.teacherStatus || "Active",
        isSdoEmployee,
      });
      return;
    }

    setForm(INITIAL_FORM);
  }, [isOpen, mode, initialData]);

  const filteredSchools = useMemo(() => {
    if (form.isSdoEmployee) {
      return schools.filter((school) => school.name.toUpperCase() === "SDO");
    }

    if (!form.district) return schools;

    return schools.filter((school) => {
      if (!school.district) return true;
      return school.district === form.district;
    });
  }, [form.district, form.isSdoEmployee, schools]);

  const updateForm = <K extends keyof EmployeePersonalInfoForm>(
    key: K,
    value: EmployeePersonalInfoForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSdoToggle = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      isSdoEmployee: checked,
      district: checked ? "SDO" : "",
      school: checked ? "SDO" : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <UserPlus className="h-5 w-5 text-blue-600" />
              {mode === "edit"
                ? "Edit Employee Personal Info"
                : "Add Employee Personal Info"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Fields are based on the emppersonalinfo schema.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="mb-3 text-sm text-gray-500">
            <span className="font-semibold text-red-500">Note:</span> Check the
            box if currently employed in School Division Office.
          </p>

          <label className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={form.isSdoEmployee}
              onChange={(e) => handleSdoToggle(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            School Division Office (SDO) Employee
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                First Name
              </label>
              <input
                value={form.firstName}
                onChange={(e) =>
                  updateForm("firstName", e.target.value.toUpperCase())
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="FIRST NAME"
                required
              />
            </div>

            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Last Name
              </label>
              <input
                value={form.lastName}
                onChange={(e) =>
                  updateForm("lastName", e.target.value.toUpperCase())
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="LAST NAME"
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Middle Name
              </label>
              <input
                value={form.middleName}
                onChange={(e) =>
                  updateForm("middleName", e.target.value.toUpperCase())
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="MIDDLE NAME"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                MI
              </label>
              <input
                value={form.middle_initial}
                onChange={(e) =>
                  updateForm("middle_initial", e.target.value.toUpperCase())
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="M.I."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Birth Day
              </label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="md:col-span-6">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Place of Birth
              </label>
              <input
                value={form.place}
                onChange={(e) =>
                  updateForm("place", e.target.value.toUpperCase())
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="PLACE OF BIRTH"
              />
            </div>

            <div className="md:col-span-4">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="EMAIL"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                District
              </label>
              <select
                value={form.district}
                onChange={(e) => updateForm("district", e.target.value)}
                disabled={form.isSdoEmployee}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
              >
                <option value="">Select district</option>
                {districts
                  .filter((district) => district.status !== 0)
                  .map((district) => (
                    <option
                      key={district.districtId}
                      value={district.districtName}
                    >
                      {district.districtName}
                    </option>
                  ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Schools
              </label>
              <select
                value={form.school}
                onChange={(e) => updateForm("school", e.target.value)}
                disabled={form.isSdoEmployee}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
              >
                <option value="">Select school</option>
                {filteredSchools.map((school) => (
                  <option key={String(school.id)} value={school.name}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Civil Status
              </label>
              <select
                value={form.civilStatus}
                onChange={(e) => updateForm("civilStatus", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select civil status</option>
                {CIVIL_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Sex
              </label>
              <select
                value={form.gender}
                onChange={(e) => updateForm("gender", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select sex</option>
                {SEX_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                MISR
              </label>
              <input
                value={form.MISR}
                onChange={(e) =>
                  updateForm("MISR", e.target.value.toUpperCase())
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="MISR"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
                Status
              </label>
              <select
                value={form.teacher_status}
                onChange={(e) => updateForm("teacher_status", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {submitting
                ? "Saving..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Add New"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}