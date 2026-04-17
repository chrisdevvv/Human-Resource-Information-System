"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ListChecks,
  Briefcase,
  MapPinned,
  Users,
  Plus,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

import SchoolsList from "./SchoolsList";
import ParticularsList from "./ParticularsList";
import Reason from "./Reason";
import District from "./District";
import CivilStatus from "./CivilStatus";
import Positions from "./Positions";
import Sex from "./Sex";
import SuccessMessage from "./SuccessMessage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";

type School = {
  id: number;
  school_name: string;
  school_code: string;
};

type ConfigTab =
  | "schools"
  | "particulars"
  | "archiving"
  | "district"
  | "civil-status"
  | "positions"
  | "sex";

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("schools");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [particularSearch, setParticularSearch] = useState("");
  const [schoolSort, setSchoolSort] = useState<"a-z" | "z-a">("a-z");
  const [particularSort, setParticularSort] = useState<"a-z" | "z-a">("a-z");
  const [schools, setSchools] = useState<School[]>([]);
  const [particulars, setParticulars] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackVariant, setFeedbackVariant] = useState<"success" | "error">(
    "success",
  );
  const [modalInput, setModalInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number | string;
    name: string;
    type: "school" | "particular";
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showFeedback = (variant: "success" | "error", message: string) => {
    setFeedbackVariant(variant);
    setFeedbackMessage(message);
    setFeedbackVisible(true);
  };

  const refreshConfigurationData = async (showSpinner = false) => {
    if (showSpinner) {
      setIsLoading(true);
    }

    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No auth token found. Please login.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const schoolParams = new URLSearchParams();
      if (schoolSearch.trim()) schoolParams.set("search", schoolSearch.trim());
      schoolParams.set("sortOrder", schoolSort);

      const particularParams = new URLSearchParams();
      if (particularSearch.trim()) {
        particularParams.set("search", particularSearch.trim());
      }
      particularParams.set("sortOrder", particularSort);

      const [schoolsRes, particularsRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/schools/config/list?${schoolParams.toString()}`,
          { headers },
        ),
        fetch(
          `${API_BASE_URL}/api/leave/particulars/config?${particularParams.toString()}`,
          { headers },
        ),
      ]);

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(Array.isArray(schoolsData.data) ? schoolsData.data : []);
      } else if (schoolsRes.status !== 401 && schoolsRes.status !== 403) {
        console.error("Failed to fetch schools:", schoolsRes.statusText);
      }

      if (particularsRes.ok) {
        const particularsData = await particularsRes.json();
        setParticulars(
          Array.isArray(particularsData.data) ? particularsData.data : [],
        );
      } else if (
        particularsRes.status !== 401 &&
        particularsRes.status !== 403
      ) {
        console.error(
          "Failed to fetch particulars:",
          particularsRes.statusText,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load configuration data.",
      );
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  };

  // Fetch schools and particulars on component mount
  useEffect(() => {
    void refreshConfigurationData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolSearch, schoolSort, particularSearch, particularSort]);

  const handleDeleteSchool = (id: number, name: string) => {
    setDeleteTarget({ id, name, type: "school" });
    setShowDeleteConfirm(true);
  };

  const handleDeleteParticular = (id: number | string, name: string) => {
    setDeleteTarget({ id, name, type: "particular" });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setShowDeleteConfirm(false);
    setDeleteTarget(null);

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showFeedback("error", "No auth token found");
        setIsDeleting(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (target.type === "school") {
        const res = await fetch(`${API_BASE_URL}/api/schools/${target.id}`, {
          method: "DELETE",
          headers,
        });

        if (res.ok) {
          showFeedback(
            "success",
            `School "${target.name}" deleted successfully`,
          );
          await refreshConfigurationData();
        } else {
          const errData = await res.json().catch(() => ({}));
          showFeedback("error", errData.message || "Failed to delete school");
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/leave/particulars`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            particular: target.name,
          }),
        });

        if (res.ok) {
          showFeedback(
            "success",
            `Particular "${target.name}" deleted successfully`,
          );
          await refreshConfigurationData();
        } else {
          const errData = await res.json().catch(() => ({}));
          showFeedback(
            "error",
            errData.message || "Failed to delete particular",
          );
        }
      }
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "An error occurred",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSchools = useMemo(() => schools, [schools]);

  const filteredParticulars = useMemo(() => particulars, [particulars]);

  const hasActiveSchoolFilters =
    schoolSearch.trim().length > 0 || schoolSort !== "a-z";
  const hasActiveParticularFilters =
    particularSearch.trim().length > 0 || particularSort !== "a-z";
  const canManageItems = activeTab === "schools" || activeTab === "particulars";

  const handleClearSchoolFilters = () => {
    setSchoolSearch("");
    setSchoolSort("a-z");
  };

  const handleClearParticularFilters = () => {
    setParticularSearch("");
    setParticularSort("a-z");
  };

  const requestAddItem = () => {
    if (!modalInput.trim()) {
      showFeedback("error", "Please enter a name");
      return;
    }

    setShowAddConfirm(true);
  };

  const handleAddItem = async () => {
    if (!modalInput.trim()) {
      setShowAddConfirm(false);
      setShowEntryModal(false);
      showFeedback("error", "Please enter a name");
      return;
    }

    setShowAddConfirm(false);
    setShowEntryModal(false);

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        showFeedback("error", "No auth token found");
        setIsSaving(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (activeTab === "schools") {
        // Create school
        const schoolCode = modalInput
          .trim()
          .substring(0, 10)
          .toUpperCase()
          .replace(/\s+/g, "");

        const res = await fetch(`${API_BASE_URL}/api/schools`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            school_name: modalInput.trim(),
            school_code: schoolCode,
          }),
        });

        if (res.ok) {
          await res.json().catch(() => ({}));
          showFeedback("success", "School added successfully");
          await refreshConfigurationData();
        } else {
          const errData = await res.json().catch(() => ({}));
          showFeedback("error", errData.message || "Failed to add school");
        }
      } else {
        // Create particular
        const res = await fetch(`${API_BASE_URL}/api/leave/particulars`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            particular: modalInput.trim(),
          }),
        });

        if (res.ok) {
          showFeedback("success", "Particular added successfully");
          await refreshConfigurationData();
        } else {
          const errData = await res.json().catch(() => ({}));
          showFeedback("error", errData.message || "Failed to add particular");
        }
      }
      setModalInput("");
    } catch (err) {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "An error occurred",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="w-full min-w-0 bg-white rounded-lg shadow-lg p-2 sm:p-3 sticky top-4 flex flex-col gap-4">
      <h1
        style={{ fontSize: "20px" }}
        className="font-bold text-gray-900 inline-flex items-center gap-2"
      >
        <ListChecks size={24} className="text-blue-600" />
        Configuration
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 text-red-600" size={18} />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-1 sm:flex sm:flex-wrap sm:justify-start">
        <button
          type="button"
          onClick={() => setActiveTab("civil-status")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "civil-status"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <Users size={16} />
            Civil Status
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("district")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "district"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <MapPinned size={16} />
            District
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("particulars")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "particulars"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <ListChecks size={16} />
            Particulars
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archiving")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "archiving"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <AlertCircle size={16} />
            Reason (Deactivate)
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("positions")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "positions"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <Briefcase size={16} />
            Positions
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("schools")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "schools"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <Building2 size={16} />
            Schools
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sex")}
          className={`w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-1 font-medium text-xs rounded-lg sm:rounded-t-lg transition cursor-pointer ${
            activeTab === "sex"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="inline-flex w-full items-center justify-center gap-2 text-center">
            <Users size={16} />
            Sex
          </span>
        </button>
      </div>

      <div className="min-h-[62vh]">
        {isLoading ? (
          <div className="h-full rounded-2xl border border-blue-200 bg-white p-8 text-center shadow-sm">
            <div className="inline-flex animate-spin">
              <div className="h-6 w-6 rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Loading configuration...
            </p>
          </div>
        ) : activeTab === "schools" ? (
          <SchoolsList
            items={filteredSchools}
            searchValue={schoolSearch}
            onSearchChange={setSchoolSearch}
            hasActiveFilters={hasActiveSchoolFilters}
            onClearFilters={handleClearSchoolFilters}
            onAdd={() => setShowEntryModal(true)}
            onDelete={handleDeleteSchool}
            sortValue={schoolSort}
            onSortChange={setSchoolSort}
          />
        ) : activeTab === "particulars" ? (
          <ParticularsList
            items={filteredParticulars.map((particular, index) => ({
              id: index,
              name: particular,
            }))}
            searchValue={particularSearch}
            onSearchChange={setParticularSearch}
            hasActiveFilters={hasActiveParticularFilters}
            onClearFilters={handleClearParticularFilters}
            onAdd={() => setShowEntryModal(true)}
            onDelete={handleDeleteParticular}
            sortValue={particularSort}
            onSortChange={setParticularSort}
          />
        ) : activeTab === "archiving" ? (
          <Reason />
        ) : activeTab === "district" ? (
          <District />
        ) : activeTab === "civil-status" ? (
          <CivilStatus />
        ) : activeTab === "positions" ? (
          <Positions />
        ) : (
          <Sex />
        )}
      </div>

      {showEntryModal && canManageItems ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Add {activeTab === "schools" ? "School" : "Particular"}
                </h2>
                <p className="text-sm text-gray-500">
                  Enter the{" "}
                  {activeTab === "schools" ? "school name" : "particular name"}{" "}
                  to add it to the system.
                </p>
              </div>
            </div>
            <div className="space-y-4 px-5 py-4">
              <label className="block text-sm font-medium text-gray-700">
                {activeTab === "schools" ? "School Name" : "Particular Name"}
                <input
                  type="text"
                  placeholder={
                    activeTab === "schools"
                      ? "e.g., San Isidro National High School"
                      : "e.g., Vacation Leave"
                  }
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !isSaving) {
                      requestAddItem();
                    }
                  }}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={isSaving}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowEntryModal(false);
                  setModalInput("");
                }}
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={requestAddItem}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Add
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddConfirm && canManageItems ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Confirm Add {activeTab === "schools" ? "School" : "Particular"}?
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Please confirm before saving this new item.
              </p>
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                Are you sure you want to add{" "}
                <strong>{modalInput.trim()}</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowAddConfirm(false)}
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                disabled={isSaving}
              >
                <span className="inline-flex items-center gap-1">
                  <X size={14} />
                  Cancel
                </span>
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  {isSaving ? "Saving..." : "Confirm Add"}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteConfirm && deleteTarget ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                Delete{" "}
                {deleteTarget.type === "school" ? "School" : "Particular"}?
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
            <div className="space-y-3 px-5 py-4">
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                Are you sure you want to delete{" "}
                <strong>{deleteTarget.name}</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                disabled={isDeleting}
              >
                <span className="inline-flex items-center gap-1">
                  <X size={14} />
                  Cancel
                </span>
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Trash2 size={14} />
                    Delete
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SuccessMessage
        isVisible={feedbackVisible}
        message={feedbackMessage}
        variant={feedbackVariant}
        onClose={() => setFeedbackVisible(false)}
      />
    </section>
  );
}

