// Component: WelcomeCard
// Filename: WelcomeCard.tsx
// Purpose: Present landing welcome message and a Login button
/* eslint-disable @next/next/no-img-element */
import React from "react";

type Props = { onLogin: () => void; onRegister: () => void };

export default function WelcomeCard({ onLogin, onRegister }: Props) {
  return (
    <div className="border-2 border-blue-700 bg-white text-gray-900 w-full max-w-7xl mx-auto p-16 rounded-xl shadow-2xl text-center">
      <h2 id="welcomeMsg" className="text-3xl font-semibold">
        Welcome to DepEd Human Resource Information System
      </h2>
      <p id="welcomeSub" className="text-gray-500 mt-3 text-lg">
        Access leave records and management tools.
      </p>
      <img
        src="/images/deped-csjdm-logo.png"
        alt="DepEd CSJDM"
        className="mx-auto my-6 max-w-72"
      />
      <button
        id="loginBtn"
        onClick={onLogin}
        className="mt-6 inline-flex items-center px-8 py-3 bg-blue-600 text-white text-lg rounded-md hover:bg-blue-700 transition hover:cursor-pointer"
      >
        Login
      </button>
      <p className="text-center mt-4">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onRegister();
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          No account? Register here
        </a>
      </p>
    </div>
  );
}
