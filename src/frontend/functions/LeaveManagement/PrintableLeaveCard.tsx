"use client";

import React from "react";
import type { LeaveHistoryRecord } from "./leaveApi";

type PrintableLeaveCardProps = {
  employeeName: string;
  employeeType: "teaching" | "non-teaching";
  rows: LeaveHistoryRecord[];
};

const formatNumber = (value: number) => value.toFixed(2);

const formatDateOnly = (dateStr: string): string => {
  if (!dateStr) return "-";
  const datePart = dateStr.split("T")[0].split(" ")[0];
  if (!datePart) return "-";
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return datePart;
};

const CARD_COLORS = {
  white: "#ffffff",
  black: "#000000",
  headerGray: "#f3f4f6",
  emptyGray: "#374151",
};

const PrintableLeaveCard = React.forwardRef<
  HTMLDivElement,
  PrintableLeaveCardProps
>(function PrintableLeaveCard({ employeeName, employeeType, rows }, ref) {
  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-6xl p-6 text-[11px] print:max-w-none print:p-0"
      style={{
        backgroundColor: CARD_COLORS.white,
        color: CARD_COLORS.black,
        fontFamily: "'Bookman Old Style', Bookman, serif",
      }}
    >
      <div
        className="mb-4 border-b pb-3 text-center font-bold"
        style={{ borderColor: CARD_COLORS.black }}
      >
        <p className="text-sm leading-tight">Republic of the Philippines</p>
        <p className="text-sm font-semibold uppercase tracking-wide">
          Department of Education
        </p>
        <p className="text-sm">Region III</p>
        <p className="text-sm uppercase">
          Division of City of San Jose del Monte
        </p>
        <p className="mt-2 text-base font-bold uppercase tracking-wide">
          Employee Leave Card
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <p>
          <span className="font-semibold">Name of Employee:</span>{" "}
          <span style={{ fontWeight: "bold" }}>{employeeName}</span>
        </p>
        <p>
          <span className="font-semibold">Type:</span>{" "}
          <span style={{ fontWeight: "bold" }}>
            {employeeType === "non-teaching" ? "Non-Teaching" : "Teaching"}
          </span>
        </p>
      </div>

      <div
        className="overflow-x-auto border"
        style={{ borderColor: CARD_COLORS.black }}
      >
        <table className="w-full min-w-full border-collapse">
          <thead>
            <tr
              className="text-[10px] uppercase tracking-wide"
              style={{
                backgroundColor: CARD_COLORS.headerGray,
                fontWeight: "bold",
              }}
            >
              <th
                className="border px-2 py-2 text-left"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Period of Leave
              </th>
              <th
                className="border px-2 py-2 text-left"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Particulars
              </th>
              <th
                className="border px-2 py-2 text-right"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Earned VL
              </th>
              <th
                className="border px-2 py-2 text-right"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Abs With Pay VL
              </th>
              <th
                className="border px-2 py-2 text-right"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Abs Without Pay VL
              </th>
              <th
                className="border px-2 py-2 text-right"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Bal VL
              </th>
              <th
                className="border px-2 py-2 text-right"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Earned SL
              </th>
              <th
                className="border px-2 py-2 text-right"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Abs With Pay SL
              </th>
              <th
                className="border px-2 py-2 text-right"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Abs Without Pay SL
              </th>
              <th
                className="border px-2 py-2 text-right"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Bal SL
              </th>
              <th
                className="border px-2 py-2 text-left"
                style={{ borderColor: CARD_COLORS.black }}
              >
                Date and Action Taken / Evaluation
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td
                    className="border px-2 py-1.5 align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {row.periodOfLeave}
                  </td>
                  <td
                    className="border px-2 py-1.5 align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {row.particulars || "-"}
                  </td>
                  <td
                    className="border px-2 py-1.5 text-right align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatNumber(row.earnedVl)}
                  </td>
                  <td
                    className="border px-2 py-1.5 text-right align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatNumber(row.absWithPayVl)}
                  </td>
                  <td
                    className="border px-2 py-1.5 text-right align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatNumber(row.absWithoutPayVl)}
                  </td>
                  <td
                    className="border px-2 py-1.5 text-right align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatNumber(row.balVl)}
                  </td>
                  <td
                    className="border px-2 py-1.5 text-right align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatNumber(row.earnedSl)}
                  </td>
                  <td
                    className="border px-2 py-1.5 text-right align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatNumber(row.absWithPaySl)}
                  </td>
                  <td
                    className="border px-2 py-1.5 text-right align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatNumber(row.absWithoutPaySl)}
                  </td>
                  <td
                    className="border px-2 py-1.5 text-right align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatNumber(row.balSl)}
                  </td>
                  <td
                    className="border px-2 py-1.5 align-top"
                    style={{ borderColor: CARD_COLORS.black }}
                  >
                    {formatDateOnly(row.dateOfAction)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="border px-2 py-8 text-center"
                  style={{
                    borderColor: CARD_COLORS.black,
                    color: CARD_COLORS.emptyGray,
                  }}
                >
                  No leave entries available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default PrintableLeaveCard;

export function createLeaveCardFileName(employeeName?: string): string {
  const sanitizedName = (employeeName || "Employee")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const displayName = sanitizedName || "Employee";
  return `${displayName} - Leave Card.pdf`;
}

export async function downloadLeaveCardPdf(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const MARGIN_MM = 17.2;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN_MM * 2;
  const imageWidth = contentWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const availableHeight = pageHeight - MARGIN_MM * 2;

  let yOffset = 0;
  let pageNum = 0;

  while (yOffset < imageHeight) {
    if (pageNum > 0) pdf.addPage();
    pdf.addImage(
      imgData,
      "PNG",
      MARGIN_MM,
      MARGIN_MM - yOffset,
      imageWidth,
      imageHeight,
    );
    yOffset += availableHeight;
    pageNum++;
  }

  pdf.save(fileName);
}
