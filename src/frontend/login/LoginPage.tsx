"use client";
// Component: LoginPage
// Filename: LoginPage.tsx
// Purpose: Compose welcome card and modals; manage visibility state for the login landing
import React, { useState } from "react";
import {
  WelcomeCard,
  LoginModal,
  ForgotModal,
  ErrorModal,
  RegistrationModal,
} from "./components";

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState<{ title?: string; desc?: string } | null>(
    null,
  );

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-10">
      <div className="max-w-3xl w-full">
        <main>
          <div className="text-center">
            <WelcomeCard onLogin={() => setShowLogin(true)} />
          </div>
        </main>
      </div>

      <LoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onError={(title: string, desc?: string) => setError({ title, desc })}
        onOpenForgot={() => {
          setShowLogin(false);
          setShowForgot(true);
        }}
        onOpenRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <ForgotModal visible={showForgot} onClose={() => setShowForgot(false)} />
      <RegistrationModal
        visible={showRegister}
        onClose={() => setShowRegister(false)}
      />

      <ErrorModal error={error} onClose={() => setError(null)} />
    </div>
  );
}
