"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { Building2, Key, Mail, User } from "../assets/icons";
import RegistrationSuccessModal from "./RegistrationSuccessModal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type StepId = 1 | 2;

export default function RegistrationMobile() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [step, setStep] = useState<StepId>(1);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [middleNameError, setMiddleNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [birthdateError, setBirthdateError] = useState("");
  const [schoolError, setSchoolError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function validateEmail(value: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  }

  function validateName(name: string) {
    const re = /^[a-zA-Z\s\-]{2,}$/;
    return re.test(name.trim());
  }

  function startsWithCapital(name: string) {
    return /^[A-Z]/.test(name.trim());
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
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return {
        valid: false,
        message: "Password must contain a special character",
      };
    }
    return { valid: true, message: "" };
  }

  function resetForm() {
    setStep(1);
    setFirstName("");
    setMiddleName("");
    setNoMiddleName(false);
    setLastName("");
    setEmail("");
    setBirthdate("");
    setSchool("");
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

    if (!school.trim()) {
      setSchoolError("School is required");
      hasError = true;
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

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          middle_name: noMiddleName ? null : middleName,
          no_middle_name: noMiddleName,
          last_name: lastName,
          email,
          birthdate,
          password,
          school_name: school,
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-50 bg-blue-700 text-white px-4 py-3 border-b border-blue-800">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Registration</h1>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="p-2 rounded-md hover:bg-blue-800 transition"
            aria-label="Toggle registration menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${step === 1 ? "bg-blue-600 text-white" : "text-blue-800 hover:bg-blue-100"}`}
          >
            Step 1: Basic Information
          </button>
          <button
            type="button"
            onClick={() => {
              setStep(2);
              setMenuOpen(false);
            }}
            className={`mt-2 w-full text-left px-3 py-2 rounded-md text-sm font-medium ${step === 2 ? "bg-blue-600 text-white" : "text-blue-800 hover:bg-blue-100"}`}
          >
            Step 2: Password Setup
          </button>
        </div>
      )}

      <main className="p-4">
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-4">
          {submitted ? (
            <RegistrationSuccessModal onClose={resetForm} />
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {step === 1 ? (
                <>
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
                    placeholder="First name"
                    className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${firstNameError ? "border-red-500" : ""}`}
                  />
                  {firstNameError && (
                    <p className="text-sm text-red-600 mt-1">
                      {firstNameError}
                    </p>
                  )}

                  <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                    <User className="text-blue-600" size={18} />
                    Middle name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={middleName}
                    onChange={(e) => {
                      setMiddleName(e.target.value);
                      if (middleNameError) setMiddleNameError("");
                    }}
                    disabled={noMiddleName}
                    placeholder={
                      noMiddleName ? "No middle name provided" : "Middle name"
                    }
                    className={`mt-2 w-full px-3 py-2 border rounded-md placeholder:text-gray-500 ${
                      noMiddleName
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-gray-700"
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

                  <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                    <User className="text-blue-600" size={18} />
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (lastNameError) setLastNameError("");
                    }}
                    placeholder="Last name"
                    className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${lastNameError ? "border-red-500" : ""}`}
                  />
                  {lastNameError && (
                    <p className="text-sm text-red-600 mt-1">{lastNameError}</p>
                  )}

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
                    placeholder="name@deped.gov.ph"
                    className={`mt-1 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${emailError ? "border-red-500" : ""}`}
                  />
                  {emailError && (
                    <p className="text-sm text-red-600 mt-1">{emailError}</p>
                  )}

                  <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                    <User className="text-blue-600" size={18} />
                    Birthdate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => {
                      setBirthdate(e.target.value);
                      if (birthdateError) setBirthdateError("");
                    }}
                    max={new Date().toISOString().slice(0, 10)}
                    className={`mt-1 w-full text-gray-700 px-3 py-2 border rounded-md ${birthdateError ? "border-red-500" : ""}`}
                  />
                  {birthdateError && (
                    <p className="text-sm text-red-600 mt-1">
                      {birthdateError}
                    </p>
                  )}

                  <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                    <Building2 className="text-blue-600" size={18} />
                    School <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={school}
                    onChange={(e) => {
                      setSchool(e.target.value);
                      if (schoolError) setSchoolError("");
                    }}
                    placeholder="Enter school name"
                    className={`mt-2 w-full text-gray-700 px-3 py-2 border rounded-md placeholder:text-gray-500 ${schoolError ? "border-red-500" : ""}`}
                  />
                  {schoolError && (
                    <p className="text-sm text-red-600 mt-1">{schoolError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleStep1Submit}
                    className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Continue
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                    <p className="font-semibold mb-1">Password requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 8 characters long</li>
                      <li>Contains uppercase and lowercase letters</li>
                      <li>Contains at least one number</li>
                      <li>Contains at least one special character</li>
                    </ul>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <Key className="text-blue-600" size={18} />
                    Create password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-2">
                    <input
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                        if (
                          confirmPassword &&
                          e.target.value === confirmPassword
                        ) {
                          setConfirmPasswordError("");
                        }
                      }}
                      placeholder="Create a password"
                      type={showPassword ? "text" : "password"}
                      className={`w-full text-gray-700 px-3 py-2 pr-10 border rounded-md placeholder:text-gray-500 ${passwordError ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                  )}

                  <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                    <Key className="text-blue-600" size={18} />
                    Confirm password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-2">
                    <input
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError("");
                      }}
                      placeholder="Confirm password"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`w-full text-gray-700 px-3 py-2 pr-10 border rounded-md placeholder:text-gray-500 ${confirmPasswordError ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {confirmPasswordError && (
                    <p className="text-sm text-red-600 mt-1">
                      {confirmPasswordError}
                    </p>
                  )}

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleStep2Submit}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isLoading ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
