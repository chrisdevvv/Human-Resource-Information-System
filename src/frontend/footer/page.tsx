import React from "react";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-blue-700 text-white px-4 md:px-6 py-3 shadow-inner">
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm">
        <div className="text-left">
          <span>&copy; {currentYear} DepEd Human Resource Information System</span>
        </div>
        <div className="text-left sm:text-right">
          Developer: Shania Condalor &amp; Alexis Torrefiel
        </div>
      </div>
    </footer>
  );
}
