"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type AddUserModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

type FormStep = 1 | 2;

type SchoolApiItem = {
  school_name?: unknown;
  schoolName?: unknown;
};

type SchoolListResponse = {
  data?: SchoolApiItem[];
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
  const [step, setStep] = useState<FormStep>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
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
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);

  useEffect(() => {
    let disposed = false;

    const loadSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/schools`);
        if (!response.ok) {
          throw new Error("Failed to load schools");
        }

        const payload = (await response
          .json()
          .catch(() => ({}))) as SchoolListResponse;
        const rows = Array.isArray(payload.data) ? payload.data : [];

        const names = Array.from(
          new Set(
            rows
              .map((row) => {
                const rawValue =
                  typeof row.school_name === "string"
                    ? row.school_name
                    : typeof row.schoolName === "string"
                      ? row.schoolName
                      : "";
                return rawValue.trim();
              })
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b));

        if (!disposed) {
          setSchoolOptions(names);
        }
      } catch {
        if (!disposed) {
          setSchoolOptions([]);
        }
      }
    };

    loadSchools();

    return () => {
      disposed = true;
    };
  }, []);

  const validateDetailsStep = () => {
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

    if (!school.trim()) {
      setSchoolError("School is required");
      hasError = true;
    } else {
      setSchoolError("");
    }

    if (hasError) {
      setError("Please correct the errors before continuing.");
    }

    return !hasError;
  };

  const validatePasswordStep = () => {
    let hasError = false;
    setError("");

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

  const handleNext = () => {
    if (!validateDetailsStep()) {
      return;
    }
    setStep(2);
  };

  const handleOpenConfirm = () => {
    if (!validatePasswordStep()) {
      return;
    }
    setShowConfirm(true);
  };

  const handleAddUser = async () => {
    try {
      setLoading(true);
      setError("");

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
            school_name: school.trim(),
            requested_role: "DATA_ENCODER",
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
          body: JSON.stringify({ approved_role: "DATA_ENCODER" }),
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
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Add User</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Step {step} of 2: {step === 1 ? "Basic Details" : "Set Password"}
          </p>

          {error && (
            <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {step === 1 && (
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
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
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
                <input
                  list="school-options-add-user"
                  value={school}
                  onChange={(e) => {
                    setSchool(e.target.value);
                    if (schoolError) setSchoolError("");
                  }}
                  placeholder="School name"
                  autoComplete="off"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Type a school name or choose from existing schools in the
                  dropdown.
                </p>
                {schoolError && (
                  <p className="text-xs text-red-600 mt-1">{schoolError}</p>
                )}
              </div>

              <datalist id="school-options-add-user">
                {schoolOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (step === 1) {
                  onClose();
                  return;
                }
                setStep(1);
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium cursor-pointer disabled:opacity-60"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer disabled:opacity-60"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium cursor-pointer disabled:opacity-60"
              >
                Add User
              </button>
            )}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
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
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
