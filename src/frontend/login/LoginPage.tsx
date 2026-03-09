"use client";
// Component: LoginPage
// Filename: LoginPage.tsx
// Purpose: Compose welcome card and modals; manage visibility state for the login landing
import React, { useState, useEffect } from "react";
import {
  WelcomeCard,
  LoginModal,
  LoginSuccessModal,
  ForgotModal,
  ErrorModal,
  RegistrationModal,
} from "./components";

const backgroundImages = [
  "/images/deped-bg.jpg",
  "/images/deped-bg-2.jpg",
  "/images/deped-bg-3.jpg",
];

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{
    username?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [error, setError] = useState<{ title?: string; desc?: string } | null>(
    null,
  );
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex(
        (prevIndex) => (prevIndex + 1) % backgroundImages.length,
      );
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-10 relative overflow-hidden">
      {/* Background images with fade transition */}
      {backgroundImages.map((image, index) => (
        <div
          key={image}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: currentBgIndex === index ? 1 : 0,
            zIndex: 0,
          }}
        />
      ))}

      {/* Blur and grey overlay */}
      <div className="absolute inset-0 bg-gray-600/50 backdrop-blur-sm z-1"></div>

      <div className="max-w-3xl w-full relative z-10">
        <main>
          <div className="text-center">
            <WelcomeCard
              onLogin={() => setShowLogin(true)}
              onRegister={() => setShowRegister(true)}
            />
          </div>
        </main>
      </div>

      <LoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={(user) => {
          setLoggedInUser(user);
          setShowLoginSuccess(true);
        }}
        onError={(title: string, desc?: string) => setError({ title, desc })}
        onOpenForgot={() => {
          setShowLogin(false);
          setShowForgot(true);
        }}
      />

      <LoginSuccessModal
        visible={showLoginSuccess}
        user={loggedInUser}
        onClose={() => setShowLoginSuccess(false)}
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
