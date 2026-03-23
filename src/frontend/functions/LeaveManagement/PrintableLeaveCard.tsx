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
  stripeGray: "#f3f4f6",
  emptyGray: "#374151",
};

const PAPER_MARGIN_CM = 1.27;
const PAPER_MARGIN_MM = 12.7;
const PAGE_HEIGHT_PX_AT_96_DPI = Math.round((297 / 25.4) * 96);

function LeaveTableHeader() {
  return (
    <thead>
      <tr
        className="text-[10px] uppercase tracking-wide"
        style={{
          backgroundColor: CARD_COLORS.headerGray,
          fontWeight: "bold",
        }}
      >
        <th className="border px-2 py-2 text-left" style={{ borderColor: CARD_COLORS.black }}>
          Period of Leave
        </th>
        <th className="border px-2 py-2 text-left" style={{ borderColor: CARD_COLORS.black }}>
          Particulars
        </th>
        <th className="border px-2 py-2 text-right" style={{ borderColor: CARD_COLORS.black }}>
          Earned VL
        </th>
        <th className="border px-2 py-2 text-right" style={{ borderColor: CARD_COLORS.black }}>
          Abs With Pay VL
        </th>
        <th className="border px-2 py-2 text-right" style={{ borderColor: CARD_COLORS.black }}>
          Abs Without Pay VL
        </th>
        <th className="border px-2 py-2 text-right" style={{ borderColor: CARD_COLORS.black }}>
          Bal VL
        </th>
        <th className="border px-2 py-2 text-right" style={{ borderColor: CARD_COLORS.black }}>
          Earned SL
        </th>
        <th className="border px-2 py-2 text-right" style={{ borderColor: CARD_COLORS.black }}>
          Abs With Pay SL
        </th>
        <th className="border px-2 py-2 text-right" style={{ borderColor: CARD_COLORS.black }}>
          Abs Without Pay SL
        </th>
        <th className="border px-2 py-2 text-right" style={{ borderColor: CARD_COLORS.black }}>
          Bal SL
        </th>
        <th className="border px-2 py-2 text-left" style={{ borderColor: CARD_COLORS.black }}>
          Date and Action Taken / Evaluation
        </th>
      </tr>
    </thead>
  );
}

function LeaveDataRow({
  row,
  index,
  rowRef,
}: {
  row: LeaveHistoryRecord;
  index: number;
  rowRef?: (node: HTMLTableRowElement | null) => void;
}) {
  return (
    <tr
      ref={rowRef}
      style={{
        backgroundColor:
          index % 2 === 1 ? CARD_COLORS.stripeGray : CARD_COLORS.white,
      }}
    >
      <td className="border px-2 py-1.5 align-top" style={{ borderColor: CARD_COLORS.black }}>
        {row.periodOfLeave}
      </td>
      <td className="border px-2 py-1.5 align-top" style={{ borderColor: CARD_COLORS.black }}>
        {row.particulars || "-"}
      </td>
      <td className="border px-2 py-1.5 text-right align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatNumber(row.earnedVl)}
      </td>
      <td className="border px-2 py-1.5 text-right align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatNumber(row.absWithPayVl)}
      </td>
      <td className="border px-2 py-1.5 text-right align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatNumber(row.absWithoutPayVl)}
      </td>
      <td className="border px-2 py-1.5 text-right align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatNumber(row.balVl)}
      </td>
      <td className="border px-2 py-1.5 text-right align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatNumber(row.earnedSl)}
      </td>
      <td className="border px-2 py-1.5 text-right align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatNumber(row.absWithPaySl)}
      </td>
      <td className="border px-2 py-1.5 text-right align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatNumber(row.absWithoutPaySl)}
      </td>
      <td className="border px-2 py-1.5 text-right align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatNumber(row.balSl)}
      </td>
      <td className="border px-2 py-1.5 align-top" style={{ borderColor: CARD_COLORS.black }}>
        {formatDateOnly(row.dateOfAction)}
      </td>
    </tr>
  );
}

function DocumentHeader({
  employeeName,
  employeeType,
}: {
  employeeName: string;
  employeeType: "teaching" | "non-teaching";
}) {
  return (
    <>
      <div
        className="mb-4 border-b pb-3 text-center font-bold"
        style={{ borderColor: CARD_COLORS.black }}
      >
        <p style={{ fontSize: "12pt", lineHeight: 1.2 }}>
          Republic of the Philippines
        </p>
        <p
          className="font-semibold uppercase tracking-wide"
          style={{ fontSize: "12pt", lineHeight: 1.2 }}
        >
          Department of Education
        </p>
        <p style={{ fontSize: "12pt", lineHeight: 1.2 }}>Region III</p>
        <p
          className="uppercase"
          style={{ fontSize: "12pt", lineHeight: 1.2 }}
        >
          Division of City of San Jose del Monte
        </p>
        <p
          className="mt-2 font-bold uppercase tracking-wide"
          style={{ fontSize: "14pt", lineHeight: 1.2 }}
        >
          EMPLOYEE LEAVE CARD
        </p>
      </div>

      <div
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2"
        style={{ fontSize: "10pt" }}
      >
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
    </>
  );
}

function EmptyStateRow() {
  return (
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
  );
}

const PrintableLeaveCard = React.forwardRef<
  HTMLDivElement,
  PrintableLeaveCardProps
>(function PrintableLeaveCard({ employeeName, employeeType, rows }, ref) {
  const firstPageStaticRef = React.useRef<HTMLDivElement | null>(null);
  const nextPageStaticRef = React.useRef<HTMLDivElement | null>(null);
  const rowMeasureRefs = React.useRef<(HTMLTableRowElement | null)[]>([]);
  const [pageChunks, setPageChunks] = React.useState<LeaveHistoryRecord[][]>(
    rows.length ? [rows] : [[]],
  );
  const [isMeasured, setIsMeasured] = React.useState(false);

  React.useLayoutEffect(() => {
    rowMeasureRefs.current = rowMeasureRefs.current.slice(0, rows.length);
  }, [rows]);

  React.useLayoutEffect(() => {
    if (!firstPageStaticRef.current || !nextPageStaticRef.current) return;

    if (rows.length === 0) {
      setPageChunks([[]]);
      setIsMeasured(true);
      return;
    }

    const firstStaticHeight = firstPageStaticRef.current.offsetHeight;
    const nextStaticHeight = nextPageStaticRef.current.offsetHeight;

    const firstAvailable = Math.max(PAGE_HEIGHT_PX_AT_96_DPI - firstStaticHeight, 100);
    const nextAvailable = Math.max(PAGE_HEIGHT_PX_AT_96_DPI - nextStaticHeight, 100);

    const rowHeights = rows.map((_, index) => {
      const rowEl = rowMeasureRefs.current[index];
      return rowEl?.offsetHeight ?? 0;
    });

    if (rowHeights.some((height) => height === 0)) return;

    const chunks: LeaveHistoryRecord[][] = [];
    let currentChunk: LeaveHistoryRecord[] = [];
    let currentHeight = 0;
    let availableHeight = firstAvailable;

    rows.forEach((row, index) => {
      const rowHeight = Math.max(rowHeights[index], 1);

      if (currentChunk.length > 0 && currentHeight + rowHeight > availableHeight) {
        chunks.push(currentChunk);
        currentChunk = [row];
        currentHeight = rowHeight;
        availableHeight = nextAvailable;
      } else {
        currentChunk.push(row);
        currentHeight += rowHeight;
      }
    });

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    setPageChunks(chunks.length ? chunks : [[]]);
    setIsMeasured(true);
  }, [rows, employeeName, employeeType]);

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: ${PAPER_MARGIN_CM}cm;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }

          .leave-card-root {
            width: auto !important;
            max-width: none !important;
          }

          .leave-card-page {
            break-after: page;
            page-break-after: always;
          }

          .leave-card-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          table {
            width: 100% !important;
            border-collapse: collapse;
          }

          thead {
            display: table-header-group;
          }

          tr, td, th {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-100000px",
          top: 0,
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
          width: "210mm",
          backgroundColor: CARD_COLORS.white,
          color: CARD_COLORS.black,
          fontFamily: "'Bookman Old Style', Bookman, serif",
        }}
      >
        <div
          ref={firstPageStaticRef}
          style={{
            width: "210mm",
            boxSizing: "border-box",
            backgroundColor: CARD_COLORS.white,
          }}
        >
          <DocumentHeader employeeName={employeeName} employeeType={employeeType} />
          <div className="border" style={{ borderColor: CARD_COLORS.black }}>
            <table className="w-full border-collapse">
              <LeaveTableHeader />
              <tbody />
            </table>
          </div>
        </div>

        <div
          ref={nextPageStaticRef}
          style={{
            width: "210mm",
            boxSizing: "border-box",
            backgroundColor: CARD_COLORS.white,
          }}
        >
          <div className="border" style={{ borderColor: CARD_COLORS.black }}>
            <table className="w-full border-collapse">
              <LeaveTableHeader />
              <tbody />
            </table>
          </div>
        </div>

        <div
          style={{
            width: "210mm",
            boxSizing: "border-box",
            backgroundColor: CARD_COLORS.white,
          }}
        >
          <div className="border" style={{ borderColor: CARD_COLORS.black }}>
            <table className="w-full border-collapse">
              <LeaveTableHeader />
              <tbody style={{ fontSize: "11px" }}>
                {rows.map((row, index) => (
                  <LeaveDataRow
                    key={`measure-${row.id}-${index}`}
                    row={row}
                    index={index}
                    rowRef={(node) => {
                      rowMeasureRefs.current[index] = node;
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        className="leave-card-root mx-auto w-full text-[9pt] print:max-w-none"
        style={{
          width: "210mm",
          backgroundColor: CARD_COLORS.white,
          color: CARD_COLORS.black,
          fontFamily: "'Bookman Old Style', Bookman, serif",
          visibility: isMeasured ? "visible" : "hidden",
        }}
      >
        {pageChunks.map((pageRows, pageIndex) => {
          const isFirstPage = pageIndex === 0;

          return (
            <div
              key={`leave-card-page-${pageIndex}`}
              data-leave-card-page="true"
              className="leave-card-page"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: 0,
                boxSizing: "border-box",
                backgroundColor: CARD_COLORS.white,
              }}
            >
              {isFirstPage && (
                <DocumentHeader
                  employeeName={employeeName}
                  employeeType={employeeType}
                />
              )}

              <div className="border" style={{ borderColor: CARD_COLORS.black }}>
                <table className="w-full border-collapse">
                  <LeaveTableHeader />
                  <tbody style={{ fontSize: "11px" }}>
                    {pageRows.length > 0 ? (
                      pageRows.map((row, index) => (
                        <LeaveDataRow
                          key={`${row.id}-${pageIndex}-${index}`}
                          row={row}
                          index={index}
                        />
                      ))
                    ) : (
                      <EmptyStateRow />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </>
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

  const pdf = new jsPDF("p", "mm", "a4");
  const marginMm = PAPER_MARGIN_MM;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = pageHeight - marginMm * 2;

  const pageElements = Array.from(
    element.querySelectorAll<HTMLElement>("[data-leave-card-page='true']"),
  );

  if (pageElements.length === 0) {
    throw new Error("No printable leave card pages found.");
  }

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imgData,
      "PNG",
      marginMm,
      marginMm,
      contentWidth,
      contentHeight,
    );
  }

  pdf.save(fileName);
}