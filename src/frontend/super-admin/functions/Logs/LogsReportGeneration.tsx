"use client";

import React from "react";

export type LogsReportRecord = {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  schoolName: string;
  action: string;
  details: string;
  createdAt: string;
};

type LogsReportGenerationProps = {
  rows: LogsReportRecord[];
  generatedBy?: string;
  dateFrom?: string;
  dateTo?: string;
};

type FormattedLogsReportRecord = LogsReportRecord & {
  dateTimeDisplay: string;
  fullNameDisplay: string;
  actionDisplay: string;
  detailsDisplay: string;
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

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "-";

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }

  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatDateOnly = (dateStr?: string): string => {
  if (!dateStr) return "All";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const LogsTableHeader = React.memo(function LogsTableHeader() {
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
          style={{ borderColor: CARD_COLORS.black, width: "108px" }}
        >
          Date and Time
        </th>
        <th
          className="border px-2 py-2 text-left"
          style={{ borderColor: CARD_COLORS.black, width: "120px" }}
        >
          User
        </th>
        <th
          className="border px-2 py-2 text-left"
          style={{ borderColor: CARD_COLORS.black, width: "85px" }}
        >
          Role
        </th>
        <th
          className="border px-2 py-2 text-left"
          style={{ borderColor: CARD_COLORS.black, width: "120px" }}
        >
          School
        </th>
        <th
          className="border px-2 py-2 text-left"
          style={{ borderColor: CARD_COLORS.black, width: "120px" }}
        >
          Action
        </th>
        <th
          className="border px-2 py-2 text-left"
          style={{ borderColor: CARD_COLORS.black }}
        >
          Details
        </th>
      </tr>
    </thead>
  );
});

const LogsDataRow = React.memo(function LogsDataRow({
  row,
  index,
  rowRef,
}: {
  row: FormattedLogsReportRecord;
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
        className="border px-1.5 py-1 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.dateTimeDisplay}
      </td>
      <td
        className="border px-1.5 py-1 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.fullNameDisplay}
      </td>
      <td
        className="border px-1.5 py-1 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.role || "-"}
      </td>
      <td
        className="border px-1.5 py-1 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.schoolName || "-"}
      </td>
      <td
        className="border px-1.5 py-1 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.actionDisplay}
      </td>
      <td
        className="border px-1.5 py-1 align-top"
        style={{ borderColor: CARD_COLORS.black }}
      >
        {row.detailsDisplay}
      </td>
    </tr>
  );
});

const DocumentHeader = React.memo(function DocumentHeader({
  generatedBy,
  dateFrom,
  dateTo,
  totalRows,
}: {
  generatedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  totalRows: number;
}) {
  const generatedAt = new Date().toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

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
          Activity Logs Report
        </p>
      </div>

      <div
        className="mb-4 grid grid-cols-1 gap-1 sm:grid-cols-2"
        style={{ fontSize: "10pt" }}
      >
        <p>
          <span className="font-semibold">Generated At:</span> {generatedAt}
        </p>
        <p>
          <span className="font-semibold">Generated By:</span>{" "}
          {generatedBy?.trim() || "System"}
        </p>
        <p>
          <span className="font-semibold">Date Range:</span>{" "}
          {formatDateOnly(dateFrom)} to {formatDateOnly(dateTo)}
        </p>
        <p>
          <span className="font-semibold">Total Records:</span> {totalRows}
        </p>
      </div>
    </>
  );
});

const EmptyStateRow = React.memo(function EmptyStateRow() {
  return (
    <tr>
      <td
        colSpan={6}
        className="border px-1.5 text-center"
        style={{
          borderColor: CARD_COLORS.black,
          color: CARD_COLORS.emptyGray,
          paddingTop: "calc(2rem - 2px)",
          paddingBottom: "calc(2rem - 2px)",
        }}
      >
        No logs available.
      </td>
    </tr>
  );
});

const LogsReportGeneration = React.forwardRef<
  HTMLDivElement,
  LogsReportGenerationProps
>(function LogsReportGeneration({ rows, generatedBy, dateFrom, dateTo }, ref) {
  const firstPageStaticRef = React.useRef<HTMLDivElement | null>(null);
  const nextPageStaticRef = React.useRef<HTMLDivElement | null>(null);
  const rowMeasureRefs = React.useRef<(HTMLTableRowElement | null)[]>([]);
  const [pageChunks, setPageChunks] = React.useState<
    FormattedLogsReportRecord[][]
  >([]);
  const [isMeasured, setIsMeasured] = React.useState(false);

  const formattedRows = React.useMemo<FormattedLogsReportRecord[]>(() => {
    return rows.map((row) => ({
      ...row,
      dateTimeDisplay: formatDateTime(row.createdAt),
      fullNameDisplay:
        `${row.firstName || ""} ${row.lastName || ""}`.trim() || "Unknown",
      actionDisplay: row.action || "-",
      detailsDisplay: row.details || "-",
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

      const chunks: FormattedLogsReportRecord[][] = [];
      let currentChunk: FormattedLogsReportRecord[] = [];
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
  }, [formattedRows, generatedBy, dateFrom, dateTo]);

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

					.logs-report-root {
						width: auto !important;
						max-width: none !important;
					}

					.logs-report-page {
						break-after: page;
						page-break-after: always;
					}

					.logs-report-page:last-child {
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
            generatedBy={generatedBy}
            dateFrom={dateFrom}
            dateTo={dateTo}
            totalRows={formattedRows.length}
          />
          <div className="border" style={{ borderColor: CARD_COLORS.black }}>
            <table className="w-full border-collapse">
              <LogsTableHeader />
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
              <LogsTableHeader />
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
              <LogsTableHeader />
              <tbody style={{ fontSize: "10px" }}>
                {formattedRows.map((row, index) => (
                  <LogsDataRow
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
        className="logs-report-root mx-auto w-full text-[9pt] print:max-w-none"
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
              key={`logs-report-page-${pageIndex}`}
              data-logs-report-page="true"
              className="logs-report-page"
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
                  generatedBy={generatedBy}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  totalRows={formattedRows.length}
                />
              )}

              <div
                className="border"
                style={{ borderColor: CARD_COLORS.black }}
              >
                <table className="w-full border-collapse">
                  <LogsTableHeader />
                  <tbody style={{ fontSize: "10px" }}>
                    {pageRows.length > 0 ? (
                      pageRows.map((row, index) => (
                        <LogsDataRow
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

export default LogsReportGeneration;

export function createLogsReportFileName(): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `Activity Logs Report - ${yyyy}-${mm}-${dd}.pdf`;
}

export async function downloadLogsReportPdf(
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

  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.left = "-100000px";
  sandbox.style.top = "0";
  sandbox.style.pointerEvents = "none";
  sandbox.style.zIndex = "-1";
  sandbox.style.background = "#ffffff";

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  try {
    const pageElements = Array.from(
      clone.querySelectorAll<HTMLElement>("[data-logs-report-page='true']"),
    );

    if (pageElements.length === 0) {
      throw new Error("No printable logs report pages found.");
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

      pdf.setFont("times", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        `Page ${i + 1} of ${pageElements.length}`,
        pageWidth - marginMm,
        pageHeight - 3,
        {
          align: "right",
        },
      );

      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    sandbox.remove();
  }

  pdf.save(fileName);
}
