"use client";
// Component: RegistrationModal
// Filename: RegistrationModal.tsx
// Purpose: Registration request form — submits to registration_requests table for admin approval
import React, { useEffect, useRef, useState } from "react";
import { Mail, Key, User, X, Building2, Eye, EyeOff } from "../assets/icons";
import { RegistrationSuccessModal } from ".";
import { createClearHandler, hasFormData } from "../utils/clearFormUtils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const SCHOOLS_DIVISION_OFFICE = "Schools Division Office";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function RegistrationModal({ visible, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [school, setSchool] = useState("");
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [schoolInputValue, setSchoolInputValue] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [useSchoolsDivisionOffice, setUseSchoolsDivisionOffice] =
    useState(false);
  const [schools, setSchools] = useState<
    Array<{ id: number; school_name: string }>
  >([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsError, setSchoolsError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<{
    firstName: string;
    middleName: string;
    noMiddleName: boolean;
    lastName: string;
    email: string;
    birthdate: string;
    school: string;
    password: string;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const submitInProgressRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Load schools
    const loadSchools = async () => {
      try {
        setSchoolsLoading(true);
        setSchoolsError("");
        const response = await fetch(
          `${API_BASE_URL}/api/schools/public/list`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        console.log("Schools API Response Status:", response.status);
        const body = await response.json();
        console.log("Schools API Response Body:", body);

        if (response.ok) {
          const options = body.data || [];
          console.log("Schools loaded:", options);
          setSchools(options);
        } else {
          const errorMsg =
            body.message || `API returned status ${response.status}`;
          console.error("Schools API Error:", errorMsg);
          setSchoolsError(errorMsg);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load schools";
        console.error("Failed to load schools:", err);
        setSchoolsError(errorMsg);
      } finally {
        setSchoolsLoading(false);
      }
    };

    loadSchools();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  // Individual field errors
  const [firstNameError, setFirstNameError] = useState("");
  const [middleNameError, setMiddleNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [birthdateError, setBirthdateError] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const sortedSchools = [...schools].sort((a, b) =>
    a.school_name.localeCompare(b.school_name),
  );

  const filteredSchools = sortedSchools.filter((school) =>
    school.school_name
      .trim()
      .toLowerCase()
      .includes(schoolInputValue.trim().toLowerCase()),
  );

  // Track unsaved changes
  const trackChange = (newValue: string, currentValue: string) => {
    if (newValue !== currentValue) {
      setHasUnsavedChanges(true);
    }
  };

  function validateEmail(value: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  }

  function validateName(name: string) {
    // At least 2 characters, letters only (including spaces and hyphens)
    const re = /^[a-zA-Z\s\-]{2,}$/;
    return re.test(name.trim());
  }

  function startsWithCapital(name: string) {
    return /^[A-Z]/.test(name.trim());
  }

  function validatePassword(password: string) {
    if (password.length < 8)
      return {
        valid: false,
        message: "Password must be at least 8 characters",
      };
    if (!/[A-Z]/.test(password))
      return {
        valid: false,
        message: "Password must contain an uppercase letter",
      };
    if (!/[a-z]/.test(password))
      return {
        valid: false,
        message: "Password must contain a lowercase letter",
      };
    if (!/[0-9]/.test(password))
      return { valid: false, message: "Password must contain a number" };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return {
        valid: false,
        message: "Password must contain a special character",
      };
    return { valid: true, message: "" };
  }

  function validateUsername(value: string) {
    if (!value.trim()) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9._-]+$/.test(value))
      return "Username may only contain letters, numbers, dots, underscores, or hyphens";
    return "";
  }

  function handleFirstNameBlur() {
    if (!firstName.trim()) {
      setFirstNameError("First name is required");
    } else if (!validateName(firstName)) {
      setFirstNameError("First name must be at least 2 letters");
    } else if (!startsWithCapital(firstName)) {
      setFirstNameError("First name must start with a capital letter");
    } else {
      setFirstNameError("");
    }
  }

  function handleLastNameBlur() {
    if (!lastName.trim()) {
      setLastNameError("Last name is required");
    } else if (!validateName(lastName)) {
      setLastNameError("Last name must be at least 2 letters");
    } else if (!startsWithCapital(lastName)) {
      setLastNameError("Last name must start with a capital letter");
    } else {
      setLastNameError("");
    }
  }

  function handleMiddleNameBlur() {
    if (noMiddleName) {
      setMiddleNameError("");
      return;
    }

    if (!middleName.trim()) {
      setMiddleNameError("Middle name is required");
    } else if (!validateName(middleName)) {
      setMiddleNameError("Middle name must be at least 2 letters");
    } else if (!startsWithCapital(middleName)) {
      setMiddleNameError("Middle name must start with a capital letter");
    } else {
      setMiddleNameError("");
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
    } else if (!startsWithCapital(firstName)) {
      setFirstNameError("First name must start with a capital letter");
      hasError = true;
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      hasError = true;
    } else if (!validateName(lastName)) {
      setLastNameError("Last name must be at least 2 letters");
      hasError = true;
    } else if (!startsWithCapital(lastName)) {
      setLastNameError("Last name must start with a capital letter");
      hasError = true;
    }

    if (!noMiddleName) {
      if (!middleName.trim()) {
        setMiddleNameError("Middle name is required");
        hasError = true;
      } else if (!validateName(middleName)) {
        setMiddleNameError("Middle name must be at least 2 letters");
        hasError = true;
      } else if (!startsWithCapital(middleName)) {
        setMiddleNameError("Middle name must start with a capital letter");
        hasError = true;
      }
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    if (useSchoolsDivisionOffice) {
      setSchoolError("");
    } else {
      if (!school.trim()) {
        setSchoolError("School is required");
        hasError = true;
      }

      if (!schoolId) {
        setSchoolError("Please select a valid school from the dropdown");
        hasError = true;
      }
    }

    if (!birthdate) {
      setBirthdateError("Birthdate is required");
      hasError = true;
    } else if (new Date(birthdate) > new Date()) {
      setBirthdateError("Birthdate cannot be in the future");
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

    // Store form data and show confirmation modal
    const selectedSchoolName = useSchoolsDivisionOffice
      ? SCHOOLS_DIVISION_OFFICE
      : school;

    setPendingFormData({
      firstName,
      middleName,
      noMiddleName,
      lastName,
      email,
      birthdate,
      school: selectedSchoolName,
      password,
    });
    setIsConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    if (!pendingFormData || submitInProgressRef.current) {
      return;
    }

    submitInProgressRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: pendingFormData.firstName,
          middle_name: pendingFormData.noMiddleName
            ? null
            : pendingFormData.middleName,
          no_middle_name: pendingFormData.noMiddleName,
          last_name: pendingFormData.lastName,
          email: pendingFormData.email,
          birthdate: pendingFormData.birthdate,
          password: pendingFormData.password,
          school_name: pendingFormData.school,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit registration request");
        setIsConfirmOpen(false);
        submitInProgressRef.current = false;
        return;
      }

      setIsConfirmOpen(false);
      setPendingFormData(null);
      setHasUnsavedChanges(false);
      submitInProgressRef.current = false;
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsConfirmOpen(false);
      submitInProgressRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancelConfirm() {
    if (isLoading) {
      return;
    }
    setIsConfirmOpen(false);
    submitInProgressRef.current = false;
  }

  function handleClearAllFields() {
    setFirstName("");
    setMiddleName("");
    setNoMiddleName(false);
    setLastName("");
    setEmail("");
    setBirthdate("");
    setSchool("");
    setSchoolId(null);
    setSchoolInputValue("");
    setShowSchoolDropdown(false);
    setUseSchoolsDivisionOffice(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setFirstNameError("");
    setMiddleNameError("");
    setLastNameError("");
    setEmailError("");
    setBirthdateError("");
    setSchoolError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setHasUnsavedChanges(false);
    // Keep step, don't reset to step 1
  }

  function handleReset() {
    if (
      !submitted &&
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved changes. Are you sure you want to cancel?",
      )
    ) {
      return;
    }

    setStep(1);
    setFirstName("");
    setMiddleName("");
    setNoMiddleName(false);
    setLastName("");
    setEmail("");
    setBirthdate("");
    setSchool("");
    setSchoolId(null);
    setSchoolInputValue("");
    setShowSchoolDropdown(false);
    setUseSchoolsDivisionOffice(false);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSubmitted(false);
    setFirstNameError("");
    setMiddleNameError("");
    setLastNameError("");
    setEmailError("");
    setBirthdateError("");
    setSchoolError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setHasUnsavedChanges(false);
    setPendingFormData(null);
    setIsConfirmOpen(false);
    submitInProgressRef.current = false;
    onClose();
  }

  return (
    <div
      className={`${visible ? "flex" : "hidden"} fixed inset-0 z-50 items-center justify-center bg-black/40 px-4`}
      aria-hidden={!visible}
    >
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-blue-200 bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={handleReset}
          className="absolute right-2 top-2 rounded p-1 text-xl transition hover:bg-red-500 hover:text-white"
          aria-label="Close registration form"
        >
          <X size={18} />
        </button>

        <div className="mb-1 flex items-center gap-2">
          <Building2 size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Registration Form</h2>
        </div>
        <p className="mb-5 text-sm text-gray-500">
          Complete the form below to submit your registration request.
        </p>

        {/* Success screen */}
        {submitted ? (
          <RegistrationSuccessModal onClose={handleReset} />
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStep1Submit();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="text-blue-600" size={18} />
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={firstName}
                      onChange={(e) => {
                        trackChange(e.target.value, firstName);
                        setFirstName(e.target.value);
                        if (firstNameError) setFirstNameError("");
                      }}
                      onBlur={handleFirstNameBlur}
                      placeholder="First name"
                      className={`mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${firstNameError ? "border-red-500" : ""}`}
                    />
                    {firstNameError && (
                      <p className="text-sm text-red-600 mt-1">
                        {firstNameError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="text-blue-600" size={18} />
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={lastName}
                      onChange={(e) => {
                        trackChange(e.target.value, lastName);
                        setLastName(e.target.value);
                        if (lastNameError) setLastNameError("");
                      }}
                      onBlur={handleLastNameBlur}
                      placeholder="Last name"
                      className={`mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${lastNameError ? "border-red-500" : ""}`}
                    />
                    {lastNameError && (
                      <p className="text-sm text-red-600 mt-1">
                        {lastNameError}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="text-blue-600" size={18} />
                    Middle name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={middleName}
                    onChange={(e) => {
                      trackChange(e.target.value, middleName);
                      setMiddleName(e.target.value);
                      if (middleNameError) setMiddleNameError("");
                    }}
                    onBlur={handleMiddleNameBlur}
                    disabled={noMiddleName}
                    placeholder={
                      noMiddleName ? "No middle name provided" : "Middle name"
                    }
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                      noMiddleName
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-700"
                    } ${middleNameError ? "border-red-500" : ""}`}
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={noMiddleName}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNoMiddleName(checked);
                        if (checked) {
                          setMiddleName("");
                          setMiddleNameError("");
                        }
                      }}
                      className="h-4 w-4 cursor-pointer"
                    />
                    I don't have a middle name
                  </label>
                  {middleNameError && (
                    <p className="text-sm text-red-600 mt-1">
                      {middleNameError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Mail className="text-blue-600" size={18} />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={email}
                      onChange={(e) => {
                        trackChange(e.target.value, email);
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      onBlur={handleEmailBlur}
                      placeholder="name@deped.gov.ph"
                      className={`mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${emailError ? "border-red-500" : ""}`}
                    />
                    {emailError && (
                      <p className="text-sm text-red-600 mt-1">{emailError}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <User className="text-blue-600" size={18} />
                      Birthdate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => {
                        trackChange(e.target.value, birthdate);
                        setBirthdate(e.target.value);
                        if (birthdateError) setBirthdateError("");
                      }}
                      max={new Date().toISOString().slice(0, 10)}
                      className={`mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${birthdateError ? "border-red-500" : ""}`}
                    />
                    {birthdateError && (
                      <p className="text-sm text-red-600 mt-1">
                        {birthdateError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Building2 className="text-blue-600" size={18} />
                    School <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-2">
                    {useSchoolsDivisionOffice ? (
                      <input
                        type="text"
                        value={SCHOOLS_DIVISION_OFFICE}
                        readOnly
                        disabled
                        className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 cursor-not-allowed"
                      />
                    ) : (
                      <>
                        <input
                          type="text"
                          value={schoolInputValue}
                          onChange={(e) => {
                            setSchoolInputValue(e.target.value);
                            setShowSchoolDropdown(true);
                          }}
                          onFocus={() => setShowSchoolDropdown(true)}
                          onBlur={() => {
                            // Delay closing to allow click on option
                            setTimeout(() => setShowSchoolDropdown(false), 150);
                          }}
                          disabled={schoolsLoading}
                          className={`w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                            schoolError ? "border-red-500" : ""
                          } ${schoolsLoading ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-300 text-gray-700"}`}
                          placeholder={
                            schoolsLoading
                              ? "Loading schools..."
                              : "Type to search schools..."
                          }
                        />
                        {showSchoolDropdown && (
                          <div className="absolute top-full mt-1 w-full bg-white border border-blue-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                            {schoolsLoading ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Loading schools...
                              </div>
                            ) : schoolsError ? (
                              <div className="px-4 py-3 text-sm text-red-600 text-center">
                                Error: {schoolsError}
                              </div>
                            ) : schools.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No schools available
                              </div>
                            ) : filteredSchools.length > 0 ? (
                              filteredSchools.map((schoolOption) => (
                                <button
                                  key={schoolOption.id}
                                  type="button"
                                  onClick={() => {
                                    setSchoolId(schoolOption.id);
                                    setSchoolInputValue(
                                      schoolOption.school_name,
                                    );
                                    setSchool(schoolOption.school_name);
                                    setShowSchoolDropdown(false);
                                    if (schoolError) setSchoolError("");
                                  }}
                                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 transition cursor-pointer ${
                                    schoolId === schoolOption.id
                                      ? "bg-blue-100 font-medium text-blue-700"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {schoolOption.school_name}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No schools match &quot;{schoolInputValue}&quot;
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={useSchoolsDivisionOffice}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasUnsavedChanges(true);
                        setUseSchoolsDivisionOffice(checked);
                        if (checked) {
                          setSchool(SCHOOLS_DIVISION_OFFICE);
                          setSchoolInputValue(SCHOOLS_DIVISION_OFFICE);
                          setSchoolId(null);
                          setShowSchoolDropdown(false);
                          setSchoolError("");
                        } else {
                          setSchool("");
                          setSchoolInputValue("");
                          setSchoolId(null);
                        }
                      }}
                      className="h-4 w-4 cursor-pointer"
                    />
                    Schools Division Office
                  </label>
                  {schoolId && (
                    <p className="mt-1 text-xs text-green-700">
                      ✓ School selected
                    </p>
                  )}
                  {schoolError && (
                    <p className="text-sm text-red-600 mt-1">{schoolError}</p>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={createClearHandler(
                      handleClearAllFields,
                      hasUnsavedChanges,
                    )}
                    className="cursor-pointer w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 sm:mr-auto sm:w-auto"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="cursor-pointer w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
                  >
                    Continue
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStep2Submit();
                }}
                className="space-y-4"
              >
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-800">
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

                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Key className="text-blue-600" size={18} />
                  Create password <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-2">
                  <input
                    value={password}
                    onChange={(e) => {
                      trackChange(e.target.value, password);
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                      if (confirmPassword && e.target.value === confirmPassword)
                        setConfirmPasswordError("");
                    }}
                    onBlur={handlePasswordBlur}
                    placeholder="Create a password"
                    type={showPassword ? "text" : "password"}
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${passwordError ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}

                <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Key className="text-blue-600" size={18} />
                  Confirm password <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-2">
                  <input
                    value={confirmPassword}
                    onChange={(e) => {
                      trackChange(e.target.value, confirmPassword);
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    onBlur={handleConfirmPasswordBlur}
                    placeholder="Confirm password"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 ${confirmPasswordError ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-sm text-red-600 mt-1">
                    {confirmPasswordError}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={createClearHandler(
                      handleClearAllFields,
                      hasUnsavedChanges,
                    )}
                    disabled={isLoading || isConfirmOpen}
                    className="cursor-pointer w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:mr-auto sm:w-auto"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    disabled={isLoading || isConfirmOpen}
                    className="cursor-pointer w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isConfirmOpen}
                    className="cursor-pointer w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isLoading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Confirmation Modal */}
        {isConfirmOpen && pendingFormData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="border border-blue-200 bg-white rounded-lg shadow-lg p-7 sm:p-8 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Confirm Registration
              </h3>
              <div className="space-y-3 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>First name:</strong> {pendingFormData.firstName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Middle name:</strong>{" "}
                  {pendingFormData.noMiddleName
                    ? "I don't have a middle name"
                    : pendingFormData.middleName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Last name:</strong> {pendingFormData.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {pendingFormData.email}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Birthdate:</strong> {pendingFormData.birthdate}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>School:</strong> {pendingFormData.school}
                </p>
              </div>
              <p className="text-sm text-gray-700 mb-6">
                Please review your information before submitting. Once
                submitted, your registration request will be pending approval.
              </p>
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={handleCancelConfirm}
                  disabled={isLoading}
                  className="cursor-pointer px-3 py-1.5 text-sm bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isLoading}
                  className="cursor-pointer px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Submitting..." : "Confirm & Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
