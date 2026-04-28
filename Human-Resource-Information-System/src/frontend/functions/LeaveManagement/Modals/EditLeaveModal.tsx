"use client";

import React, { useEffect, useState } from "react";
import type { LeaveHistoryRecord, UpdateLeavePayload } from "../leaveApi";
import { createClearHandler } from "../../../utils/clearFormUtils";

type EditLeaveModalProps = {
  isOpen: boolean;
  leave: LeaveHistoryRecord | null;
  onClose: () => void;
  onSave: (
    leaveId: number,
    payload: UpdateLeavePayload,
  ) => Promise<void> | void;
  isSaving?: boolean;
};

export type EditLeaveFormValues = {
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

export default function EditLeaveModal({
  isOpen,
  leave,
  onClose,
  onSave,
  isSaving = false,
}: EditLeaveModalProps) {
  const [form, setForm] = useState<EditLeaveFormValues | null>(null);
  const [initialForm, setInitialForm] = useState<EditLeaveFormValues | null>(
    null,
  );

  const formatNumber = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return safeValue.toLocaleString("en-US", {
      useGrouping: false,
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

  useEffect(() => {
    if (!leave) {
      setForm(null);
      setInitialForm(null);
      return;
    }

    const isMonetization =
      (leave.particulars || "").trim().toLowerCase() === "monetization";

    const formData = {
      period_of_leave: leave.periodOfLeave || "",
      particulars: isMonetization ? "Monetization" : leave.particulars || "",
      isMonetization,
      earned_vl: Number(leave.earnedVl),
      abs_with_pay_vl: Number(leave.absWithPayVl),
      abs_without_pay_vl: Number(leave.absWithoutPayVl),
      earned_sl: Number(leave.earnedSl),
      abs_with_pay_sl: Number(leave.absWithPaySl),
      abs_without_pay_sl: Number(leave.absWithoutPaySl),
    };

    setForm(formData);
    setInitialForm(formData);
  }, [leave]);

  if (!isOpen || !leave || !form) {
    return null;
  }

  const currentLeave = leave;

  const employeeTypeLabel =
    currentLeave.employeeType === "non-teaching" ? "Non-Teaching" : "Teaching";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;

    setForm((prev) => {
      if (!prev) return prev;

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

    setForm((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        isMonetization: checked,
        particulars: checked ? "Monetization" : "",
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    if (!form.period_of_leave.trim()) {
      alert("Period of leave is required.");
      return;
    }

    if (!form.isMonetization && !form.particulars.trim()) {
      alert("Particulars is required unless Monetization is checked.");
      return;
    }

    void onSave(currentLeave.id, {
      period_of_leave: form.period_of_leave.trim(),
      particulars: form.isMonetization
        ? "Monetization"
        : form.particulars.trim(),
      earned_vl: Number(form.earned_vl || 0),
      abs_with_pay_vl: Number(form.abs_with_pay_vl || 0),
      abs_without_pay_vl: Number(form.abs_without_pay_vl || 0),
      earned_sl: Number(form.earned_sl || 0),
      abs_with_pay_sl: Number(form.abs_with_pay_sl || 0),
      abs_without_pay_sl: Number(form.abs_without_pay_sl || 0),
    });
  }

  function handleClearAllFields() {
    if (initialForm) {
      setForm(initialForm);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const readOnlyClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-blue-200 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800">Edit Leave</h2>
        <p className="mt-1 text-sm text-gray-500">
          Employee: {currentLeave.fullName || "Employee"}
        </p>
        <p className="text-sm text-gray-500">
          Employee Type: {employeeTypeLabel}
        </p>

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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Bal VL (Backend value)</label>
              <div className={readOnlyClass}>{formatNumber(leave.balVl)}</div>
            </div>
            <div>
              <label className={labelClass}>Bal SL (Backend value)</label>
              <div className={readOnlyClass}>{formatNumber(leave.balSl)}</div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                Date and Action Taken / Evaluation (Backend value)
              </label>
              <div className={readOnlyClass}>{leave.dateOfAction || "-"}</div>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Balances and date/action are read-only here. Backend recomputes
              balances and sets the latest date of action on update.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {form !== null &&
              initialForm !== null &&
              JSON.stringify(form) !== JSON.stringify(initialForm) && (
                <button
                  type="button"
                  onClick={createClearHandler(
                    handleClearAllFields,
                    form !== null && initialForm !== null
                      ? JSON.stringify(form) !== JSON.stringify(initialForm)
                      : false,
                  )}
                  disabled={isSaving}
                  className="mr-auto cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Clear All
                </button>
              )}

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="cursor-pointer rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
