"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ListChecks,
  Plus,
  ShieldCheck,
  X,
  AlertCircle,
  ArrowUpAZ,
} from "lucide-react";

import SchoolsList from "./SchoolsList";
import ParticularsList from "./ParticularsList";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type School = {
  id: number;
  school_name: string;
  school_code: string;
};

type ConfigurationItem = {
  id: number | string;
  name: string;
};

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState<"schools" | "particulars">(
    "schools",
  );
  const [schoolSearch, setSchoolSearch] = useState("");
  const [particularSearch, setParticularSearch] = useState("");
  const [schoolSort, setSchoolSort] = useState<"a-z" | "z-a">("a-z");
  const [particularSort, setParticularSort] = useState<"a-z" | "z-a">("a-z");
  const [schools, setSchools] = useState<School[]>([]);
  const [particulars, setParticulars] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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

  const showSuccessFeedback = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  useEffect(() => {
    if (!showSuccessModal) return;

    const timer = setTimeout(() => {
      setShowSuccessModal(false);
      setSuccessMessage("");
    }, 2000);

    return () => clearTimeout(timer);
  }, [showSuccessModal]);

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

      const [schoolsRes, particularsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/schools/config/list`, { headers }),
        fetch(`${API_BASE_URL}/api/leave/particulars/config`, { headers }),
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
  }, []);

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

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setToastMessage("No auth token found");
        setShowToast(true);
        setIsDeleting(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (deleteTarget.type === "school") {
        const res = await fetch(
          `${API_BASE_URL}/api/schools/${deleteTarget.id}`,
          {
            method: "DELETE",
            headers,
          },
        );

        if (res.ok) {
          showSuccessFeedback(
            `School "${deleteTarget.name}" deleted successfully`,
          );
          await refreshConfigurationData();
        } else {
          const errData = await res.json().catch(() => ({}));
          setToastMessage(errData.message || "Failed to delete school");
          setShowToast(true);
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/leave/particulars`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            particular: deleteTarget.name,
          }),
        });

        if (res.ok) {
          showSuccessFeedback(
            `Particular "${deleteTarget.name}" deleted successfully`,
          );
          await refreshConfigurationData();
        } else {
          const errData = await res.json().catch(() => ({}));
          setToastMessage(errData.message || "Failed to delete particular");
          setShowToast(true);
        }
      }

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "An error occurred");
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSchools = useMemo(() => {
    const query = schoolSearch.trim().toLowerCase();

    const safeSchools = schools.filter(
      (item): item is School =>
        Boolean(item) && typeof item.school_name === "string",
    );

    const results = query
      ? safeSchools.filter((item) =>
          item.school_name.toLowerCase().includes(query),
        )
      : safeSchools;

    return [...results].sort((a, b) => {
      const schoolA = a.school_name ?? "";
      const schoolB = b.school_name ?? "";
      return schoolSort === "a-z"
        ? schoolA.localeCompare(schoolB)
        : schoolB.localeCompare(schoolA);
    });
  }, [schoolSearch, schools, schoolSort]);

  const filteredParticulars = useMemo(() => {
    const query = particularSearch.trim().toLowerCase();

    const safeParticulars = particulars.filter(
      (item): item is string => typeof item === "string",
    );

    const results = query
      ? safeParticulars.filter((item) => item.toLowerCase().includes(query))
      : safeParticulars;

    return [...results].sort((a, b) =>
      particularSort === "a-z" ? a.localeCompare(b) : b.localeCompare(a),
    );
  }, [particularSearch, particulars, particularSort]);

  const requestAddItem = () => {
    if (!modalInput.trim()) {
      setToastMessage("Please enter a name");
      setShowToast(true);
      return;
    }

    setShowAddConfirm(true);
  };

  const handleAddItem = async () => {
    if (!modalInput.trim()) {
      setShowAddConfirm(false);
      setToastMessage("Please enter a name");
      setShowToast(true);
      return;
    }

    setShowAddConfirm(false);

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setToastMessage("No auth token found");
        setShowToast(true);
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
          showSuccessFeedback("School added successfully");
          await refreshConfigurationData();
        } else {
          const errData = await res.json().catch(() => ({}));
          setToastMessage(errData.message || "Failed to add school");
          setShowToast(true);
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
          showSuccessFeedback("Particular added successfully");
          await refreshConfigurationData();
        } else {
          const errData = await res.json().catch(() => ({}));
          setToastMessage(errData.message || "Failed to add particular");
          setShowToast(true);
        }
      }

      setShowEntryModal(false);
      setModalInput("");
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "An error occurred");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="w-full h-[calc(100vh-7rem)] flex flex-col gap-4 sm:gap-6 overflow-hidden">
      <div className="rounded-2xl bg-linear-to-r from-blue-700 to-blue-500 p-4 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">Configuration</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl inline-flex items-center gap-2">
              <ListChecks size={24} />
              Manage dropdown options
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-blue-100">
              Organize schools and particulars used across forms.
            </p>
          </div>

          <div className="w-full rounded-xl border border-white/20 bg-white/10 p-3 lg:w-auto">
            <div className="flex items-center gap-2 text-sm text-blue-50">
              <ShieldCheck size={16} />
              Signed in as <span className="font-semibold">Super Admin</span>
            </div>
            <p className="mt-1 text-xs text-blue-100">
              You can manage configuration items.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 text-red-600" size={18} />
              <div>
                <p className="text-sm font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:mt-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab("schools")}
              className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
                activeTab === "schools"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Building2 size={16} />
                Schools
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("particulars")}
              className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${
                activeTab === "particulars"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <ListChecks size={16} />
                Particulars
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <div className="h-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
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
            onAdd={() => setShowEntryModal(true)}
            onDelete={handleDeleteSchool}
            sortValue={schoolSort}
            onSortChange={setSchoolSort}
          />
        ) : (
          <ParticularsList
            items={filteredParticulars.map((particular, index) => ({
              id: index,
              name: particular,
            }))}
            searchValue={particularSearch}
            onSearchChange={setParticularSearch}
            onAdd={() => setShowEntryModal(true)}
            onDelete={handleDeleteParticular}
            sortValue={particularSort}
            onSortChange={setParticularSort}
          />
        )}
      </div>

      {showEntryModal ? (
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
                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={requestAddItem}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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

      {showAddConfirm ? (
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
                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={isSaving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Confirm Add"}
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
                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-900">Success</p>
                <p className="text-sm text-gray-600">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showToast ? (
        <div className="fixed bottom-5 right-5 z-50 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 text-emerald-600" size={18} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {toastMessage.includes("Error") ||
                toastMessage.includes("Failed")
                  ? "Error"
                  : "Success"}
              </p>
              <p className="text-sm text-gray-600">{toastMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="cursor-pointer text-gray-400 hover:text-gray-700"
              aria-label="Close toast"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
