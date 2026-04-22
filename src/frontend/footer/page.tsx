"use client";

import React, { useState } from "react";
import { CircleHelp, Clock3, Mail as MailContact } from "lucide-react";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <footer className="bg-white text-gray-600 px-4 py-2.5 md:px-6 md:py-2 shadow-inner">
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-[11px] sm:text-xs">
          <div className="text-left sm:mr-auto">
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="cursor-pointer font-semibold hover:underline underline-offset-4 hover:text-gray-900 transition text-[11px] sm:text-xs"
            >
              Contact Us
            </button>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-left">
              <span>
                &copy; {currentYear} DepEd Human Resource Information System
              </span>
            </div>
            <div>Developer: Shania Condalor &amp; Alexis Torrefiel</div>
          </div>
        </div>
      </footer>

      {showContactModal && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4"
          onClick={() => setShowContactModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Contact details"
        >
          <div
            className="w-full max-w-md rounded-xl border border-blue-200 bg-white p-3.5 sm:p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <CircleHelp size={18} className="text-blue-700" />
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  Contact Us
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                aria-label="Close contact modal"
                className="cursor-pointer rounded-md border border-gray-200 w-6.5 h-6.5 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-red-500 hover:text-white hover:border-red-500 transition"
              >
                X
              </button>
            </div>

            <p className="mt-1.5 text-[11px] sm:text-xs text-gray-600 leading-relaxed">
              Have a question or need assistance with the Human Resource
              Information System? Reach out to us through any of the channels
              below.
            </p>

            <div className="mt-3 space-y-2.5">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                  Email Address
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <MailContact size={15} className="mt-0.5 text-blue-700" />
                  <div>
                    <p className="text-[11px] sm:text-xs font-semibold text-gray-900 break-all">
                      arthur.francisco@deped.gov.ph
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-gray-600">
                      For inquiries regarding employee records, system access,
                      and HR-related concerns
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                  Office Hours
                </p>
                <div className="mt-1 flex items-start gap-2">
                  <Clock3 size={15} className="mt-0.5 text-amber-700" />
                  <div>
                    <p className="text-[11px] sm:text-xs font-semibold text-gray-900">
                      Monday - Friday, 8:00 AM - 4:00 PM
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-gray-600">
                      Closed on weekends and national holidays
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
