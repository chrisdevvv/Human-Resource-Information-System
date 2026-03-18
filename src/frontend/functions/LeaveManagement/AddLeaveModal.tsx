"use client";

import React, { useEffect, useState } from "react";
import ConfirmationAddLeave from "./ConfirmationAddLeave";

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

const defaultForm = {
  period_of_leave: "",
  particulars: "",
  isMonetization: false,
  earned_vl: 0,
  abs_with_pay_vl: 0,
  abs_without_pay_vl: 0,
  earned_sl: 0,
  abs_with_pay_sl: 0,
  abs_without_pay_sl: 0,
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

  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm);
      setIsConfirmOpen(false);
      setPendingPayload(null);
    }
  }, [isOpen]);

  if (!isOpen || !employeeId) {
    return null;
  }

  const resolvedEmployeeId = employeeId;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;

    setForm((prev) => {
      if (type === "number") {
        return {
          ...prev,
          [name]: value === "" ? 0 : Number(value),
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

    await onSave(pendingPayload);
    setIsConfirmOpen(false);
    setPendingPayload(null);
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

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Vacation Leave (VL)
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={labelClass}>Earned VL</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="earned_vl"
                  value={form.earned_vl}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Abs With Pay VL</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="abs_with_pay_vl"
                  value={form.abs_with_pay_vl}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Abs Without Pay VL</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="abs_without_pay_vl"
                  value={form.abs_without_pay_vl}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Sick Leave (SL)
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={labelClass}>Earned SL</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="earned_sl"
                  value={form.earned_sl}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Abs With Pay SL</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="abs_with_pay_sl"
                  value={form.abs_with_pay_sl}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Abs Without Pay SL</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="abs_without_pay_sl"
                  value={form.abs_without_pay_sl}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

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
    </div>
  );
}
