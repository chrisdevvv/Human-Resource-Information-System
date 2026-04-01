"use client";

import React, { useEffect, useState } from "react";
import ConfirmationAddLeave from "../ConfirmationAddLeave";
import AddLeaveSuccess from "../AddLeaveSuccess";
import { getLeaveHistoryByEmployee, getLeaveParticulars } from "../leaveApi";

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
      setCurrentBalVl(null);
      setCurrentBalSl(null);
      setIsConfirmOpen(false);
      setPendingPayload(null);
      setIsSuccessOpen(false);
      setSuccessData(null);
      setFormError("");
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
        // Keep form usable even if balance fetch fails.
        setCurrentBalVl(null);
        setCurrentBalSl(null);
      }
    };

    loadCurrentBalance();
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
      hasSickLeave: checked ? false : prev.hasSickLeave,
      earned_sl: checked ? "" : prev.earned_sl,
      abs_with_pay_sl: checked ? "" : prev.abs_with_pay_sl,
      abs_without_pay_sl: checked ? "" : prev.abs_without_pay_sl,
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
      hasVacationLeave: checked ? false : prev.hasVacationLeave,
      earned_vl: checked ? "" : prev.earned_vl,
      abs_with_pay_vl: checked ? "" : prev.abs_with_pay_vl,
      abs_without_pay_vl: checked ? "" : prev.abs_without_pay_vl,
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

    const payload: AddLeaveFormValues = {
      employee_id: resolvedEmployeeId,
      period_of_leave: form.period_of_leave.trim(),
      particulars: form.particulars.trim(),
      isMonetization: false,
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
      setFormError("");

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

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";
  const disableVacationOption = form.hasSickLeave;
  const disableSickOption = form.hasVacationLeave;
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
  const disableAbsWithPayVlByBalance =
    currentBalVl !== null && Number(currentBalVl) <= 0;
  const disableAbsWithPayVl =
    hasEarnedVl || hasAbsWithoutPayVl || disableAbsWithPayVlByBalance;
  const disableAbsWithoutPayVl = hasEarnedVl || hasAbsWithPayVl;

  const disableEarnedSl = hasAbsWithPaySl || hasAbsWithoutPaySl;
  const disableAbsWithPaySlByBalance =
    currentBalSl !== null && Number(currentBalSl) <= 0;
  const disableAbsWithPaySl =
    hasEarnedSl || hasAbsWithoutPaySl || disableAbsWithPaySlByBalance;
  const disableAbsWithoutPaySl = hasEarnedSl || hasAbsWithPaySl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800">Add Leave Entry</h2>
        <p className="mt-1 text-sm text-gray-500">Employee: {employeeName}</p>

        {formError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                placeholder={
                  particularsLoading
                    ? "Loading particulars..."
                    : "Type to search particulars..."
                }
                className={`${inputClass} ${
                  particularsLoading ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
              {showParticularDropdown && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg max-h-64 overflow-y-auto">
                  {particularsLoading ? (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
                      Loading particulars...
                    </div>
                  ) : particularOptions.length === 0 ? (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
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
                        className={`w-full px-4 py-2 text-left text-sm transition hover:bg-blue-50 ${
                          form.particulars === option
                            ? "bg-blue-100 font-medium text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
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
                  {disableAbsWithPayVlByBalance && (
                    <p className="mt-1 text-xs text-blue-600">
                      Disabled because current VL balance is 0.
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
                  {disableAbsWithPaySlByBalance && (
                    <p className="mt-1 text-xs text-blue-600">
                      Disabled because current SL balance is 0.
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
