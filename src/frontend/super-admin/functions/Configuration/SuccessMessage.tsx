"use client";

import React from "react";
import ToastMessage from "../../../components/ToastMessage";

type SuccessMessageProps = {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  autoCloseDuration?: number;
  variant?: "success" | "error";
};

export default function SuccessMessage({
  isVisible,
  message,
  onClose,
  autoCloseDuration = 2000,
  variant = "success",
}: SuccessMessageProps) {
  return (
    <ToastMessage
      isVisible={isVisible}
      title={variant === "error" ? "Error" : "Success"}
      message={message}
      variant={variant}
      onClose={onClose}
      autoCloseDuration={autoCloseDuration}
    />
  );
}
