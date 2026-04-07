"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, UserPlus, XCircle } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type AddUserModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

type SchoolOption = {
  id: number;
  school_name: string;
};

type SchoolListResponse = {
  data?: SchoolOption[];
};

function validateEmail(value: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value);
}

function validateName(name: string) {
  const re = /^[a-zA-Z\s\-]{2,}$/;
  return re.test(name.trim());
}

function validatePassword(value: string) {
  if (value.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters",
    };
  }
  if (!/[A-Z]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain an uppercase letter",
    };
  }
  if (!/[a-z]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain a lowercase letter",
    };
  }
  if (!/[0-9]/.test(value)) {
    return { valid: false, message: "Password must contain a number" };
  }
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain a special character",
    };
  }
  return { valid: true, message: "" };
}

export default function AddUserModal({
  onClose,
  onSuccess,
}: AddUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  useEffect(() => {
    let isDisposed = false;

    const loadSchools = async () => {
      try {
        setSchoolsLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/schools/public/list`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch schools");
        }

        const payload = (await response
          .json()
          .catch(() => ({}))) as SchoolListResponse;

        if (!isDisposed) {
          const options = Array.isArray(payload.data) ? payload.data : [];
          setSchoolOptions(options);
        }
      } catch {
        if (!isDisposed) {
          setSchoolOptions([]);
        }
      } finally {
        if (!isDisposed) {
          setSchoolsLoading(false);
        }
      }
    };

    loadSchools();

    return () => {
      isDisposed = true;
    };
  }, []);

  const validateForm = () => {
    let hasError = false;
    setError("");

    if (!firstName.trim()) {
      setFirstNameError("First name is required");
      hasError = true;
    } else if (!validateName(firstName)) {
      setFirstNameError("First name must be at least 2 letters");
      hasError = true;
    } else {
      setFirstNameError("");
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      hasError = true;
    } else if (!validateName(lastName)) {
      setLastNameError("Last name must be at least 2 letters");
      hasError = true;
    } else {
      setLastNameError("");
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (!schoolId) {
      setSchoolError("School is required");
      hasError = true;
    } else if (
      !schoolOptions.some((option) => String(option.id) === schoolId)
    ) {
      setSchoolError("Please select a valid school from the dropdown");
      hasError = true;
    } else {
      setSchoolError("");
    }

    const passwordValidation = validatePassword(password);
    if (!password.trim()) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }

    if (hasError) {
      setError("Please correct the errors before continuing.");
    }

    return !hasError;
  };

  const handleOpenConfirm = () => {
    if (!validateForm()) {
      return;
    }
    setShowConfirm(true);
  };

  const handleAddUser = async () => {
    try {
      setLoading(true);
      setError("");

      const selectedSchool = schoolOptions.find(
        (option) => String(option.id) === schoolId,
      );

      if (!selectedSchool) {
        throw new Error("Please select a valid school from the dropdown.");
      }

      const registerResponse = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            password,
            school_name: selectedSchool.school_name,
            requested_role: "DATA_ENCODER",
            suppress_pending_email: true,
          }),
        },
      );

      const registerPayload = await registerResponse
        .json()
        .catch(() => ({}) as { message?: string; requestId?: number });

      if (!registerResponse.ok) {
        throw new Error(
          registerPayload.message || "Failed to submit registration request.",
        );
      }

      const requestId = registerPayload.requestId;
      if (!requestId) {
        throw new Error("Missing request ID from registration response.");
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const approveResponse = await fetch(
        `${API_BASE_URL}/api/registrations/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            approved_role: "DATA_ENCODER",
            temporary_password: password,
            suppress_approved_email: true,
          }),
        },
      );

      const approvePayload = await approveResponse
        .json()
        .catch(() => ({}) as { message?: string });

      if (!approveResponse.ok) {
        throw new Error(
          approvePayload.message || "Failed to approve new user.",
        );
      }

      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err) {
      setShowConfirm(false);
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-xl border border-blue-200 shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Add User</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Create and approve a new account. The user will be added as Data
            Encoder.
          </p>

          {error && (
            <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (firstNameError) setFirstNameError("");
                }}
                placeholder="First name"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
              />
              {firstNameError && (
                <p className="text-xs text-red-600 mt-1">{firstNameError}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (lastNameError) setLastNameError("");
                }}
                placeholder="Last name"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
              />
              {lastNameError && (
                <p className="text-xs text-red-600 mt-1">{lastNameError}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="name@deped.gov.ph"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
              />
              {emailError && (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                School
              </label>
              <select
                value={schoolId}
                onChange={(e) => {
                  setSchoolId(e.target.value);
                  if (schoolError) setSchoolError("");
                }}
                disabled={schoolsLoading}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer disabled:cursor-not-allowed"
              >
                <option value="">
                  {schoolsLoading ? "Loading schools..." : "Select a school"}
                </option>
                {schoolOptions.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.school_name}
                  </option>
                ))}
              </select>
              {schoolError && (
                <p className="text-xs text-red-600 mt-1">{schoolError}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-600 mt-1">{passwordError}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError("");
                  }}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-red-600 mt-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium cursor-pointer disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1">
                <XCircle size={14} />
                Cancel
              </span>
            </button>
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1">
                <UserPlus size={14} />
                Add User
              </span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        visible={showConfirm}
        title="Confirm Add User"
        message={`You are about to add ${firstName.trim()} ${lastName.trim()} as a Data Encoder.`}
        warningMessage="Please verify all details before continuing."
        confirmLabel="Confirm Add User"
        cancelLabel="Back"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        loading={loading}
        onConfirm={handleAddUser}
        onCancel={() => setShowConfirm(false)}
      />

      {showSuccess && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 px-4">
          <div className="bg-white rounded-xl border border-blue-200 shadow-2xl w-full max-w-md p-6 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              User Added Successfully
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              The user has been added and can now log in as Data Encoder.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSuccess(false);
                onSuccess();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer"
            >
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={14} />
                Done
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
