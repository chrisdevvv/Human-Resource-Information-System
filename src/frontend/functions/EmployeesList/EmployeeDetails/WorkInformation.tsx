import React from "react";

type School = {
  id: number;
  school_name: string;
};

type Position = {
  id: number;
  position_name: string;
};

type District = {
  id: number;
  district_name: string;
};

type IdMaskConfig = {
  maxDigits: number;
  groups: number[];
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

type WorkInformationProps = {
  InfoField: React.ComponentType<InfoFieldProps>;
  isEditing: boolean;
  resolvedSchoolName?: string | null;
  employeeSchoolName: string;
  workDateOfFirstAppointment: string | null | undefined;
  setEditDateOfFirstAppointment: (value: string) => void;
  workSg: string | number | null | undefined;
  setEditWorkSg: (value: string) => void;
  editEmployeeType: "teaching" | "non-teaching" | "teaching-related";
  setEditEmployeeType: (
    value: "teaching" | "non-teaching" | "teaching-related",
  ) => void;
  editPosition: string;
  setEditPosition: (value: string) => void;
  editPositionId: number | null;
  setEditPositionId: (value: number | null) => void;
  editPlantillaNo: string;
  setEditPlantillaNo: (value: string) => void;
  editCurrentEmployeeType: string;
  setEditCurrentEmployeeType: (value: string) => void;
  editCurrentPosition: string;
  setEditCurrentPosition: (value: string) => void;
  currentPositionSearch: string;
  setCurrentPositionSearch: (value: string) => void;
  showCurrentPositionDropdown: boolean;
  setShowCurrentPositionDropdown: (value: boolean) => void;
  editCurrentPlantillaNo: string;
  setEditCurrentPlantillaNo: (value: string) => void;
  editCurrentAppointmentDate: string;
  setEditCurrentAppointmentDate: (value: string) => void;
  editCurrentSg: string;
  setEditCurrentSg: (value: string) => void;
  positionSearch: string;
  setPositionSearch: (value: string) => void;
  showPositionDropdown: boolean;
  setShowPositionDropdown: (value: boolean) => void;
  positions: Position[];
  editDistrict: string;
  setEditDistrict: (value: string) => void;
  districtSearch: string;
  setDistrictSearch: (value: string) => void;
  showDistrictDropdown: boolean;
  setShowDistrictDropdown: (value: boolean) => void;
  districts: District[];
  editSchoolName: string;
  setEditSchoolName: (value: string) => void;
  editSchoolId: number | null;
  setEditSchoolId: (value: number | null) => void;
  schoolSearch: string;
  setSchoolSearch: (value: string) => void;
  showSchoolDropdown: boolean;
  setShowSchoolDropdown: (value: boolean) => void;
  schools: School[];
  editEmployeeNo: string;
  setEditEmployeeNo: (value: string) => void;
  editLicenseNoPrc: string;
  setEditLicenseNoPrc: (value: string) => void;
  editTin: string;
  setEditTin: (value: string) => void;
  editGsisBpNo: string;
  setEditGsisBpNo: (value: string) => void;
  editGsisCrnNo: string;
  setEditGsisCrnNo: (value: string) => void;
  editPagibigNo: string;
  setEditPagibigNo: (value: string) => void;
  editPhilhealthNo: string;
  setEditPhilhealthNo: (value: string) => void;
  formatEmployeeType: (type: string) => string;
  formatValue: (value: string | number | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
  getValidationError: (field: string) => string | null;
  formatMaskedId: (value: string, config: IdMaskConfig) => string;
  formatGsisBp: (value: string) => string;
  normalize12Digits: (value: string) => string;
  normalizePhilhealth: (value: string) => string;
  GOV_ID_MASKS: {
    tin: IdMaskConfig;
  };
};

export default function WorkInformation({
  InfoField,
  isEditing,
  resolvedSchoolName,
  employeeSchoolName,
  workDateOfFirstAppointment,
  setEditDateOfFirstAppointment,
  workSg,
  setEditWorkSg,
  editEmployeeType,
  setEditEmployeeType,
  editPosition,
  setEditPosition,
  setEditPositionId,
  editPlantillaNo,
  setEditPlantillaNo,
  editCurrentEmployeeType,
  setEditCurrentEmployeeType,
  editCurrentPosition,
  setEditCurrentPosition,
  currentPositionSearch,
  setCurrentPositionSearch,
  showCurrentPositionDropdown,
  setShowCurrentPositionDropdown,
  editCurrentPlantillaNo,
  setEditCurrentPlantillaNo,
  editCurrentAppointmentDate,
  setEditCurrentAppointmentDate,
  editCurrentSg,
  setEditCurrentSg,
  positionSearch,
  setPositionSearch,
  showPositionDropdown,
  setShowPositionDropdown,
  positions,
  editDistrict,
  setEditDistrict,
  districtSearch,
  setDistrictSearch,
  showDistrictDropdown,
  setShowDistrictDropdown,
  districts,
  editSchoolName,
  setEditSchoolName,
  setEditSchoolId,
  schoolSearch,
  setSchoolSearch,
  showSchoolDropdown,
  setShowSchoolDropdown,
  schools,
  editEmployeeNo,
  setEditEmployeeNo,
  editLicenseNoPrc,
  setEditLicenseNoPrc,
  editTin,
  setEditTin,
  editGsisBpNo,
  setEditGsisBpNo,
  editGsisCrnNo,
  setEditGsisCrnNo,
  editPagibigNo,
  setEditPagibigNo,
  editPhilhealthNo,
  setEditPhilhealthNo,
  formatEmployeeType,
  formatValue,
  formatDate,
  getValidationError,
  formatMaskedId,
  formatGsisBp,
  normalize12Digits,
  normalizePhilhealth,
  GOV_ID_MASKS,
}: WorkInformationProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-lg font-bold text-gray-800">Work Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          {formatValue(resolvedSchoolName || employeeSchoolName)}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 sm:gap-4">
          <InfoField
            label="Employee Type"
            value={formatEmployeeType(editEmployeeType)}
            isEditing={isEditing}
            className="lg:col-span-2"
            errorMessage={getValidationError("Employee Type")}
          >
            <select
              value={editEmployeeType}
              onChange={(e) =>
                setEditEmployeeType(
                  e.target.value as
                    | "teaching"
                    | "non-teaching"
                    | "teaching-related",
                )
              }
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="teaching">Teaching</option>
              <option value="non-teaching">Non-Teaching</option>
              <option value="teaching-related">Teaching-Related</option>
            </select>
          </InfoField>

          <InfoField
            label="Position"
            value={formatValue(editPosition)}
            isEditing={isEditing}
            className="lg:col-span-3"
            errorMessage={getValidationError("Position")}
          >
            <div className="relative">
              <input
                type="text"
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
                onFocus={() => setShowPositionDropdown(true)}
                onBlur={() => setShowPositionDropdown(false)}
                placeholder="Position"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-xs outline-none focus:border-blue-500"
              />
              {showPositionDropdown && (
                <div className="no-scrollbar absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-sm">
                  {positions
                    .filter((p) =>
                      p.position_name
                        .toLowerCase()
                        .includes(positionSearch.toLowerCase()),
                    )
                    .map((position) => (
                      <button
                        key={position.id}
                        type="button"
                        onMouseDown={() => {
                          setEditPositionId(position.id);
                          setEditPosition(position.position_name);
                          setPositionSearch(position.position_name);
                          setShowPositionDropdown(false);
                        }}
                        className="block w-full cursor-pointer border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 first:border-t-0"
                      >
                        {position.position_name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </InfoField>

          <InfoField
            label="Plantilla Number"
            value={formatValue(editPlantillaNo)}
            isEditing={isEditing}
            className="lg:col-span-3"
            errorMessage={getValidationError("Plantilla Number")}
          >
            <input
              type="text"
              value={editPlantillaNo}
              onChange={(e) => setEditPlantillaNo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="First Appointment Date"
            value={formatDate(workDateOfFirstAppointment)}
            isEditing={isEditing}
            className="lg:col-span-3"
            errorMessage={getValidationError("Date of First Appointment")}
          >
            <input
              type="date"
              value={workDateOfFirstAppointment || ""}
              onChange={(e) => setEditDateOfFirstAppointment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="SG"
            value={formatValue(workSg)}
            isEditing={isEditing}
            className="lg:col-span-1"
            errorMessage={getValidationError("SG")}
          >
            <input
              type="text"
              value={String(workSg ?? "")}
              onChange={(e) => setEditWorkSg(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 sm:gap-4">
          <InfoField
            label="Current Employee Type"
            value={formatValue(editCurrentEmployeeType)}
            isEditing={isEditing}
            className="lg:col-span-2"
            errorMessage={getValidationError("Current Employee Type")}
          >
            <select
              value={editCurrentEmployeeType}
              onChange={(e) => setEditCurrentEmployeeType(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="">N/A</option>
              <option value="teaching">Teaching</option>
              <option value="non-teaching">Non-Teaching</option>
              <option value="teaching-related">Teaching-Related</option>
            </select>
          </InfoField>

          <InfoField
            label="Current Position"
            value={formatValue(editCurrentPosition)}
            isEditing={isEditing}
            className="lg:col-span-3"
            errorMessage={getValidationError("Current Position")}
          >
            <div className="relative">
              <input
                type="text"
                value={currentPositionSearch}
                onChange={(e) => setCurrentPositionSearch(e.target.value)}
                onFocus={() => setShowCurrentPositionDropdown(true)}
                onBlur={() => setShowCurrentPositionDropdown(false)}
                placeholder="Current Position"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-xs outline-none focus:border-blue-500"
              />
              {showCurrentPositionDropdown && (
                <div className="no-scrollbar absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-sm">
                  {positions
                    .filter((p) =>
                      p.position_name
                        .toLowerCase()
                        .includes(currentPositionSearch.toLowerCase()),
                    )
                    .map((position) => (
                      <button
                        key={position.id}
                        type="button"
                        onMouseDown={() => {
                          setEditCurrentPosition(position.position_name);
                          setCurrentPositionSearch(position.position_name);
                          setShowCurrentPositionDropdown(false);
                        }}
                        className="block w-full cursor-pointer border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 first:border-t-0"
                      >
                        {position.position_name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </InfoField>

          <InfoField
            label="Current Plantilla Number"
            value={formatValue(editCurrentPlantillaNo)}
            isEditing={isEditing}
            className="lg:col-span-3"
            errorMessage={getValidationError("Current Plantilla Number")}
          >
            <input
              type="text"
              value={editCurrentPlantillaNo}
              onChange={(e) => setEditCurrentPlantillaNo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="Current Appointment Date"
            value={formatDate(editCurrentAppointmentDate)}
            isEditing={isEditing}
            className="lg:col-span-3"
            errorMessage={getValidationError("Current Appointment Date")}
          >
            <input
              type="date"
              value={editCurrentAppointmentDate || ""}
              onChange={(e) => setEditCurrentAppointmentDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="Current SG"
            value={formatValue(editCurrentSg)}
            isEditing={isEditing}
            className="lg:col-span-1"
            errorMessage={getValidationError("Current SG")}
          >
            <input
              type="text"
              value={editCurrentSg}
              onChange={(e) => setEditCurrentSg(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <InfoField
            label="District"
            value={formatValue(editDistrict)}
            isEditing={isEditing}
            errorMessage={getValidationError("District")}
          >
            <div className="relative">
              <input
                type="text"
                value={districtSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setDistrictSearch(value);
                  setEditDistrict(value);
                }}
                onFocus={() => setShowDistrictDropdown(true)}
                onBlur={() => setShowDistrictDropdown(false)}
                placeholder="District"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-xs outline-none focus:border-blue-500"
              />
              {showDistrictDropdown && (
                <div className="no-scrollbar absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-sm">
                  {districts
                    .filter((d) =>
                      d.district_name
                        .toLowerCase()
                        .includes(districtSearch.toLowerCase()),
                    )
                    .map((district) => (
                      <button
                        key={district.id}
                        type="button"
                        onMouseDown={() => {
                          setEditDistrict(district.district_name);
                          setDistrictSearch(district.district_name);
                          setShowDistrictDropdown(false);
                        }}
                        className="block w-full cursor-pointer border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 first:border-t-0"
                      >
                        {district.district_name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </InfoField>

          <InfoField
            label="School Name"
            value={formatValue(editSchoolName)}
            isEditing={isEditing}
            errorMessage={getValidationError("School")}
          >
            <div className="relative">
              <input
                type="text"
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                onFocus={() => setShowSchoolDropdown(true)}
                onBlur={() => setShowSchoolDropdown(false)}
                placeholder="School"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-xs outline-none focus:border-blue-500"
              />
              {showSchoolDropdown && (
                <div className="no-scrollbar absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-sm">
                  {schools
                    .filter((s) =>
                      s.school_name
                        .toLowerCase()
                        .includes(schoolSearch.toLowerCase()),
                    )
                    .map((school) => (
                      <button
                        key={school.id}
                        type="button"
                        onMouseDown={() => {
                          setEditSchoolId(school.id);
                          setEditSchoolName(school.school_name);
                          setSchoolSearch(school.school_name);
                          setShowSchoolDropdown(false);
                        }}
                        className="block w-full cursor-pointer border-t border-gray-100 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 first:border-t-0"
                      >
                        {school.school_name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </InfoField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoField
            label="Employee Number"
            value={formatValue(editEmployeeNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("Employee Number")}
          >
            <input
              type="text"
              value={editEmployeeNo}
              onChange={(e) => {
                const digitsOnly = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 7);
                setEditEmployeeNo(digitsOnly);
              }}
              maxLength={7}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>

          <InfoField
            label="License No PRC"
            value={formatValue(editLicenseNoPrc)}
            isEditing={isEditing}
          >
            <input
              type="text"
              value={editLicenseNoPrc}
              onChange={(e) => setEditLicenseNoPrc(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
            />
          </InfoField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <InfoField
            label="TIN"
            value={formatValue(editTin)}
            isEditing={isEditing}
            errorMessage={getValidationError("TIN")}
          >
            <input
              type="text"
              value={editTin}
              onChange={(e) =>
                setEditTin(formatMaskedId(e.target.value, GOV_ID_MASKS.tin))
              }
              inputMode="numeric"
              maxLength={11}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              placeholder="000-000-000"
            />
          </InfoField>

          <InfoField
            label="GSIS BP Number"
            value={formatValue(editGsisBpNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("GSIS BP Number")}
          >
            <input
              type="text"
              value={editGsisBpNo}
              onChange={(e) => setEditGsisBpNo(formatGsisBp(e.target.value))}
              inputMode="text"
              maxLength={12}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              placeholder="00000-000000"
            />
          </InfoField>

          <InfoField
            label="GSIS CRN Number"
            value={formatValue(editGsisCrnNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("GSIS CRN Number")}
          >
            <input
              type="text"
              value={editGsisCrnNo}
              onChange={(e) =>
                setEditGsisCrnNo(normalize12Digits(e.target.value))
              }
              inputMode="numeric"
              maxLength={12}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              placeholder="000000000000"
            />
          </InfoField>

          <InfoField
            label="PAG-IBIG Number"
            value={formatValue(editPagibigNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("PAG-IBIG Number")}
          >
            <input
              type="text"
              value={editPagibigNo}
              onChange={(e) =>
                setEditPagibigNo(normalize12Digits(e.target.value))
              }
              inputMode="numeric"
              maxLength={12}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              placeholder="000000000000"
            />
          </InfoField>

          <InfoField
            label="PhilHealth Number"
            value={formatValue(editPhilhealthNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("PhilHealth Number")}
          >
            <input
              type="text"
              value={editPhilhealthNo}
              onChange={(e) =>
                setEditPhilhealthNo(normalizePhilhealth(e.target.value))
              }
              inputMode="numeric"
              maxLength={12}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              placeholder="000000000000"
            />
          </InfoField>
        </div>
      </div>
    </div>
  );
}
