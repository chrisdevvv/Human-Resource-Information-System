import React from "react";

export type SalaryHistoryRecord = {
  id: number;
  employee_id?: number;
  salary_date?: string | null;
  plantilla?: string | null;
  sg?: string | number | null;
  step?: string | number | null;
  salary?: string | number | null;
  increment_amount?: string | number | null;
  remarks?: string | null;
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

export default function SalaryInformation({
  InfoField,
  isEditing,
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
}: SalaryInformationProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-lg font-bold text-gray-800">Salary Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Employment timeline, bonus, and salary history information
        </p>
      </div>

      <div className="space-y-4">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
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

        <div>
          <h4 className="text-sm font-semibold text-gray-700">
            Salary History
          </h4>
          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-full border-collapse text-sm">
              <thead className="bg-blue-100">
                <tr className="border-b border-gray-200 whitespace-nowrap text-xs uppercase tracking-wide text-gray-600">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Plantilla</th>
                  <th className="px-3 py-2 text-left">SG</th>
                  <th className="px-3 py-2 text-left">Step</th>
                  <th className="px-3 py-2 text-right">Salary</th>
                  <th className="px-3 py-2 text-right">Increment</th>
                  <th className="px-3 py-2 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {salaryHistoryLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      Loading salary information...
                    </td>
                  </tr>
                ) : salaryHistoryError ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-8 text-center text-red-600"
                    >
                      {salaryHistoryError}
                    </td>
                  </tr>
                ) : salaryHistoryRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      No salary information found.
                    </td>
                  </tr>
                ) : (
                  salaryHistoryRows.map((row, index) => {
                    const rowBackgroundClass =
                      index % 2 === 1 ? "bg-sky-100" : "bg-white";

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-gray-100 ${rowBackgroundClass}`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {formatDateCell(row.salary_date)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatCellValue(row.plantilla)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatCellValue(row.sg)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatCellValue(row.step)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          {formatAmountCell(row.salary)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          {formatAmountCell(row.increment_amount)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatCellValue(row.remarks)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
