"use client";

"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  visible: boolean;
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null;
  onClose: () => void;
};

function roleToPath(role?: string) {
  if (!role) return "/";
  const v = role.toLowerCase();
  if (v.includes("super")) return "/super-admin";
  if (v.includes("admin")) return "/admin";
  if (v.includes("data") || v.includes("encoder")) return "/data-encoder";
  return "/";
}

export default function LoginSuccessModal({ visible, user, onClose }: Props) {
  const router = useRouter();
  const REDIRECT_SECONDS = 3;
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!visible) return;
    hasRedirected.current = false;
    setCountdown(REDIRECT_SECONDS);

    const intervalId = window.setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || countdown !== 0 || hasRedirected.current) return;
    hasRedirected.current = true;
    onClose();
    router.push(roleToPath(user?.role));
  }, [countdown, visible, onClose, router, user?.role]);

  if (!visible) return null;

  const handleContinue = () => {
    hasRedirected.current = true;
    onClose();
    router.push(roleToPath(user?.role));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      aria-hidden={!visible}
    >
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border-2 border-green-500 bg-white p-6 shadow-lg sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer hover:bg-red-500 hover:text-white absolute top-3 right-3 p-1 rounded text-gray-500 transition"
          aria-label="Close success modal"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-3 text-green-600">
            <CheckCircle2 size={46} />
          </div>
          <h3 className="text-xl font-semibold text-green-700">
            Login Successful
          </h3>
          <p className="mt-4 text-sm text-gray-600">
            Redirecting in {countdown} second{countdown === 1 ? "" : "s"}...
          </p>

          <button
            type="button"
            onClick={handleContinue}
            className="cursor-pointer mt-3 px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
