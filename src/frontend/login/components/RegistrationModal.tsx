"use client";
// Component: RegistrationModal
// Filename: RegistrationModal.tsx
// Purpose: Registration request form — submits to registration_requests table for admin approval
import React, { useState, useEffect } from "react";
import { Mail, Key, User, X, Building2 } from "../../assets/icons";
import { RegistrationSuccessModal } from "../../registration";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type School = { id: number; school_name: string; school_code: string };

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function RegistrationModal({ visible, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [requestedRole, setRequestedRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Individual field errors
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    if (visible) {
      fetch(`${API_BASE_URL}/api/schools`)
        .then((r) => r.json())
        .then((d) => setSchools(d.data || []))
        .catch(() => {});
    }
  }, [visible]);

  function validateEmail(value: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  }

  function validateName(name: string) {
    // At least 2 characters, letters only (including spaces and hyphens)
    const re = /^[a-zA-Z\s\-]{2,}$/;
    return re.test(name.trim());
  }

  function validatePassword(password: string) {
    if (password.length < 8)
      return { valid: false, message: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(password))
      return { valid: false, message: "Password must contain an uppercase letter" };
    if (!/[a-z]/.test(password))
      return { valid: false, message: "Password must contain a lowercase letter" };
    if (!/[0-9]/.test(password))
      return { valid: false, message: "Password must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return { valid: false, message: "Password must contain a special character" };
    return { valid: true, message: "" };
  }

  function handleFirstNameBlur() {
    if (!firstName.trim()) {
      setFirstNameError("First name is required");
    } else if (!validateName(firstName)) {
      setFirstNameError("First name must be at least 2 letters");
    } else {
      setFirstNameError("");
    }
  }

  function handleLastNameBlur() {
    if (!lastName.trim()) {
      setLastNameError("Last name is required");
    } else if (!validateName(lastName)) {
      setLastNameError("Last name must be at least 2 letters");
    } else {
      setLastNameError("");
    }
  }

  function handleEmailBlur() {
    if (!email.trim()) {
      setEmailError("Email is required");
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  }

  function handlePasswordBlur() {
    const validation = validatePassword(password);
    if (!password.trim()) {
      setPasswordError("Password is required");
    } else if (!validation.valid) {
      setPasswordError(validation.message);
    } else {
      setPasswordError("");
    }
  }

  function handleConfirmPasswordBlur() {
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  }

  function handleStep1Submit() {
    setError("");
    let hasError = false;

    if (!firstName.trim()) {
      setFirstNameError("First name is required");
      hasError = true;
    } else if (!validateName(firstName)) {
      setFirstNameError("First name must be at least 2 letters");
      hasError = true;
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      hasError = true;
    } else if (!validateName(lastName)) {
      setLastNameError("Last name must be at least 2 letters");
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (!schoolId) {
      setSchoolError("Please select a school");
      hasError = true;
    }

    if (!requestedRole) {
      setRoleError("Please select a role");
      hasError = true;
    }

    if (hasError) {
      setError("Please correct the errors before continuing");
      return;
    }

    setStep(2);
  }

  async function handleStep2Submit() {
    setError("");
    let hasError = false;

    const passwordValidation = validatePassword(password);
    if (!password.trim()) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) {
      setError("Please correct the errors before submitting");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          school_id: Number(schoolId),
          requested_role: requestedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit registration request");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setFirstName("");
    setLastName("");
    setEmail("");
    setSchoolId("");
    setRequestedRole("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSubmitted(false);
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setSchoolError("");
    setRoleError("");
    setPasswordError("");
    setConfirmPasswordError("");
    onClose();
  }

  return (
    <div
      className={`${visible ? "flex" : "hidden"} fixed inset-0 items-center justify-center bg-black/40 z-50`}
      aria-hidden={!visible}
    >
      <div className="relative bg-white p-10 rounded-lg w-full max-w-3xl border-2 border-blue-700 shadow">
        <div className="flex items-center justify-center mb-6">
          <h2 className="text-3xl font-bold text-sky-800">Registration Form</h2>
          <button
            aria-label="Close"
            onClick={handleReset}
            className="transition hover:cursor-pointer hover:bg-red-500 hover:text-white absolute top-6 right-6 text-gray-600 p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success screen */}
        {submitted ? (
          <RegistrationSuccessModal onClose={handleReset} />
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <User className="text-blue-600" size={18} />
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (firstNameError) setFirstNameError("");
                      }}
                      onBlur={handleFirstNameBlur}
                      placeholder="First name"
                      className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${firstNameError ? "border-red-500" : ""}`}
                    />
                    {firstNameError && (
                      <p className="text-sm text-red-600 mt-1">
                        {firstNameError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <User className="text-blue-600" size={18} />
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (lastNameError) setLastNameError("");
                      }}
                      onBlur={handleLastNameBlur}
                      placeholder="Last name"
                      className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${lastNameError ? "border-red-500" : ""}`}
                    />
                    {lastNameError && (
                      <p className="text-sm text-red-600 mt-1">
                        {lastNameError}
                      </p>
                    )}
                  </div>
                </div>

                <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="text-blue-600" size={18} />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="name@deped.gov.ph"
                  className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${emailError ? "border-red-500" : ""}`}
                />
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <Building2 className="text-blue-600" size={18} />
                      School <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={schoolId}
                      onChange={(e) => {
                        setSchoolId(e.target.value);
                        if (schoolError) setSchoolError("");
                      }}
                      className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md bg-white ${schoolError ? "border-red-500" : ""}`}
                    >
                      <option value="">Select a school</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.school_name}
                        </option>
                      ))}
                    </select>
                    {schoolError && (
                      <p className="text-sm text-red-600 mt-1">{schoolError}</p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => {
                        setRequestedRole(e.target.value);
                        if (roleError) setRoleError("");
                      }}
                      className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md bg-white ${roleError ? "border-red-500" : ""}`}
                    >
                      <option value="">Select a role</option>
                      <option value="DATA_ENCODER">Data Encoder</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {roleError && (
                      <p className="text-sm text-red-600 mt-1">{roleError}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 items-center mt-6">
                  <button
                    onClick={handleStep1Submit}
                    className="hover:cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-md w-full hover:bg-blue-700 transition"
                  >
                    Continue
                  </button>
                  <button
                    onClick={handleReset}
                    className="hover:bg-gray-400 text-gray-700 cursor-pointer px-6 py-2 border rounded-md w-full transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                  <p className="font-semibold mb-1">Password requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>At least 8 characters long</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains at least one number</li>
                    <li>
                      Contains at least one special character (!@#$%^&*...)
                    </li>
                  </ul>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Key className="text-blue-600" size={18} />
                  Create password <span className="text-red-500">*</span>
                </label>
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                    if (confirmPassword && e.target.value === confirmPassword)
                      setConfirmPasswordError("");
                  }}
                  onBlur={handlePasswordBlur}
                  placeholder="Create a password"
                  type="password"
                  className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${passwordError ? "border-red-500" : ""}`}
                />
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}

                <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                  <Key className="text-blue-600" size={18} />
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <input
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError("");
                  }}
                  onBlur={handleConfirmPasswordBlur}
                  placeholder="Confirm password"
                  type="password"
                  className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${confirmPasswordError ? "border-red-500" : ""}`}
                />
                {confirmPasswordError && (
                  <p className="text-sm text-red-600 mt-1">
                    {confirmPasswordError}
                  </p>
                )}

                <div className="flex flex-col gap-3 items-center mt-6">
                  <button
                    onClick={handleStep2Submit}
                    disabled={isLoading}
                    className="hover:cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-md w-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Submitting..." : "Submit Request"}
                  </button>
                  <button
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    disabled={isLoading}
                    className="text-gray-700 cursor-pointer px-6 py-2 border rounded-md w-full hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

