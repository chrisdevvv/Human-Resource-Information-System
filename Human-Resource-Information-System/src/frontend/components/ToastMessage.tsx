"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastVariant = "success" | "error";
type ToastPosition = "bottom-right" | "top-right";

type ToastMessageProps = {
  isVisible: boolean;
  message: React.ReactNode;
  title?: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  onClose?: () => void;
  autoCloseDuration?: number;
  showCloseButton?: boolean;
  className?: string;
};

const getPositionClassName = (position: ToastPosition) =>
  position === "top-right"
    ? "fixed right-2 sm:right-4 top-2 sm:top-4 z-[60] w-[min(360px,calc(100vw-2rem))]"
    : "fixed bottom-2 sm:bottom-5 right-2 sm:right-5 z-[50] w-[min(360px,calc(100vw-2rem))]";

const getMotionClassName = (position: ToastPosition, isShown: boolean) => {
  const base =
    "transform-gpu transition-all duration-300 ease-out will-change-transform";

  if (position === "top-right") {
    return isShown
      ? `${base} translate-y-0 opacity-100`
      : `${base} -translate-y-3 opacity-0`;
  }

  return isShown
    ? `${base} translate-y-0 opacity-100`
    : `${base} translate-y-3 opacity-0`;
};

export default function ToastMessage({
  isVisible,
  message,
  title,
  variant = "success",
  position = "bottom-right",
  onClose,
  autoCloseDuration = 2000,
  showCloseButton = true,
  className = "",
}: ToastMessageProps) {
  const [isMounted, setIsMounted] = useState(isVisible);
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      const rafId = window.requestAnimationFrame(() => {
        setIsShown(true);
      });

      return () => window.cancelAnimationFrame(rafId);
    }

    setIsShown(false);
    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !onClose || autoCloseDuration <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, autoCloseDuration);

    return () => window.clearTimeout(timer);
  }, [autoCloseDuration, isVisible, onClose]);

  if (!isMounted) {
    return null;
  }

  const isError = variant === "error";
  const iconClassName = isError ? "text-red-600" : "text-emerald-600";
  const borderClassName = isError ? "border-red-200" : "border-blue-200";
  const titleClassName = isError ? "text-red-900" : "text-gray-900";
  const messageClassName = isError ? "text-red-700" : "text-gray-600";

  return (
    <div
      className={`${getPositionClassName(position)} ${className}`.trim()}
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      <div
        className={`${getMotionClassName(position, isShown)} rounded-xl border bg-white p-4 shadow-lg ${borderClassName}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isError ? (
              <XCircle size={18} className={iconClassName} />
            ) : (
              <CheckCircle2 size={18} className={iconClassName} />
            )}
          </div>

          <div className="flex-1">
            {title ? (
              <p className={`text-sm font-semibold ${titleClassName}`}>
                {title}
              </p>
            ) : null}
            <p className={`${title ? "mt-1" : ""} text-sm ${messageClassName}`}>
              {message}
            </p>
          </div>

          {showCloseButton && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-gray-400 transition hover:text-gray-700"
              aria-label="Close toast"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
