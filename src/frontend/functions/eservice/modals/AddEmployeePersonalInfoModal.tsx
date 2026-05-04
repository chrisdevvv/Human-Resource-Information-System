"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, UserPlus, X, AlertCircle } from "lucide-react";
import type {
  DistrictOption,
  EmployeePersonalInfoForm,
  SchoolOption,
} from "../eserviceApi";
import ConfirmationModal from "@/frontend/super-admin/components/ConfirmationModal";
import ToastMessage from "@/frontend/components/ToastMessage";

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

type FormErrors = Partial<Record<keyof EmployeePersonalInfoForm, string>>;

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [initialFormState, setInitialFormState] =
    useState<EmployeePersonalInfoForm>(INITIAL_FORM);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      const isSdoEmployee =
        initialData.district.toUpperCase() === "SDO" ||
        initialData.school.toUpperCase() === "SDO";

      const editForm = {
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
      };

      setForm(editForm);
      setInitialFormState(editForm);
      setNoMiddleName(!initialData.middleName && !initialData.middleInitial);
      setErrors({});
      return;
    }

    setForm(INITIAL_FORM);
    setInitialFormState(INITIAL_FORM);
    setNoMiddleName(false);
    setErrors({});
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

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const namePattern = /^[A-Z .'-]+$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    } else if (!namePattern.test(form.firstName.trim())) {
      nextErrors.firstName = "First name contains invalid characters.";
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    } else if (!namePattern.test(form.lastName.trim())) {
      nextErrors.lastName = "Last name contains invalid characters.";
    }

    if (form.middleName.trim() && !namePattern.test(form.middleName.trim())) {
      nextErrors.middleName = "Middle name contains invalid characters.";
    }

    if (
      form.middle_initial.trim() &&
      !/^[A-Z]{1,4}\.?$/.test(form.middle_initial.trim())
    ) {
      nextErrors.middle_initial = "Enter a valid middle initial.";
    }

    if (form.email.trim() && !emailPattern.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.dateOfBirth) {
      nextErrors.dateOfBirth = "Birth date is required.";
    } else {
      const selectedDate = new Date(form.dateOfBirth);
      const today = new Date();
      if (selectedDate > today) {
        nextErrors.dateOfBirth = "Birth date cannot be in the future.";
      }
    }

    if (!form.place.trim()) {
      nextErrors.place = "Place of birth is required.";
    }

    if (!form.isSdoEmployee && !form.district.trim()) {
      nextErrors.district = "District is required.";
    }

    if (!form.isSdoEmployee && !form.school.trim()) {
      nextErrors.school = "School is required.";
    }

    if (!form.gender.trim()) {
      nextErrors.gender = "Sex is required.";
    }

    if (!form.civilStatus.trim()) {
      nextErrors.civilStatus = "Civil status is required.";
    }

    if (form.MISR.trim() && !/^[A-Z0-9-]+$/.test(form.MISR.trim())) {
      nextErrors.MISR = "MISR must contain only letters, numbers, or hyphens.";
    }

    if (!form.teacher_status.trim()) {
      nextErrors.teacher_status = "Status is required.";
    }

    return nextErrors;
  };

  const updateForm = <K extends keyof EmployeePersonalInfoForm>(
    key: K,
    value: EmployeePersonalInfoForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSdoToggle = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      isSdoEmployee: checked,
      district: checked ? "SDO" : "",
      school: checked ? "SDO" : "",
    }));

    setErrors((prev) => ({
      ...prev,
      district: undefined,
      school: undefined,
    }));
  };

  const handleNoMiddleNameToggle = (checked: boolean) => {
    setNoMiddleName(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        middleName: "N/A",
        middle_initial: "N/A",
      }));
      setErrors((prev) => ({
        ...prev,
        middleName: undefined,
        middle_initial: undefined,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        middleName: "",
        middle_initial: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    if (mode === "add") {
      setShowConfirmation(true);
    } else {
      setShowSaveConfirmation(true);
    }
  };

  const performSubmit = async () => {
    setShowConfirmation(false);
    setShowSaveConfirmation(false);
    setSubmitting(true);

    try {
      await onSubmit(form);
      onClose();
      setTimeout(() => {
        setShowToast(true);
      }, 100);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearAll = () => {
    setForm(initialFormState);
    setErrors({});
  };

  const hasChanges = useMemo(() => {
    if (mode !== "edit") return false;
    return JSON.stringify(form) !== JSON.stringify(initialFormState);
  }, [form, initialFormState, mode]);

  if (!isOpen) return null;

  const employeeName =
    `${form.firstName} ${form.middleName} ${form.lastName}`.trim() ||
    "this employee";

  const inputBaseClass =
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-gray-700 placeholder:text-[11px] placeholder:text-gray-400 outline-none transition duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-sm";
  const selectBaseClass =
    "w-full cursor-pointer rounded-xl border bg-white px-3.5 py-2.5 text-xs text-gray-700 outline-none transition duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-sm";
  const labelClass =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600 sm:text-[11px]";
  const cardClass =
    "rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm ring-1 ring-gray-100/70";
  const getFieldClass = (field: keyof EmployeePersonalInfoForm) =>
    `${field in errors && errors[field] ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-300"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-6">
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-white/40 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-white to-white px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shadow-sm">
                <UserPlus className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-950 sm:text-xl">
                  {mode === "edit"
                    ? "Edit Employee Personal Info"
                    : "Add Employee Personal Info"}
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 sm:text-sm">
                  Fill out the employee profile details below.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto bg-gray-50/70 p-4 sm:p-6"
        >
          <div className="mb-5 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 shadow-sm">
              <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                <span className="font-semibold text-red-500">Note:</span> Check
                the box if currently employed in School Division Office.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 sm:text-sm">
              <input
                type="checkbox"
                checked={form.isSdoEmployee}
                onChange={(e) => handleSdoToggle(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              School Division Office (SDO) Employee
            </label>
          </div>

          <div className="hidden space-y-5 md:block">
            <section className={cardClass}>
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Basic Information
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Employee name and birth details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <label className={labelClass}>First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) =>
                      updateForm("firstName", e.target.value.toUpperCase())
                    }
                    className={`${inputBaseClass} ${getFieldClass("firstName")}`}
                    placeholder="FIRST NAME"
                    required
                  />
                  {errors.firstName ? (
                    <FieldError message={errors.firstName} />
                  ) : null}
                </div>

                <div className="col-span-4">
                  <label className={labelClass}>Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) =>
                      updateForm("lastName", e.target.value.toUpperCase())
                    }
                    className={`${inputBaseClass} ${getFieldClass("lastName")}`}
                    placeholder="LAST NAME"
                    required
                  />
                  {errors.lastName ? (
                    <FieldError message={errors.lastName} />
                  ) : null}
                </div>

                <div className="col-span-3">
                  <label className={labelClass}>Middle Name</label>
                  <input
                    value={form.middleName}
                    onChange={(e) =>
                      updateForm("middleName", e.target.value.toUpperCase())
                    }
                    disabled={noMiddleName}
                    className={`${inputBaseClass} ${getFieldClass("middleName")} ${
                      noMiddleName ? "cursor-not-allowed bg-gray-100" : ""
                    }`}
                    placeholder="MIDDLE NAME"
                  />

                  <label className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={noMiddleName}
                      onChange={(e) =>
                        handleNoMiddleNameToggle(e.target.checked)
                      }
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    I don't have a middle name
                  </label>

                  {errors.middleName ? (
                    <FieldError message={errors.middleName} />
                  ) : null}
                </div>

                <div className="col-span-1">
                  <label className={labelClass}>MI</label>
                  <input
                    value={form.middle_initial}
                    onChange={(e) =>
                      updateForm(
                        "middle_initial",
                        e.target.value.toUpperCase(),
                      )
                    }
                    disabled={noMiddleName}
                    className={`${inputBaseClass} ${getFieldClass(
                      "middle_initial",
                    )} ${noMiddleName ? "cursor-not-allowed bg-gray-100" : ""}`}
                    placeholder="M.I."
                  />
                  {errors.middle_initial ? (
                    <FieldError message={errors.middle_initial} />
                  ) : null}
                </div>

                <div className="col-span-3">
                  <label className={labelClass}>Birth Day</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                    className={`${inputBaseClass} ${getFieldClass(
                      "dateOfBirth",
                    )}`}
                  />
                  {errors.dateOfBirth ? (
                    <FieldError message={errors.dateOfBirth} />
                  ) : null}
                </div>

                <div className="col-span-5">
                  <label className={labelClass}>Place of Birth</label>
                  <input
                    value={form.place}
                    onChange={(e) =>
                      updateForm("place", e.target.value.toUpperCase())
                    }
                    className={`${inputBaseClass} ${getFieldClass("place")}`}
                    placeholder="PLACE OF BIRTH"
                  />
                  {errors.place ? (
                    <FieldError message={errors.place} />
                  ) : null}
                </div>

                <div className="col-span-4">
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className={`${inputBaseClass} ${getFieldClass("email")}`}
                    placeholder="EMAIL"
                  />
                  {errors.email ? (
                    <FieldError message={errors.email} />
                  ) : null}
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Assignment Details
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    District, school, employment status, and identifiers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <label className={labelClass}>District</label>
                  <select
                    value={form.district}
                    onChange={(e) => updateForm("district", e.target.value)}
                    disabled={form.isSdoEmployee}
                    className={`${selectBaseClass} ${getFieldClass(
                      "district",
                    )} ${
                      form.isSdoEmployee
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
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
                  {errors.district ? (
                    <FieldError message={errors.district} />
                  ) : null}
                </div>

                <div className="col-span-4">
                  <label className={labelClass}>Schools</label>
                  <select
                    value={form.school}
                    onChange={(e) => updateForm("school", e.target.value)}
                    disabled={form.isSdoEmployee}
                    className={`${selectBaseClass} ${getFieldClass("school")} ${
                      form.isSdoEmployee
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  >
                    <option value="">Select school</option>
                    {filteredSchools.map((school) => (
                      <option key={String(school.id)} value={school.name}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                  {errors.school ? (
                    <FieldError message={errors.school} />
                  ) : null}
                </div>

                <div className="col-span-4">
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.teacher_status}
                    onChange={(e) =>
                      updateForm("teacher_status", e.target.value)
                    }
                    className={`${selectBaseClass} ${getFieldClass(
                      "teacher_status",
                    )}`}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.teacher_status ? (
                    <FieldError message={errors.teacher_status} />
                  ) : null}
                </div>

                <div className="col-span-4">
                  <label className={labelClass}>Civil Status</label>
                  <select
                    value={form.civilStatus}
                    onChange={(e) =>
                      updateForm("civilStatus", e.target.value)
                    }
                    className={`${selectBaseClass} ${getFieldClass(
                      "civilStatus",
                    )}`}
                  >
                    <option value="">Select civil status</option>
                    {CIVIL_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.civilStatus ? (
                    <FieldError message={errors.civilStatus} />
                  ) : null}
                </div>

                <div className="col-span-4">
                  <label className={labelClass}>Sex</label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateForm("gender", e.target.value)}
                    className={`${selectBaseClass} ${getFieldClass("gender")}`}
                  >
                    <option value="">Select sex</option>
                    {SEX_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.gender ? (
                    <FieldError message={errors.gender} />
                  ) : null}
                </div>

                <div className="col-span-4">
                  <label className={labelClass}>MISR</label>
                  <input
                    value={form.MISR}
                    onChange={(e) =>
                      updateForm("MISR", e.target.value.toUpperCase())
                    }
                    className={`${inputBaseClass} ${getFieldClass("MISR")}`}
                    placeholder="MISR"
                  />
                  {errors.MISR ? (
                    <FieldError message={errors.MISR} />
                  ) : null}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4 md:hidden">
            <section className={cardClass}>
              <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold text-gray-900">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) =>
                      updateForm("firstName", e.target.value.toUpperCase())
                    }
                    className={`${inputBaseClass} ${getFieldClass("firstName")}`}
                    placeholder="FIRST NAME"
                    required
                  />
                  {errors.firstName ? (
                    <FieldError message={errors.firstName} />
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) =>
                      updateForm("lastName", e.target.value.toUpperCase())
                    }
                    className={`${inputBaseClass} ${getFieldClass("lastName")}`}
                    placeholder="LAST NAME"
                    required
                  />
                  {errors.lastName ? (
                    <FieldError message={errors.lastName} />
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Middle Name</label>
                    <input
                      value={form.middleName}
                      onChange={(e) =>
                        updateForm("middleName", e.target.value.toUpperCase())
                      }
                      disabled={noMiddleName}
                      className={`${inputBaseClass} ${getFieldClass(
                        "middleName",
                      )} ${noMiddleName ? "cursor-not-allowed bg-gray-100" : ""}`}
                      placeholder="MIDDLE NAME"
                    />
                    <label className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={noMiddleName}
                        onChange={(e) =>
                          handleNoMiddleNameToggle(e.target.checked)
                        }
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      No middle name
                    </label>
                    {errors.middleName ? (
                      <FieldError message={errors.middleName} />
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass}>MI</label>
                    <input
                      value={form.middle_initial}
                      onChange={(e) =>
                        updateForm(
                          "middle_initial",
                          e.target.value.toUpperCase(),
                        )
                      }
                      disabled={noMiddleName}
                      className={`${inputBaseClass} ${getFieldClass(
                        "middle_initial",
                      )} ${noMiddleName ? "cursor-not-allowed bg-gray-100" : ""}`}
                      placeholder="M.I."
                    />
                    {errors.middle_initial ? (
                      <FieldError message={errors.middle_initial} />
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Birth Day</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                    className={`${inputBaseClass} ${getFieldClass(
                      "dateOfBirth",
                    )}`}
                  />
                  {errors.dateOfBirth ? (
                    <FieldError message={errors.dateOfBirth} />
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>Place of Birth</label>
                  <input
                    value={form.place}
                    onChange={(e) =>
                      updateForm("place", e.target.value.toUpperCase())
                    }
                    className={`${inputBaseClass} ${getFieldClass("place")}`}
                    placeholder="PLACE OF BIRTH"
                  />
                  {errors.place ? (
                    <FieldError message={errors.place} />
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className={`${inputBaseClass} ${getFieldClass("email")}`}
                    placeholder="EMAIL"
                  />
                  {errors.email ? (
                    <FieldError message={errors.email} />
                  ) : null}
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-bold text-gray-900">
                Assignment Details
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelClass}>District</label>
                  <select
                    value={form.district}
                    onChange={(e) => updateForm("district", e.target.value)}
                    disabled={form.isSdoEmployee}
                    className={`${selectBaseClass} ${getFieldClass(
                      "district",
                    )} ${
                      form.isSdoEmployee
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
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
                  {errors.district ? (
                    <FieldError message={errors.district} />
                  ) : null}
                </div>

                <div>
                  <label className={labelClass}>Schools</label>
                  <select
                    value={form.school}
                    onChange={(e) => updateForm("school", e.target.value)}
                    disabled={form.isSdoEmployee}
                    className={`${selectBaseClass} ${getFieldClass("school")} ${
                      form.isSdoEmployee
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  >
                    <option value="">Select school</option>
                    {filteredSchools.map((school) => (
                      <option key={String(school.id)} value={school.name}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                  {errors.school ? (
                    <FieldError message={errors.school} />
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Civil Status</label>
                    <select
                      value={form.civilStatus}
                      onChange={(e) =>
                        updateForm("civilStatus", e.target.value)
                      }
                      className={`${selectBaseClass} ${getFieldClass(
                        "civilStatus",
                      )}`}
                    >
                      <option value="">Select civil status</option>
                      {CIVIL_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.civilStatus ? (
                      <FieldError message={errors.civilStatus} />
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass}>Sex</label>
                    <select
                      value={form.gender}
                      onChange={(e) => updateForm("gender", e.target.value)}
                      className={`${selectBaseClass} ${getFieldClass("gender")}`}
                    >
                      <option value="">Select sex</option>
                      {SEX_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.gender ? (
                      <FieldError message={errors.gender} />
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>MISR</label>
                    <input
                      value={form.MISR}
                      onChange={(e) =>
                        updateForm("MISR", e.target.value.toUpperCase())
                      }
                      className={`${inputBaseClass} ${getFieldClass("MISR")}`}
                      placeholder="MISR"
                    />
                    {errors.MISR ? (
                      <FieldError message={errors.MISR} />
                    ) : null}
                  </div>

                  <div>
                    <label className={labelClass}>Status</label>
                    <select
                      value={form.teacher_status}
                      onChange={(e) =>
                        updateForm("teacher_status", e.target.value)
                      }
                      className={`${selectBaseClass} ${getFieldClass(
                        "teacher_status",
                      )}`}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.teacher_status ? (
                      <FieldError message={errors.teacher_status} />
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 -mx-4 mt-6 border-t border-gray-200 bg-white/95 px-4 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:-mx-6 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {mode === "edit" && hasChanges && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 sm:text-sm"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 sm:text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-100 px-5 py-2.5 text-xs font-bold text-green-800 shadow-sm transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {submitting
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add New"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationModal
        visible={showConfirmation}
        title="Confirm Add Employee"
        message={`Are you sure you want to add ${employeeName}?`}
        confirmLabel="Yes, Add"
        cancelLabel="Cancel"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        loading={submitting}
        onConfirm={performSubmit}
        onCancel={() => setShowConfirmation(false)}
      />

      <ConfirmationModal
        visible={showSaveConfirmation}
        title="Confirm Save Changes"
        message={`Are you sure you want to save changes for ${employeeName}?`}
        confirmLabel="Yes, Save"
        cancelLabel="Cancel"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        loading={submitting}
        onConfirm={performSubmit}
        onCancel={() => setShowSaveConfirmation(false)}
      />

      <ToastMessage
        isVisible={showToast}
        title="Success"
        message={
          mode === "edit"
            ? "Employee updated successfully!"
            : "Employee added successfully!"
        }
        variant="success"
        position="bottom-right"
        onClose={() => setShowToast(false)}
        autoCloseDuration={2000}
      />
    </div>
  );
}

type FieldErrorProps = {
  message: string;
};

function FieldError({ message }: FieldErrorProps) {
  return (
    <p className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-medium text-red-600">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}