"use client";

import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import ConfirmationAddLeave from "../ConfirmationAddLeave";
import AddLeaveSuccess from "../AddLeaveSuccess";
import { getLeaveHistoryByEmployee, getLeaveParticulars } from "../leaveApi";
import { createClearHandler, hasFormData } from "../../../utils/clearFormUtils";
import { SkeletonListItem } from "../../../components/Skeleton/SkeletonUtils";

export type AddLeaveFormValues = {
  employee_id: number;
  period_of_leave: string;
  particulars: string;
  isMonetization: boolean;
  earned_vl: number;
  abs_with_pay_vl: number;
  abs_without_pay_vl: number;
  earned_sl: number;
  abs_with_pay_sl: number;
  abs_without_pay_sl: number;
};

type AddLeaveModalProps = {
  isOpen: boolean;
  employeeId: number | null;
  employeeName: string;
  onClose: () => void;
  onSave: (payload: AddLeaveFormValues) => Promise<void> | void;
  isSaving?: boolean;
};

type NumericLeaveField =
  | "earned_vl"
  | "abs_with_pay_vl"
  | "abs_without_pay_vl"
  | "earned_sl"
  | "abs_with_pay_sl"
  | "abs_without_pay_sl";

type AddLeaveFormState = {
  period_of_leave: string;
  particulars: string;
  hasVacationLeave: boolean;
  hasSickLeave: boolean;
  earned_vl: string;
  abs_with_pay_vl: string;
  abs_without_pay_vl: string;
  earned_sl: string;
  abs_with_pay_sl: string;
  abs_without_pay_sl: string;
};

const NUMERIC_FIELDS = new Set<NumericLeaveField>([
  "earned_vl",
  "abs_with_pay_vl",
  "abs_without_pay_vl",
  "earned_sl",
  "abs_with_pay_sl",
  "abs_without_pay_sl",
]);

const MAX_WHOLE_DIGITS = 6;
const MAX_DECIMAL_DIGITS = 3;
const DECIMAL_3_PATTERN = new RegExp(
  `^\\d{0,${MAX_WHOLE_DIGITS}}(\\.\\d{0,${MAX_DECIMAL_DIGITS}})?$`,
);
const NUMERIC_INPUT_PATTERN = `^\\d{0,${MAX_WHOLE_DIGITS}}(\\.\\d{0,${MAX_DECIMAL_DIGITS}})?$`;
const NUMERIC_MAX_LENGTH = MAX_WHOLE_DIGITS + 1 + MAX_DECIMAL_DIGITS;

const defaultForm: AddLeaveFormState = {
  period_of_leave: "",
  particulars: "",
  hasVacationLeave: false,
  hasSickLeave: false,
  earned_vl: "",
  abs_with_pay_vl: "",
  abs_without_pay_vl: "",
  earned_sl: "",
  abs_with_pay_sl: "",
  abs_without_pay_sl: "",
};

export default function AddLeaveModal({
  isOpen,
  employeeId,
  employeeName,
  onClose,
  onSave,
  isSaving = false,
}: AddLeaveModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [currentBalVl, setCurrentBalVl] = useState<number | null>(null);
  const [currentBalSl, setCurrentBalSl] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<AddLeaveFormValues | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    employeeName: string;
    period_of_leave: string;
    particulars: string;
    isMonetization: boolean;
  } | null>(null);
  const [particularOptions, setParticularOptions] = useState<string[]>([]);
  const [particularsLoading, setParticularsLoading] = useState(false);
  const [particularInputValue, setParticularInputValue] = useState("");
  const [showParticularDropdown, setShowParticularDropdown] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm);
      setParticularInputValue("");
      setShowParticularDropdown(false);
      setIsConfirmOpen(false);
      setPendingPayload(null);
      setIsSuccessOpen(false);
      setSuccessData(null);
      setFormError("");
      setCurrentBalVl(null);
      setCurrentBalSl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const loadParticularOptions = async () => {
      if (!isOpen) return;

      try {
        setParticularsLoading(true);
        const options = await getLeaveParticulars();
        setParticularOptions(options);
      } catch {
        setParticularOptions([]);
      } finally {
        setParticularsLoading(false);
      }
    };

    void loadParticularOptions();
  }, [isOpen]);

  useEffect(() => {
    const loadCurrentBalance = async () => {
      if (!isOpen || !employeeId) return;

      try {
        const rows = await getLeaveHistoryByEmployee(employeeId);

        if (!rows || rows.length === 0) {
          setCurrentBalVl(0);
          setCurrentBalSl(0);
          return;
        }

        const latest = rows[rows.length - 1];
        setCurrentBalVl(Number(latest.balVl || 0));
        setCurrentBalSl(Number(latest.balSl || 0));
      } catch {
        setCurrentBalVl(null);
        setCurrentBalSl(null);
      }
    };

    void loadCurrentBalance();
  }, [isOpen, employeeId]);

  if (!isOpen || !employeeId) {
    return null;
  }

  const resolvedEmployeeId = employeeId;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

    if (formError) {
      setFormError("");
    }

    setForm((prev) => {
      if (NUMERIC_FIELDS.has(name as NumericLeaveField)) {
        if (value !== "" && !DECIMAL_3_PATTERN.test(value)) {
          return prev;
        }

        return {
          ...prev,
          [name]: value,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function handleVacationLeaveToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;

    if (formError) {
      setFormError("");
    }

    setForm((prev) => ({
      ...prev,
      hasVacationLeave: checked,
    }));
  }

  function handleSickLeaveToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;

    if (formError) {
      setFormError("");
    }

    setForm((prev) => ({
      ...prev,
      hasSickLeave: checked,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.period_of_leave.trim()) {
      setFormError("Period of leave is required.");
      return;
    }

    if (!form.particulars.trim()) {
      setFormError("Particulars is required.");
      return;
    }

    if (particularOptions.length === 0) {
      setFormError("Unable to load leave particulars. Please try again.");
      return;
    }

    if (!particularOptions.includes(form.particulars.trim())) {
      setFormError("Please select a valid Particulars option.");
      return;
    }

    if (!form.hasVacationLeave && !form.hasSickLeave) {
      setFormError("Please select at least one leave type.");
      return;
    }

    const payload: AddLeaveFormValues = {
      employee_id: resolvedEmployeeId,
      period_of_leave: form.period_of_leave.trim(),
      particulars: form.particulars.trim(),
      isMonetization: false,
      earned_vl: form.hasVacationLeave ? Number(form.earned_vl || 0) : 0,
      abs_with_pay_vl: form.hasVacationLeave
        ? Number(form.abs_with_pay_vl || 0)
        : 0,
      abs_without_pay_vl: form.hasVacationLeave
        ? Number(form.abs_without_pay_vl || 0)
        : 0,
      earned_sl: form.hasSickLeave ? Number(form.earned_sl || 0) : 0,
      abs_with_pay_sl: form.hasSickLeave
        ? Number(form.abs_with_pay_sl || 0)
        : 0,
      abs_without_pay_sl: form.hasSickLeave
        ? Number(form.abs_without_pay_sl || 0)
        : 0,
    };

    setPendingPayload(payload);
    setIsConfirmOpen(true);
  }

  async function handleConfirmSave() {
    if (!pendingPayload) {
      return;
    }

    try {
      await onSave(pendingPayload);
      setFormError("");
      setIsConfirmOpen(false);
      setSuccessData({
        employeeName,
        period_of_leave: pendingPayload.period_of_leave,
        particulars: pendingPayload.particulars,
        isMonetization: pendingPayload.isMonetization,
      });
      setIsSuccessOpen(true);
      setPendingPayload(null);
    } catch (error) {
      console.error("Error saving leave:", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save leave entry. Please try again.",
      );
      setIsConfirmOpen(false);
      setPendingPayload(null);
    }
  }

  function handleCancelConfirm() {
    if (isSaving) {
      return;
    }

    setIsConfirmOpen(false);
  }

  function handleClearAllFields() {
    setForm(defaultForm);
    setParticularInputValue("");
    setShowParticularDropdown(false);
    setFormError("");
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  const filteredParticularOptions = particularOptions.filter((option) =>
    option.toLowerCase().includes(particularInputValue.trim().toLowerCase()),
  );

  const hasEarnedVl = form.earned_vl !== "";
  const hasAbsWithPayVl = form.abs_with_pay_vl !== "";
  const hasAbsWithoutPayVl = form.abs_without_pay_vl !== "";
  const hasEarnedSl = form.earned_sl !== "";
  const hasAbsWithPaySl = form.abs_with_pay_sl !== "";
  const hasAbsWithoutPaySl = form.abs_without_pay_sl !== "";

  const disableEarnedVl = hasAbsWithPayVl || hasAbsWithoutPayVl;
  const disableAbsWithPayVlByNegativeBalance =
    currentBalVl !== null && Number(currentBalVl) < 0;
  const disableAbsWithPayVl =
    hasEarnedVl || hasAbsWithoutPayVl || disableAbsWithPayVlByNegativeBalance;
  const disableAbsWithoutPayVl = hasEarnedVl || hasAbsWithPayVl;

  const disableEarnedSl = hasAbsWithPaySl || hasAbsWithoutPaySl;
  const disableAbsWithPaySlByNegativeBalance =
    currentBalSl !== null && Number(currentBalSl) < 0;
  const disableAbsWithPaySl =
    hasEarnedSl || hasAbsWithoutPaySl || disableAbsWithPaySlByNegativeBalance;
  const disableAbsWithoutPaySl = hasEarnedSl || hasAbsWithPaySl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-blue-200 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800">Add Leave Entry</h2>
        <p className="mt-1 text-sm text-gray-500">Employee: {employeeName}</p>

        {formError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className={labelClass}>Period of Leave</label>
            <input
              type="text"
              name="period_of_leave"
              value={form.period_of_leave}
              onChange={handleChange}
              placeholder="e.g. March 2026 or Mar. 21-23, 2026"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Particulars</label>
            <div className="relative">
              <input
                type="text"
                name="particulars"
                value={particularInputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (formError) {
                    setFormError("");
                  }
                  setParticularInputValue(value);
                  setShowParticularDropdown(true);
                  setForm((prev) => ({
                    ...prev,
                    particulars: "",
                  }));
                }}
                onFocus={() => setShowParticularDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowParticularDropdown(false), 150);
                }}
                disabled={particularsLoading}
                placeholder="Type to search particulars..."
                className={`${inputClass} ${
                  particularsLoading ? "cursor-not-allowed bg-gray-100" : ""
                }`}
              />
              {showParticularDropdown && (
                <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-blue-200 bg-white shadow-lg">
                  {particularsLoading ? (
                    <div className="flex flex-col gap-1 p-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonListItem
                          key={i}
                          includeIcon={false}
                          includeAvatar={false}
                        />
                      ))}
                    </div>
                  ) : particularOptions.length === 0 ? (
                    <div className="px-3 py-2 text-center text-sm text-gray-500">
                      No particulars available
                    </div>
                  ) : filteredParticularOptions.length > 0 ? (
                    filteredParticularOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          if (formError) {
                            setFormError("");
                          }
                          setParticularInputValue(option);
                          setShowParticularDropdown(false);
                          setForm((prev) => ({
                            ...prev,
                            particulars: option,
                          }));
                        }}
                        className={`w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50 ${
                          form.particulars === option
                            ? "bg-blue-100 font-medium text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-center text-sm text-gray-500">
                      No particulars match &quot;{particularInputValue}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
            {!particularsLoading && particularOptions.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                No particulars available. Please contact an administrator.
              </p>
            )}
            {form.particulars && (
              <p className="mt-1 text-xs text-green-700">
                Selected: {form.particulars}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Leave Type</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition">
                <input
                  type="checkbox"
                  checked={form.hasVacationLeave}
                  onChange={handleVacationLeaveToggle}
                  className="h-4 w-4"
                />
                Vacation Leave
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition">
                <input
                  type="checkbox"
                  checked={form.hasSickLeave}
                  onChange={handleSickLeaveToggle}
                  className="h-4 w-4"
                />
                Sick Leave
              </label>
            </div>
          </div>

          {form.hasVacationLeave && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Vacation Leave (VL)
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Earned VL</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={NUMERIC_INPUT_PATTERN}
                    maxLength={NUMERIC_MAX_LENGTH}
                    min="0"
                    name="earned_vl"
                    value={form.earned_vl}
                    onChange={handleChange}
                    disabled={disableEarnedVl}
                    className={`${inputClass} ${
                      disableEarnedVl
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : ""
                    }`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Abs With Pay VL</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={NUMERIC_INPUT_PATTERN}
                    maxLength={NUMERIC_MAX_LENGTH}
                    min="0"
                    name="abs_with_pay_vl"
                    value={form.abs_with_pay_vl}
                    onChange={handleChange}
                    disabled={disableAbsWithPayVl}
                    className={`${inputClass} ${
                      disableAbsWithPayVl
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : ""
                    }`}
                  />
                  {disableAbsWithPayVlByNegativeBalance && (
                    <p className="mt-1 text-xs text-blue-600">
                      Disabled because current VL balance is negative.
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Abs Without Pay VL</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={NUMERIC_INPUT_PATTERN}
                    maxLength={NUMERIC_MAX_LENGTH}
                    min="0"
                    name="abs_without_pay_vl"
                    value={form.abs_without_pay_vl}
                    onChange={handleChange}
                    disabled={disableAbsWithoutPayVl}
                    className={`${inputClass} ${
                      disableAbsWithoutPayVl
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {form.hasSickLeave && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Sick Leave (SL)
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Earned SL</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={NUMERIC_INPUT_PATTERN}
                    maxLength={NUMERIC_MAX_LENGTH}
                    min="0"
                    name="earned_sl"
                    value={form.earned_sl}
                    onChange={handleChange}
                    disabled={disableEarnedSl}
                    className={`${inputClass} ${
                      disableEarnedSl
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : ""
                    }`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Abs With Pay SL</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={NUMERIC_INPUT_PATTERN}
                    maxLength={NUMERIC_MAX_LENGTH}
                    min="0"
                    name="abs_with_pay_sl"
                    value={form.abs_with_pay_sl}
                    onChange={handleChange}
                    disabled={disableAbsWithPaySl}
                    className={`${inputClass} ${
                      disableAbsWithPaySl
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : ""
                    }`}
                  />
                  {disableAbsWithPaySlByNegativeBalance && (
                    <p className="mt-1 text-xs text-blue-600">
                      Disabled because current SL balance is negative.
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Abs Without Pay SL</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern={NUMERIC_INPUT_PATTERN}
                    maxLength={NUMERIC_MAX_LENGTH}
                    min="0"
                    name="abs_without_pay_sl"
                    value={form.abs_without_pay_sl}
                    onChange={handleChange}
                    disabled={disableAbsWithoutPaySl}
                    className={`${inputClass} ${
                      disableAbsWithoutPaySl
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {hasFormData(form, defaultForm) && (
              <button
                type="button"
                onClick={createClearHandler(
                  handleClearAllFields,
                  hasFormData(form, defaultForm),
                )}
                className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60 disabled:no-underline"
                disabled={isSaving || isConfirmOpen}
              >
                Clear All
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              disabled={isSaving || isConfirmOpen}
            >
              <span className="inline-flex items-center gap-1.5">
                <X size={14} />
                Cancel
              </span>
            </button>

            <button
              type="submit"
              disabled={isSaving || isConfirmOpen}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1.5">
                <Check size={14} />
                {isSaving ? "Saving..." : "Save Leave"}
              </span>
            </button>
          </div>
        </form>

        <ConfirmationAddLeave
          isOpen={isConfirmOpen}
          employeeName={employeeName}
          values={pendingPayload}
          loading={isSaving}
          onConfirm={handleConfirmSave}
          onCancel={handleCancelConfirm}
        />
      </div>

      <AddLeaveSuccess
        isOpen={isSuccessOpen}
        values={successData}
        onClose={() => {
          setIsSuccessOpen(false);
          setSuccessData(null);
          setForm(defaultForm);
          onClose();
        }}
      />
    </div>
  );
}
