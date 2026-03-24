"use client";

import React from "react";
import type { LeaveHistoryRecord } from "./leaveApi";

type PrintableLeaveCardProps = {
  employeeName: string;
  employeeType: "teaching" | "non-teaching";
  rows: LeaveHistoryRecord[];
};

type FormattedLeaveHistoryRecord = LeaveHistoryRecord & {
  periodOfLeaveDisplay: string;
  particularsDisplay: string;
  earnedVlDisplay: string;
  absWithPayVlDisplay: string;
  absWithoutPayVlDisplay: string;
  balVlDisplay: string;
  earnedSlDisplay: string;
  absWithPaySlDisplay: string;
  absWithoutPaySlDisplay: string;
  balSlDisplay: string;
  dateOfActionDisplay: string;
};

const formatNumber = (value: number | null | undefined): string =>
  Number(value ?? 0).toFixed(2);

const formatDateOnly = (dateStr: string): string => {
  if (!dateStr) return "-";

  const datePart = dateStr.split("T")[0].split(" ")[0];
  if (!datePart) return "-";

  const parts = datePart.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const d = new Date(Number(year), Number(month) - 1, Number(day));

    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
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

const PAPER_MARGIN_CM = 1;
const PAPER_MARGIN_MM = 10;
const PAGE_HEIGHT_PX_AT_96_DPI = Math.round((297 / 25.4) * 96);
const PAGE_WIDTH_MM = "210mm";
const PAGE_HEIGHT_MM = "297mm";

const LeaveTableHeader = React.memo(function LeaveTableHeader() {
  return (
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
          style={{ borderColor: CARD_COLORS.black, width: "100px" }}
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
  );
});

const LeaveDataRow = React.memo(function LeaveDataRow({
  row,
  index,
  rowRef,
}: {
  row: FormattedLeaveHistoryRecord;
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
      <td
        className="border px-1.5 py-0.5 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.periodOfLeaveDisplay}
      </td>
      <td
        className="border px-1.5 py-1 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.particularsDisplay}
      </td>
      <td
        className="border px-1.5 py-0.5 text-right align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.earnedVlDisplay}
      </td>
      <td
        className="border px-1.5 py-1 text-right align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.absWithPayVlDisplay}
      </td>
      <td
        className="border px-1.5 py-1 text-right align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.absWithoutPayVlDisplay}
      </td>
      <td
        className="border px-1.5 py-1 text-right align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.balVlDisplay}
      </td>
      <td
        className="border px-1.5 py-1 text-right align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.earnedSlDisplay}
      </td>
      <td
        className="border px-1.5 py-1 text-right align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.absWithPaySlDisplay}
      </td>
      <td
        className="border px-1.5 py-1 text-right align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.absWithoutPaySlDisplay}
      </td>
      <td
        className="border px-1.5 py-1 text-right align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.balSlDisplay}
      </td>
      <td
        className="border px-1.5 py-1 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.dateOfActionDisplay}
      </td>
    </tr>
  );
});

const DocumentHeader = React.memo(function DocumentHeader({
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
        <p className="uppercase" style={{ fontSize: "12pt", lineHeight: 1.2 }}>
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
});

const EmptyStateRow = React.memo(function EmptyStateRow() {
  return (
    <tr>
      <td
        colSpan={11}
        className="border px-1.5 text-center"
        style={{
          borderColor: CARD_COLORS.black,
          color: CARD_COLORS.emptyGray,
          paddingTop: "calc(2rem - 2px)",
          paddingBottom: "calc(2rem - 2px)",
        }}
      >
        No leave entries available.
      </td>
    </tr>
  );
});

const PrintableLeaveCard = React.forwardRef<
  HTMLDivElement,
  PrintableLeaveCardProps
>(function PrintableLeaveCard({ employeeName, employeeType, rows }, ref) {
  const firstPageStaticRef = React.useRef<HTMLDivElement | null>(null);
  const nextPageStaticRef = React.useRef<HTMLDivElement | null>(null);
  const rowMeasureRefs = React.useRef<(HTMLTableRowElement | null)[]>([]);
  const [pageChunks, setPageChunks] = React.useState<
    FormattedLeaveHistoryRecord[][]
  >([]);
  const [isMeasured, setIsMeasured] = React.useState(false);

  const formattedRows = React.useMemo<FormattedLeaveHistoryRecord[]>(() => {
    return rows.map((row) => ({
      ...row,
      periodOfLeaveDisplay: row.periodOfLeave || "-",
      particularsDisplay: row.particulars || "-",
      earnedVlDisplay: formatNumber(row.earnedVl),
      absWithPayVlDisplay: formatNumber(row.absWithPayVl),
      absWithoutPayVlDisplay: formatNumber(row.absWithoutPayVl),
      balVlDisplay: formatNumber(row.balVl),
      earnedSlDisplay: formatNumber(row.earnedSl),
      absWithPaySlDisplay: formatNumber(row.absWithPaySl),
      absWithoutPaySlDisplay: formatNumber(row.absWithoutPaySl),
      balSlDisplay: formatNumber(row.balSl),
      dateOfActionDisplay: formatDateOnly(row.dateOfAction),
    }));
  }, [rows]);

  React.useLayoutEffect(() => {
    rowMeasureRefs.current = rowMeasureRefs.current.slice(
      0,
      formattedRows.length,
    );
  }, [formattedRows]);

  React.useLayoutEffect(() => {
    setIsMeasured(false);

    if (!firstPageStaticRef.current || !nextPageStaticRef.current) {
      return;
    }

    if (formattedRows.length === 0) {
      setPageChunks([[]]);
      setIsMeasured(true);
      return;
    }

    const measure = () => {
      if (!firstPageStaticRef.current || !nextPageStaticRef.current) {
        return;
      }

      const firstStaticHeight = firstPageStaticRef.current.offsetHeight;
      const nextStaticHeight = nextPageStaticRef.current.offsetHeight;

      const firstAvailable = Math.max(
        PAGE_HEIGHT_PX_AT_96_DPI - firstStaticHeight,
        100,
      );
      const nextAvailable = Math.max(
        PAGE_HEIGHT_PX_AT_96_DPI - nextStaticHeight,
        100,
      );

      const rowHeights = formattedRows.map((_, index) => {
        const rowEl = rowMeasureRefs.current[index];
        return rowEl?.offsetHeight ?? 0;
      });

      if (rowHeights.some((height) => height <= 0)) {
        requestAnimationFrame(measure);
        return;
      }

      const chunks: FormattedLeaveHistoryRecord[][] = [];
      let currentChunk: FormattedLeaveHistoryRecord[] = [];
      let currentHeight = 0;
      let availableHeight = firstAvailable;

      formattedRows.forEach((row, index) => {
        const rowHeight = Math.max(rowHeights[index], 1);

        if (
          currentChunk.length > 0 &&
          currentHeight + rowHeight > availableHeight
        ) {
          chunks.push(currentChunk);
          currentChunk = [row];
          currentHeight = rowHeight;
          availableHeight = nextAvailable;
          return;
        }

        currentChunk.push(row);
        currentHeight += rowHeight;
      });

      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      setPageChunks(chunks.length > 0 ? chunks : [[]]);
      setIsMeasured(true);
    };

    const rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, [formattedRows, employeeName, employeeType]);

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
          width: PAGE_WIDTH_MM,
          backgroundColor: CARD_COLORS.white,
          color: CARD_COLORS.black,
          fontFamily: "'Bookman Old Style', Bookman, serif",
        }}
      >
        <div
          ref={firstPageStaticRef}
          style={{
            width: PAGE_WIDTH_MM,
            boxSizing: "border-box",
            backgroundColor: CARD_COLORS.white,
          }}
        >
          <DocumentHeader
            employeeName={employeeName}
            employeeType={employeeType}
          />
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
            width: PAGE_WIDTH_MM,
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
            width: PAGE_WIDTH_MM,
            boxSizing: "border-box",
            backgroundColor: CARD_COLORS.white,
          }}
        >
          <div className="border" style={{ borderColor: CARD_COLORS.black }}>
            <table className="w-full border-collapse">
              <LeaveTableHeader />
              <tbody style={{ fontSize: "11px" }}>
                {formattedRows.map((row, index) => (
                  <LeaveDataRow
                    key={`measure-${row.id ?? index}-${index}`}
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
          width: PAGE_WIDTH_MM,
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
                width: PAGE_WIDTH_MM,
                minHeight: PAGE_HEIGHT_MM,
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

              <div
                className="border"
                style={{ borderColor: CARD_COLORS.black }}
              >
                <table className="w-full border-collapse">
                  <LeaveTableHeader />
                  <tbody style={{ fontSize: "11px" }}>
                    {pageRows.length > 0 ? (
                      pageRows.map((row, index) => (
                        <LeaveDataRow
                          key={`${row.id ?? index}-${pageIndex}-${index}`}
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
      scale: 1.25,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      removeContainer: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.86);

    if (i > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imgData,
      "JPEG",
      marginMm,
      marginMm,
      contentWidth,
      contentHeight,
    );

    canvas.width = 0;
    canvas.height = 0;
  }

  pdf.save(fileName);
}
