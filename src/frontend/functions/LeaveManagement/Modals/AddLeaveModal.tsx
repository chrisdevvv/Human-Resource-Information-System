"use client";

import React, { useEffect, useState } from "react";
import ConfirmationAddLeave from "../ConfirmationAddLeave";
import AddLeaveSuccess from "../AddLeaveSuccess";

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
  isMonetization: boolean;
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
  isMonetization: false,
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

  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm);
      setIsConfirmOpen(false);
      setPendingPayload(null);
      setIsSuccessOpen(false);
      setSuccessData(null);
    }
  }, [isOpen]);

  if (!isOpen || !employeeId) {
    return null;
  }

  const resolvedEmployeeId = employeeId;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

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

  function handleMonetizationToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;

    setForm((prev) => ({
      ...prev,
      isMonetization: checked,
      particulars: checked ? "Monetization" : "",
      hasVacationLeave: checked ? false : prev.hasVacationLeave,
      hasSickLeave: checked ? false : prev.hasSickLeave,
    }));
  }

  function handleVacationLeaveToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;

    setForm((prev) => ({
      ...prev,
      hasVacationLeave: checked,
      hasSickLeave: checked ? false : prev.hasSickLeave,
      earned_sl: checked ? "" : prev.earned_sl,
      abs_with_pay_sl: checked ? "" : prev.abs_with_pay_sl,
      abs_without_pay_sl: checked ? "" : prev.abs_without_pay_sl,
    }));
  }

  function handleSickLeaveToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;

    setForm((prev) => ({
      ...prev,
      hasSickLeave: checked,
      hasVacationLeave: checked ? false : prev.hasVacationLeave,
      earned_vl: checked ? "" : prev.earned_vl,
      abs_with_pay_vl: checked ? "" : prev.abs_with_pay_vl,
      abs_without_pay_vl: checked ? "" : prev.abs_without_pay_vl,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.period_of_leave.trim()) {
      alert("Period of leave is required.");
      return;
    }

    if (!form.isMonetization && !form.particulars.trim()) {
      alert("Particulars is required unless Monetization is checked.");
      return;
    }

    const payload: AddLeaveFormValues = {
      employee_id: resolvedEmployeeId,
      period_of_leave: form.period_of_leave.trim(),
      particulars: form.isMonetization
        ? "Monetization"
        : form.particulars.trim(),
      isMonetization: form.isMonetization,
      earned_vl: Number(form.earned_vl || 0),
      abs_with_pay_vl: Number(form.abs_with_pay_vl || 0),
      abs_without_pay_vl: Number(form.abs_without_pay_vl || 0),
      earned_sl: Number(form.earned_sl || 0),
      abs_with_pay_sl: Number(form.abs_with_pay_sl || 0),
      abs_without_pay_sl: Number(form.abs_without_pay_sl || 0),
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

      // Close confirmation modal
      setIsConfirmOpen(false);

      // Show success message
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
      alert("Failed to save leave entry. Please try again.");
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

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";
  const disableVacationOption = form.isMonetization || form.hasSickLeave;
  const disableSickOption = form.isMonetization || form.hasVacationLeave;
  const hasEarnedVl = form.earned_vl !== "";
  const hasAbsWithPayVl = form.abs_with_pay_vl !== "";
  const hasAbsWithoutPayVl = form.abs_without_pay_vl !== "";
  const hasEarnedSl = form.earned_sl !== "";
  const hasAbsWithPaySl = form.abs_with_pay_sl !== "";
  const hasAbsWithoutPaySl = form.abs_without_pay_sl !== "";

  const disableEarnedVl = hasAbsWithPayVl || hasAbsWithoutPayVl;
  const disableAbsWithPayVl = hasEarnedVl || hasAbsWithoutPayVl;
  const disableAbsWithoutPayVl = hasEarnedVl || hasAbsWithPayVl;

  const disableEarnedSl = hasAbsWithPaySl || hasAbsWithoutPaySl;
  const disableAbsWithPaySl = hasEarnedSl || hasAbsWithoutPaySl;
  const disableAbsWithoutPaySl = hasEarnedSl || hasAbsWithPaySl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800">Add Leave Entry</h2>
        <p className="mt-1 text-sm text-gray-500">Employee: {employeeName}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isMonetization}
                  onChange={handleMonetizationToggle}
                  className="h-4 w-4"
                />
                Monetization
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>Particulars</label>
            <textarea
              name="particulars"
              value={form.particulars}
              onChange={handleChange}
              disabled={form.isMonetization}
              rows={3}
              placeholder="Enter particulars"
              className={`${inputClass} resize-none ${
                form.isMonetization
                  ? "cursor-not-allowed bg-gray-100 text-gray-500"
                  : ""
              }`}
            />
            {form.isMonetization && (
              <p className="mt-1 text-xs text-blue-600">
                Particulars is automatically set to Monetization.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Leave Type</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  disableVacationOption
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "cursor-pointer border-gray-300 bg-white text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.hasVacationLeave}
                  onChange={handleVacationLeaveToggle}
                  disabled={disableVacationOption}
                  className="h-4 w-4"
                />
                Vacation Leave
              </label>

              <label
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  disableSickOption
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "cursor-pointer border-gray-300 bg-white text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.hasSickLeave}
                  onChange={handleSickLeaveToggle}
                  disabled={disableSickOption}
                  className="h-4 w-4"
                />
                Sick Leave
              </label>
            </div>

            {form.isMonetization && (
              <p className="text-xs text-blue-600">
                Leave type options are disabled while Monetization is checked.
              </p>
            )}
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              disabled={isSaving || isConfirmOpen}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isConfirmOpen}
              className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Leave"}
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
