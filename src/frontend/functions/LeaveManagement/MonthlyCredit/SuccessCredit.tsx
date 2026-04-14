"use client";

import React from "react";
import ToastMessage from "../../../components/ToastMessage";

type SuccessCreditProps = {
  isOpen: boolean;
  variant: "success" | "failed";
  title: string;
  message: string;
  autoCloseDuration?: number;
  onClose: () => void;
};

export default function SuccessCredit({
  isOpen,
  variant,
  title,
  message,
  autoCloseDuration = 2500,
  onClose,
}: SuccessCreditProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ToastMessage
      isVisible={isOpen}
      message={message}
      title={title}
      variant={variant === "success" ? "success" : "error"}
      onClose={onClose}
      autoCloseDuration={autoCloseDuration}
    />
  );
}
