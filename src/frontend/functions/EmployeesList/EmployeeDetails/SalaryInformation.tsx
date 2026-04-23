import React from "react";
import { Check, Pencil, Plus, X } from "lucide-react";

export type SalaryHistoryRecord = {
  id: number;
  employee_id?: number;
  salary_date?: string | null;
  plantilla?: string | null;
  sg?: string | number | null;
  step?: string | number | null;
  salary?: string | number | null;
  increment_amount?: string | number | null;
  increment_mode?: "AUTO" | "MANUAL" | string | null;
  remarks?: string | null;
};

export type SalaryHistoryDraft = {
  date: string;
  plantilla: string;
  sg: string;
  step: string;
  salary: string;
  increment: string;
  remarks: string;
};

export type SalaryHistoryEditDraft = SalaryHistoryDraft & {
  id: number;
};

type InfoFieldProps = {
  label: string;
  value: string;
  isEditing?: boolean;
  children?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  errorMessage?: string | null;
};

type SalaryInformationProps = {
  InfoField: React.ComponentType<InfoFieldProps>;
  isEditing: boolean;
  canAddSalaryHistory: boolean;
  canEditSalaryHistory: boolean;
  salaryDateOfFirstAppointment: string | null | undefined;
  setEditDateOfFirstAppointment: (value: string) => void;
  salaryYearsInService: number | string | null | undefined;
  salaryLoyaltyBonus: string | number | boolean | null | undefined;
  formatDate: (value: string | null | undefined) => string;
  formatYearsInService: (value: number | string | null | undefined) => string;
  formatLoyaltyBonus: (
    value: string | number | boolean | null | undefined,
  ) => string;
  getValidationError: (field: string) => string | null;
  salaryHistoryRows: SalaryHistoryRecord[];
  salaryHistoryLoading: boolean;
  salaryHistoryError: string | null;
  salaryHistoryCreateDraft: SalaryHistoryDraft | null;
  salaryHistoryCreating: boolean;
  salaryHistoryCreateError: string | null;
  salaryHistoryEditDraft: SalaryHistoryEditDraft | null;
  salaryHistoryUpdating: boolean;
  salaryHistoryUpdateError: string | null;
  salaryHistoryRemarkOptions: string[];
  onStartAddSalaryHistory: () => void;
  onCancelAddSalaryHistory: () => void;
  onChangeSalaryHistoryDraft: (
    field: keyof SalaryHistoryDraft,
    value: string,
  ) => void;
  onSubmitSalaryHistory: () => void;
  onStartEditSalaryHistory: (row: SalaryHistoryRecord) => void;
  onCancelEditSalaryHistory: () => void;
  onChangeSalaryHistoryEditDraft: (
    field: keyof SalaryHistoryDraft,
    value: string,
  ) => void;
  onSubmitSalaryHistoryUpdate: () => void;
};

const formatCellValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text ? text : "-";
};

const formatDateCell = (value: string | null | undefined): string => {
  if (!value) return "-";

  const raw = String(value).trim();
  if (!raw) return "-";
  if (raw === "0000-00-00") return "-";

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatAmountCell = (
  value: string | number | null | undefined,
): string => {
  if (value === null || value === undefined || value === "") return "-";

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return formatCellValue(value);
  }

  return `PHP ${numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const baseInputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

const tableInputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

const actionPrimaryClass =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

const actionSecondaryClass =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60";

const actionAccentClass =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

export default function SalaryInformation({
  InfoField,
  isEditing,
  canAddSalaryHistory,
  canEditSalaryHistory,
  salaryDateOfFirstAppointment,
  setEditDateOfFirstAppointment,
  salaryYearsInService,
  salaryLoyaltyBonus,
  formatDate,
  formatYearsInService,
  formatLoyaltyBonus,
  getValidationError,
  salaryHistoryRows,
  salaryHistoryLoading,
  salaryHistoryError,
  salaryHistoryCreateDraft,
  salaryHistoryCreating,
  salaryHistoryCreateError,
  salaryHistoryEditDraft,
  salaryHistoryUpdating,
  salaryHistoryUpdateError,
  salaryHistoryRemarkOptions,
  onStartAddSalaryHistory,
  onCancelAddSalaryHistory,
  onChangeSalaryHistoryDraft,
  onSubmitSalaryHistory,
  onStartEditSalaryHistory,
  onCancelEditSalaryHistory,
  onChangeSalaryHistoryEditDraft,
  onSubmitSalaryHistoryUpdate,
}: SalaryInformationProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:mb-5">
        <h3 className="text-lg font-bold text-gray-800 sm:text-xl">
          Salary Information
        </h3>
        <p className="text-sm text-gray-500">
          Employment timeline, bonus, and salary history information
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <InfoField
            label="Date of First Appointment"
            value={formatDate(salaryDateOfFirstAppointment)}
            isEditing={isEditing}
            errorMessage={getValidationError("Date of First Appointment")}
          >
            <input
              type="date"
              value={salaryDateOfFirstAppointment || ""}
              onChange={(e) => setEditDateOfFirstAppointment(e.target.value)}
              className={baseInputClass}
            />
          </InfoField>

          <InfoField
            label="Years in Service"
            value={formatYearsInService(salaryYearsInService)}
          />

          <InfoField
            label="Loyalty Bonus"
            value={formatLoyaltyBonus(salaryLoyaltyBonus)}
          />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 sm:text-base">
                Salary History
              </h4>
              <p className="mt-0.5 text-xs text-gray-500">
                Track plantilla, grade, salary, increment, and remarks
              </p>
            </div>

            {canAddSalaryHistory && !salaryHistoryCreateDraft ? (
              <button
                type="button"
                onClick={onStartAddSalaryHistory}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <Plus size={14} />
                Add row
              </button>
            ) : null}
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-245 border-collapse text-sm">
                <thead className="bg-blue-100">
                  <tr className="border-b border-blue-200 text-xs uppercase tracking-wide text-blue-800">
                    <th className="px-3 py-3 text-left font-semibold">Date</th>
                    <th className="px-3 py-3 text-left font-semibold">
                      Plantilla
                    </th>
                    <th className="px-3 py-3 text-left font-semibold">SG</th>
                    <th className="px-3 py-3 text-left font-semibold">Step</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Salary
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Increment
                    </th>
                    <th className="px-3 py-3 text-left font-semibold">
                      Remarks
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {salaryHistoryLoading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        Loading salary information...
                      </td>
                    </tr>
                  ) : salaryHistoryError ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm font-medium text-red-600"
                      >
                        {salaryHistoryError}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {salaryHistoryRows.length === 0 &&
                      !salaryHistoryCreateDraft ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-10 text-center text-sm text-gray-500"
                          >
                            No salary information found.
                          </td>
                        </tr>
                      ) : null}

                      {salaryHistoryRows.map((row, index) => {
                        const rowBackgroundClass =
                          index % 2 === 1 ? "bg-blue-50/40" : "bg-white";
                        const isEditingRow =
                          salaryHistoryEditDraft?.id === row.id;

                        return (
                          <tr
                            key={row.id}
                            className={`border-b border-gray-100 align-top transition ${rowBackgroundClass}`}
                          >
                            <td className="px-3 py-3 font-medium text-gray-900">
                              {isEditingRow ? (
                                <input
                                  type="date"
                                  value={salaryHistoryEditDraft?.date || ""}
                                  onChange={(e) =>
                                    onChangeSalaryHistoryEditDraft(
                                      "date",
                                      e.target.value,
                                    )
                                  }
                                  disabled={salaryHistoryUpdating}
                                  className={tableInputClass}
                                />
                              ) : (
                                formatDateCell(row.salary_date)
                              )}
                            </td>

                            <td className="px-3 py-3 text-gray-700">
                              {isEditingRow ? (
                                <input
                                  type="text"
                                  value={
                                    salaryHistoryEditDraft?.plantilla || ""
                                  }
                                  onChange={(e) =>
                                    onChangeSalaryHistoryEditDraft(
                                      "plantilla",
                                      e.target.value,
                                    )
                                  }
                                  disabled={salaryHistoryUpdating}
                                  className={tableInputClass}
                                />
                              ) : (
                                formatCellValue(row.plantilla)
                              )}
                            </td>

                            <td className="px-3 py-3 text-gray-700">
                              {isEditingRow ? (
                                <input
                                  type="text"
                                  value={salaryHistoryEditDraft?.sg || ""}
                                  onChange={(e) =>
                                    onChangeSalaryHistoryEditDraft(
                                      "sg",
                                      e.target.value,
                                    )
                                  }
                                  disabled={salaryHistoryUpdating}
                                  className={tableInputClass}
                                />
                              ) : (
                                formatCellValue(row.sg)
                              )}
                            </td>

                            <td className="px-3 py-3 text-gray-700">
                              {isEditingRow ? (
                                <input
                                  type="text"
                                  value={salaryHistoryEditDraft?.step || ""}
                                  onChange={(e) =>
                                    onChangeSalaryHistoryEditDraft(
                                      "step",
                                      e.target.value,
                                    )
                                  }
                                  disabled={salaryHistoryUpdating}
                                  className={tableInputClass}
                                />
                              ) : (
                                formatCellValue(row.step)
                              )}
                            </td>

                            <td className="px-3 py-3 text-right font-medium text-gray-900">
                              {isEditingRow ? (
                                <input
                                  type="number"
                                  value={salaryHistoryEditDraft?.salary || ""}
                                  onChange={(e) =>
                                    onChangeSalaryHistoryEditDraft(
                                      "salary",
                                      e.target.value,
                                    )
                                  }
                                  disabled={salaryHistoryUpdating}
                                  min="0"
                                  step="0.01"
                                  className={`${tableInputClass} text-right`}
                                />
                              ) : (
                                formatAmountCell(row.salary)
                              )}
                            </td>

                            <td className="px-3 py-3 text-right font-medium text-gray-900">
                              {isEditingRow ? (
                                <input
                                  type="number"
                                  value={
                                    salaryHistoryEditDraft?.increment || ""
                                  }
                                  onChange={(e) =>
                                    onChangeSalaryHistoryEditDraft(
                                      "increment",
                                      e.target.value,
                                    )
                                  }
                                  disabled={salaryHistoryUpdating}
                                  min="0"
                                  step="0.01"
                                  placeholder="Auto"
                                  className={`${tableInputClass} text-right`}
                                />
                              ) : (
                                formatAmountCell(row.increment_amount)
                              )}
                            </td>

                            <td className="px-3 py-3 text-gray-700">
                              {isEditingRow ? (
                                <select
                                  value={salaryHistoryEditDraft?.remarks || ""}
                                  onChange={(e) =>
                                    onChangeSalaryHistoryEditDraft(
                                      "remarks",
                                      e.target.value,
                                    )
                                  }
                                  disabled={salaryHistoryUpdating}
                                  className={`${tableInputClass} cursor-pointer`}
                                >
                                  <option value="">Select remark</option>
                                  {salaryHistoryRemarkOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                formatCellValue(row.remarks)
                              )}
                            </td>

                            <td className="px-3 py-3">
                              {canEditSalaryHistory ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  {isEditingRow ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={onSubmitSalaryHistoryUpdate}
                                        disabled={salaryHistoryUpdating}
                                        className={actionPrimaryClass}
                                        title="Update salary row"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={onCancelEditSalaryHistory}
                                        disabled={salaryHistoryUpdating}
                                        className={actionSecondaryClass}
                                        title="Cancel"
                                      >
                                        <X size={14} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onStartEditSalaryHistory(row)
                                      }
                                      disabled={Boolean(salaryHistoryCreateDraft)}
                                      className={actionAccentClass}
                                      title="Edit salary row"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}

                      {salaryHistoryCreateDraft ? (
                        <tr className="border-b border-blue-100 bg-blue-50/70 align-top">
                          <td className="px-3 py-3">
                            <input
                              type="date"
                              value={salaryHistoryCreateDraft.date}
                              onChange={(e) =>
                                onChangeSalaryHistoryDraft("date", e.target.value)
                              }
                              disabled={salaryHistoryCreating}
                              className={tableInputClass}
                            />
                          </td>

                          <td className="px-3 py-3">
                            <input
                              type="text"
                              value={salaryHistoryCreateDraft.plantilla}
                              onChange={(e) =>
                                onChangeSalaryHistoryDraft(
                                  "plantilla",
                                  e.target.value,
                                )
                              }
                              disabled={salaryHistoryCreating}
                              placeholder="Plantilla"
                              className={tableInputClass}
                            />
                          </td>

                          <td className="px-3 py-3">
                            <input
                              type="text"
                              value={salaryHistoryCreateDraft.sg}
                              onChange={(e) =>
                                onChangeSalaryHistoryDraft("sg", e.target.value)
                              }
                              disabled={salaryHistoryCreating}
                              placeholder="SG"
                              className={tableInputClass}
                            />
                          </td>

                          <td className="px-3 py-3">
                            <input
                              type="text"
                              value={salaryHistoryCreateDraft.step}
                              onChange={(e) =>
                                onChangeSalaryHistoryDraft("step", e.target.value)
                              }
                              disabled={salaryHistoryCreating}
                              placeholder="Step"
                              className={tableInputClass}
                            />
                          </td>

                          <td className="px-3 py-3">
                            <input
                              type="number"
                              value={salaryHistoryCreateDraft.salary}
                              onChange={(e) =>
                                onChangeSalaryHistoryDraft(
                                  "salary",
                                  e.target.value,
                                )
                              }
                              disabled={salaryHistoryCreating}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className={`${tableInputClass} text-right`}
                            />
                          </td>

                          <td className="px-3 py-3">
                            <input
                              type="number"
                              value={salaryHistoryCreateDraft.increment}
                              onChange={(e) =>
                                onChangeSalaryHistoryDraft(
                                  "increment",
                                  e.target.value,
                                )
                              }
                              disabled={salaryHistoryCreating}
                              min="0"
                              step="0.01"
                              placeholder="Auto"
                              className={`${tableInputClass} text-right`}
                            />
                          </td>

                          <td className="px-3 py-3">
                            <select
                              value={salaryHistoryCreateDraft.remarks}
                              onChange={(e) =>
                                onChangeSalaryHistoryDraft(
                                  "remarks",
                                  e.target.value,
                                )
                              }
                              disabled={salaryHistoryCreating}
                              className={`${tableInputClass} cursor-pointer`}
                            >
                              <option value="">Select remark</option>
                              {salaryHistoryRemarkOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={onSubmitSalaryHistory}
                                disabled={salaryHistoryCreating}
                                className={actionPrimaryClass}
                                title="Save salary row"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={onCancelAddSalaryHistory}
                                disabled={salaryHistoryCreating}
                                className={actionSecondaryClass}
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {salaryHistoryCreateError ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {salaryHistoryCreateError}
            </p>
          ) : null}

          {salaryHistoryUpdateError ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {salaryHistoryUpdateError}
            </p>
          ) : null}

          {salaryHistoryCreateDraft ? (
            <p className="mt-3 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-gray-500">
              Increment is optional. Leave it blank for AUTO mode, or enter a
              value for MANUAL mode.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}