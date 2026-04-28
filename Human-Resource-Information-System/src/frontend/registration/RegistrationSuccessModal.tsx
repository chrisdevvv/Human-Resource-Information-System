import React from "react";
import { CheckCircle2 } from "lucide-react";

type Props = {
  onClose: () => void;
};

export default function RegistrationSuccessModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 px-4"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-blue-200 bg-white p-4 text-center shadow-2xl">
        <div className="mb-2 flex justify-center">
          <CheckCircle2
            className="h-12 w-12 text-green-600"
            strokeWidth={1.8}
          />
        </div>

        <h3 className="mb-1.5 text-base font-semibold text-gray-800">
          Registration Successful!
        </h3>

        <p className="mb-4 text-xs leading-5 text-gray-600">
          Your registration has been submitted successfully. Your account is
          currently pending approval. Please wait for an administrator to review
          and activate your account. You will be notified once your account has
          been approved.
        </p>

        <button
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:cursor-pointer hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
