"use client";

import React, { useEffect, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import AddEmployeePersonalInfoModal, {
  type EmployeePersonalInfoRecord,
} from "./modals/AddEmployeePersonalInfoModal";
import EmployeePersonalInfoTable from "./components/EmployeePersonalInfoTable";
import ConfirmationModal from "@/frontend/super-admin/components/ConfirmationModal";
import ToastMessage from "@/frontend/components/ToastMessage";
import {
  createEServiceEmployee,
  deleteEServiceEmployee,
  getEServiceDistricts,
  getEServiceEmployees,
  getEServiceSchools,
  updateEServiceEmployee,
  type DistrictOption,
  type EmployeePersonalInfoApi,
  type EmployeePersonalInfoForm,
  type SchoolOption,
} from "./eserviceApi";

const formatDateForInput = (value?: string | null) => {
  if (!value) return "";

  const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, mm, dd, yyyy] = slashMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const mapEmployeeToRecord = (
  item: EmployeePersonalInfoApi,
): EmployeePersonalInfoRecord => {
  const firstName = item.firstName?.trim() || "";
  const lastName = item.lastName?.trim() || "";
  const middleName = item.middleName?.trim() || "";
  const middleInitial = item.middle_initial?.trim() || "";
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  return {
    id: item.id,
    firstName,
    lastName,
    middleName,
    middleInitial,
    misr: item.MISR?.trim() || "",
    email: item.email?.trim() || "",
    dateOfBirth: formatDateForInput(item.dateOfBirth),
    place: item.place?.trim() || "",
    district: item.district?.trim() || "",
    school: item.school?.trim() || "",
    gender: item.gender?.trim() || "",
    civilStatus: item.civilStatus?.trim() || "",
    teacherStatus: item.teacher_status?.trim() || "",
    fullName,
  };
};

export default function EServicePersonalInfo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeePersonalInfoRecord | null>(null);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] =
    useState<EmployeePersonalInfoRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  const [employees, setEmployees] = useState<EmployeePersonalInfoRecord[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [civilStatusFilter, setCivilStatusFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("");
  const [letterFilter, setLetterFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);

      const result = await getEServiceEmployees({
        search: searchQuery,
        district: districtFilter,
        school: schoolFilter,
        civilStatus: civilStatusFilter,
        sex: sexFilter,
        employeeType: employeeTypeFilter,
        letter: letterFilter,
        sortOrder: sortOrder.toUpperCase() as "ASC" | "DESC",
        page: currentPage,
        pageSize: itemsPerPage,
      });

      const mapped = (result.data || []).map(mapEmployeeToRecord);

      setEmployees(mapped);
      setTotalItems(typeof result.total === "number" ? result.total : mapped.length);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load employee records.",
      );

      if (showSpinner) {
        setEmployees([]);
        setTotalItems(0);
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      setLookupLoading(true);

      const [districtData, schoolData] = await Promise.all([
        getEServiceDistricts(),
        getEServiceSchools(),
      ]);

      setDistricts(districtData);
      setSchools(schoolData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lookups.");
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      loadEmployees();
    }, 300);

    return () => window.clearTimeout(id);
  }, [
    searchQuery,
    districtFilter,
    schoolFilter,
    civilStatusFilter,
    sexFilter,
    employeeTypeFilter,
    letterFilter,
    sortOrder,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    const loadDistrictSchools = async () => {
      try {
        const schoolData = await getEServiceSchools(districtFilter || undefined);
        setSchools(schoolData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load schools.");
      }
    };

    loadDistrictSchools();
  }, [districtFilter]);

  const handleOpenAdd = () => {
    setModalMode("add");
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (employee: EmployeePersonalInfoRecord) => {
    setModalMode("edit");
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (employee: EmployeePersonalInfoRecord) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirmation(true);
  };

  const performDelete = async () => {
    if (!employeeToDelete) return;

    setDeleting(true);

    try {
      await deleteEServiceEmployee(employeeToDelete.id);
      await loadEmployees(false);

      setShowDeleteConfirmation(false);
      setEmployeeToDelete(null);

      setTimeout(() => {
        setShowDeleteToast(true);
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (payload: EmployeePersonalInfoForm) => {
    if (modalMode === "edit" && selectedEmployee) {
      await updateEServiceEmployee(selectedEmployee.id, payload);
    } else {
      await createEServiceEmployee(payload);
    }

    await loadEmployees(false);
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <div className="w-full rounded-2xl bg-gray-100 p-2 sm:p-4">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-5 text-gray-800 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ClipboardList className="h-5 w-5" />
            </span>

            <h1 className="text-xl font-bold leading-tight sm:text-2xl">
              E-Service Record
            </h1>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Desktop / Tablet Header */}
          <div className="mb-4 hidden items-center justify-between gap-4 md:flex">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800 shadow-sm transition hover:bg-green-200 sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Add New
            </button>
          </div>

          {/* Mobile Header */}
          <div className="mb-4 md:hidden">
            <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 to-white p-3 shadow-sm">
              <div className="flex flex-col gap-2.5">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Employee Personal Information
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Manage employee records.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New
                </button>
              </div>
            </div>
          </div>

          <EmployeePersonalInfoTable
            loading={loading}
            error={error}
            rows={employees}
            totalItems={totalItems}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            districtFilter={districtFilter}
            onDistrictChange={(value) => {
              setDistrictFilter(value);
              setSchoolFilter("");
              setCurrentPage(1);
            }}
            schoolFilter={schoolFilter}
            onSchoolChange={(value) => {
              setSchoolFilter(value);
              setCurrentPage(1);
            }}
            civilStatusFilter={civilStatusFilter}
            onCivilStatusChange={(value) => {
              setCivilStatusFilter(value);
              setCurrentPage(1);
            }}
            sexFilter={sexFilter}
            onSexChange={(value) => {
              setSexFilter(value);
              setCurrentPage(1);
            }}
            employeeTypeFilter={employeeTypeFilter}
            onEmployeeTypeChange={(value) => {
              setEmployeeTypeFilter(value);
              setCurrentPage(1);
            }}
            letterFilter={letterFilter}
            onLetterChange={(value) => {
              setLetterFilter(value);
              setCurrentPage(1);
            }}
            sortOrder={sortOrder}
            onSortOrderChange={() =>
              setSortOrder((current) => (current === "asc" ? "desc" : "asc"))
            }
            districts={districts}
            schools={schools}
            lookupLoading={lookupLoading}
            onSearch={() => loadEmployees()}
          />
        </div>
      </div>

      <AddEmployeePersonalInfoModal
        isOpen={isModalOpen}
        mode={modalMode}
        districts={districts}
        schools={schools}
        initialData={selectedEmployee}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmationModal
        visible={showDeleteConfirmation}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${
          employeeToDelete?.fullName || `employee #${employeeToDelete?.id}`
        }? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        loading={deleting}
        onConfirm={performDelete}
        onCancel={() => {
          setShowDeleteConfirmation(false);
          setEmployeeToDelete(null);
        }}
      />

      <ToastMessage
        isVisible={showDeleteToast}
        title="Success"
        message="Employee deleted successfully!"
        variant="success"
        position="bottom-right"
        onClose={() => setShowDeleteToast(false)}
        autoCloseDuration={2000}
      />
    </div>
  );
}