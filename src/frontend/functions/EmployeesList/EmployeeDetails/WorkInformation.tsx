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
  tinNotAvailable: boolean;
  setTinNotAvailable: (value: boolean) => void;
  editGsisBpNo: string;
  setEditGsisBpNo: (value: string) => void;
  gsisBpNotAvailable: boolean;
  setGsisBpNotAvailable: (value: boolean) => void;
  editGsisCrnNo: string;
  setEditGsisCrnNo: (value: string) => void;
  gsisCrnNotAvailable: boolean;
  setGsisCrnNotAvailable: (value: boolean) => void;
  editPagibigNo: string;
  setEditPagibigNo: (value: string) => void;
  pagibigNotAvailable: boolean;
  setPagibigNotAvailable: (value: boolean) => void;
  editPhilhealthNo: string;
  setEditPhilhealthNo: (value: string) => void;
  philhealthNotAvailable: boolean;
  setPhilhealthNotAvailable: (value: boolean) => void;
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
  editEmployeeType,
  setEditEmployeeType,
  editPosition,
  setEditPosition,
  setEditPositionId,
  editPlantillaNo,
  setEditPlantillaNo,
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
  tinNotAvailable,
  setTinNotAvailable,
  editGsisBpNo,
  setEditGsisBpNo,
  gsisBpNotAvailable,
  setGsisBpNotAvailable,
  editGsisCrnNo,
  setEditGsisCrnNo,
  gsisCrnNotAvailable,
  setGsisCrnNotAvailable,
  editPagibigNo,
  setEditPagibigNo,
  pagibigNotAvailable,
  setPagibigNotAvailable,
  editPhilhealthNo,
  setEditPhilhealthNo,
  philhealthNotAvailable,
  setPhilhealthNotAvailable,
  formatEmployeeType,
  formatValue,
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <InfoField
            label="Employee Type"
            value={formatEmployeeType(editEmployeeType)}
            isEditing={isEditing}
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
            errorMessage={getValidationError("Plantilla Number")}
          >
            <input
              type="text"
              value={editPlantillaNo}
              onChange={(e) => setEditPlantillaNo(e.target.value)}
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
            <div>
              <input
                type="text"
                value={editTin}
                onChange={(e) =>
                  setEditTin(formatMaskedId(e.target.value, GOV_ID_MASKS.tin))
                }
                disabled={tinNotAvailable}
                inputMode="numeric"
                maxLength={11}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="000-000-000"
              />
              <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={tinNotAvailable}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTinNotAvailable(checked);
                    setEditTin(checked ? "N/A" : "");
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Not Available
              </label>
            </div>
          </InfoField>

          <InfoField
            label="GSIS BP Number"
            value={formatValue(editGsisBpNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("GSIS BP Number")}
          >
            <div>
              <input
                type="text"
                value={editGsisBpNo}
                onChange={(e) => setEditGsisBpNo(formatGsisBp(e.target.value))}
                disabled={gsisBpNotAvailable}
                inputMode="text"
                maxLength={12}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="00000-000000"
              />
              <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={gsisBpNotAvailable}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setGsisBpNotAvailable(checked);
                    setEditGsisBpNo(checked ? "N/A" : "");
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Not Available
              </label>
            </div>
          </InfoField>

          <InfoField
            label="GSIS CRN Number"
            value={formatValue(editGsisCrnNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("GSIS CRN Number")}
          >
            <div>
              <input
                type="text"
                value={editGsisCrnNo}
                onChange={(e) =>
                  setEditGsisCrnNo(normalize12Digits(e.target.value))
                }
                disabled={gsisCrnNotAvailable}
                inputMode="numeric"
                maxLength={12}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="000000000000"
              />
              <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={gsisCrnNotAvailable}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setGsisCrnNotAvailable(checked);
                    setEditGsisCrnNo(checked ? "N/A" : "");
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Not Available
              </label>
            </div>
          </InfoField>

          <InfoField
            label="PAG-IBIG Number"
            value={formatValue(editPagibigNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("PAG-IBIG Number")}
          >
            <div>
              <input
                type="text"
                value={editPagibigNo}
                onChange={(e) =>
                  setEditPagibigNo(normalize12Digits(e.target.value))
                }
                disabled={pagibigNotAvailable}
                inputMode="numeric"
                maxLength={12}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="000000000000"
              />
              <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={pagibigNotAvailable}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPagibigNotAvailable(checked);
                    setEditPagibigNo(checked ? "N/A" : "");
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Not Available
              </label>
            </div>
          </InfoField>

          <InfoField
            label="PhilHealth Number"
            value={formatValue(editPhilhealthNo)}
            isEditing={isEditing}
            errorMessage={getValidationError("PhilHealth Number")}
          >
            <div>
              <input
                type="text"
                value={editPhilhealthNo}
                onChange={(e) =>
                  setEditPhilhealthNo(normalizePhilhealth(e.target.value))
                }
                disabled={philhealthNotAvailable}
                inputMode="numeric"
                maxLength={12}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                placeholder="000000000000"
              />
              <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={philhealthNotAvailable}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPhilhealthNotAvailable(checked);
                    setEditPhilhealthNo(checked ? "N/A" : "");
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Not Available
              </label>
            </div>
          </InfoField>
        </div>
      </div>
    </div>
  );
}
