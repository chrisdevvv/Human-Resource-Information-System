// Component: WelcomeCard
// Filename: WelcomeCard.tsx
// Purpose: Present landing welcome message and a Login button
import React from "react";

type Props = { onLogin: () => void };

export default function WelcomeCard({ onLogin }: Props) {
  return (
    <div className="bg-white text-gray-900 w-full max-w-4xl mx-auto p-12 rounded-xl shadow-2xl text-center">
      <h2 id="welcomeMsg" className="text-xl font-semibold">
        Welcome to Employee Leave Management System
      </h2>
      <p id="welcomeSub" className="text-gray-500 mt-2">
        Access leave records and management tools.
      </p>
      <img
        src="/images/deped-csjdm-logo.png"
        alt="DepEd CSJDM"
        className="mx-auto my-4 max-w-36"
      />
      <button
        id="loginBtn"
        onClick={onLogin}
        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition hover:cursor-pointer"
      >
        Login
      </button>
    </div>
  );
}
