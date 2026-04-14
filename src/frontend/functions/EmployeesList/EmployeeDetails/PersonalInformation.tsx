import React from "react";

type CivilStatus = {
  id: number;
  civil_status_name: string;
};

type Sex = {
  id: number;
  sex_name: string;
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

type PersonalInformationProps = {
  InfoField: React.ComponentType<InfoFieldProps>;
  isEditing: boolean;
  fullName: string;
  employeeType: "teaching" | "non-teaching" | "teaching-related";
  resolvedEmployeeType?: "teaching" | "non-teaching" | "teaching-related" | null;
  editLastName: string;
  setEditLastName: (value: string) => void;
  editFirstName: string;
  setEditFirstName: (value: string) => void;
  editMiddleName: string;
  setEditMiddleName: (value: string) => void;
  editMiddleInitial: string;
  setEditMiddleInitial: (value: string) => void;
  normalizeMiddleInitialInput: (value: string) => string;
  editHomeAddress: string;
  setEditHomeAddress: (value: string) => void;
  editBirthdate: string;
  setEditBirthdate: (value: string) => void;
  ageValue: number | null;
  editPlaceOfBirth: string;
  setEditPlaceOfBirth: (value: string) => void;
  editCivilStatus: string;
  editCivilStatusId: number | null;
  setEditCivilStatus: (value: string) => void;
  setEditCivilStatusId: (value: number | null) => void;
  civilStatuses: CivilStatus[];
  editSex: string;
  editSexId: number | null;
  setEditSex: (value: string) => void;
  setEditSexId: (value: number | null) => void;
  sexes: Sex[];
  editPersonalEmail: string;
  setEditPersonalEmail: (value: string) => void;
  editWorkEmail: string;
  setEditWorkEmail: (value: string) => void;
  editMobileNumber: string;
  setEditMobileNumber: (value: string) => void;
  formatEmployeeType: (type: string) => string;
  formatValue: (value: string | number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  getValidationError: (field: string) => string | null;
};

export default function PersonalInformation({
  InfoField,
  isEditing,
  fullName,
  employeeType,
  resolvedEmployeeType,
  editLastName,
  setEditLastName,
  editFirstName,
  setEditFirstName,
  editMiddleName,
  setEditMiddleName,
  editMiddleInitial,
  setEditMiddleInitial,
  normalizeMiddleInitialInput,
  editHomeAddress,
  setEditHomeAddress,
  editBirthdate,
  setEditBirthdate,
  ageValue,
  editPlaceOfBirth,
  setEditPlaceOfBirth,
  editCivilStatus,
  editCivilStatusId,
  setEditCivilStatus,
  setEditCivilStatusId,
  civilStatuses,
  editSex,
  editSexId,
  setEditSex,
  setEditSexId,
  sexes,
  editPersonalEmail,
  setEditPersonalEmail,
  editWorkEmail,
  setEditWorkEmail,
  editMobileNumber,
  setEditMobileNumber,
  formatEmployeeType,
  formatValue,
  formatDate,
  getValidationError,
}: PersonalInformationProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          {fullName} • {formatEmployeeType(resolvedEmployeeType || employeeType)}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.35fr_1.35fr_0.5fr] sm:gap-4">
          <InfoField
            label="Last Name"
            value={formatValue(editLastName)}
            isEditing={isEditing}
            errorMessage={getValidationError("Last Name")}
          >
            <input
              type="text"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="First Name"
            value={formatValue(editFirstName)}
            isEditing={isEditing}
            errorMessage={getValidationError("First Name")}
          >
            <input
              type="text"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="Middle Name"
            value={formatValue(editMiddleName)}
            isEditing={isEditing}
            errorMessage={getValidationError("Middle Name")}
          >
            <input
              type="text"
              value={editMiddleName}
              onChange={(e) => setEditMiddleName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="M.I."
            value={formatValue(editMiddleInitial)}
            isEditing={isEditing}
            className="lg:w-24"
            errorMessage={getValidationError("M.I.")}
          >
            <input
              type="text"
              value={editMiddleInitial}
              onChange={(e) =>
                setEditMiddleInitial(normalizeMiddleInitialInput(e.target.value))
              }
              maxLength={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2.1fr_1fr_0.45fr] sm:gap-4">
          <InfoField
            label="Home Address"
            value={formatValue(editHomeAddress)}
            isEditing={isEditing}
            fullWidth
            className="lg:col-span-1"
            errorMessage={getValidationError("Home Address")}
          >
            <input
              type="text"
              value={editHomeAddress}
              onChange={(e) => setEditHomeAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="Date of Birth"
            value={formatDate(editBirthdate)}
            isEditing={isEditing}
            errorMessage={getValidationError("Date of Birth")}
          >
            <input
              type="date"
              value={editBirthdate}
              onChange={(e) => setEditBirthdate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="Age"
            value={ageValue ? String(ageValue) : "N/A"}
            className="lg:w-24 lg:justify-self-end"
            errorMessage={getValidationError("Age")}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.25fr_1.25fr_0.5fr] sm:gap-4">
          <InfoField
            label="Place of Birth"
            value={formatValue(editPlaceOfBirth)}
            isEditing={isEditing}
            errorMessage={getValidationError("Place of Birth")}
          >
            <input
              type="text"
              value={editPlaceOfBirth}
              onChange={(e) => setEditPlaceOfBirth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="Civil Status"
            value={formatValue(editCivilStatus)}
            isEditing={isEditing}
            errorMessage={getValidationError("Civil Status")}
          >
            <div className="relative">
              <select
                value={editCivilStatusId ? String(editCivilStatusId) : ""}
                onChange={(e) => {
                  const nextValue = e.target.value ? Number(e.target.value) : null;
                  const selected = civilStatuses.find((item) => item.id === nextValue);
                  setEditCivilStatusId(selected?.id ?? null);
                  setEditCivilStatus(selected?.civil_status_name || "");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="">Select civil status</option>
                {civilStatuses
                  .slice()
                  .sort((a, b) =>
                    a.civil_status_name.localeCompare(b.civil_status_name),
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.civil_status_name}
                    </option>
                  ))}
              </select>
            </div>
          </InfoField>

          <InfoField
            label="Sex"
            value={formatValue(editSex)}
            isEditing={isEditing}
            errorMessage={getValidationError("Sex")}
          >
            <div className="relative">
              <select
                value={editSexId ? String(editSexId) : ""}
                onChange={(e) => {
                  const nextValue = e.target.value ? Number(e.target.value) : null;
                  const selected = sexes.find((item) => item.id === nextValue);
                  setEditSexId(selected?.id ?? null);
                  setEditSex(selected?.sex_name || "");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="">Select sex</option>
                {sexes
                  .slice()
                  .sort((a, b) => a.sex_name.localeCompare(b.sex_name))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sex_name}
                    </option>
                  ))}
              </select>
            </div>
          </InfoField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.25fr_0.9fr] sm:gap-4">
          <InfoField
            label="Personal Email"
            value={formatValue(editPersonalEmail)}
            isEditing={isEditing}
            errorMessage={getValidationError("Personal Email")}
          >
            <input
              type="email"
              value={editPersonalEmail}
              onChange={(e) => setEditPersonalEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="DepEd Email"
            value={formatValue(editWorkEmail)}
            isEditing={isEditing}
            style={{ maxWidth: "30ch" }}
            errorMessage={getValidationError("DepEd Email")}
          >
            <input
              type="email"
              value={editWorkEmail}
              onChange={(e) => setEditWorkEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="Mobile Number"
            value={formatValue(editMobileNumber)}
            isEditing={isEditing}
            style={{ maxWidth: "22ch" }}
            errorMessage={getValidationError("Mobile Number")}
          >
            <input
              type="text"
              value={editMobileNumber}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 11);
                setEditMobileNumber(digitsOnly);
              }}
              maxLength={11}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>
        </div>
      </div>
    </div>
  );
}
