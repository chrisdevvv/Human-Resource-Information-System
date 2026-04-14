"use client";

import React from "react";
import ToastMessage from "../../../components/ToastMessage";

type ChangesToastProps = {
  message: string;
  type: "success" | "error";
};

export default function ChangesToast({ message, type }: ChangesToastProps) {
  return (
    <ToastMessage
      isVisible
      message={message}
      title={type === "success" ? "Success" : "Error"}
      variant={type}
      position="top-right"
      showCloseButton={false}
      className="pointer-events-none"
    />
  );
}
