import React from "react";

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
}: SalaryInformationProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-lg font-bold text-gray-800">Salary Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Employment timeline and bonus information
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
      </div>
    </div>
  );
}
