import React from "react";

type Props = {
  onClose: () => void;
};

export default function RegistrationSuccessModal({ onClose }: Props) {
  return (
    <div className="text-center py-6">
      <div className="text-green-600 text-5xl mb-4">✓</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Registration Successful!
      </h3>
      <p className="text-gray-600 mb-6">
        Your registration has been submitted successfully. Your account is
        currently pending for approval. Please wait for an administrator to
        review and activate your account. You will be notified once your account
        has been approved.
      </p>
      <button
        onClick={onClose}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition hover:cursor-pointer"
      >
        Close
      </button>
    </div>
  );
}
