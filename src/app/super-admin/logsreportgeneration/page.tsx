"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogsReportGeneration, {
  createLogsReportFileName,
  downloadLogsReportPdf,
  type LogsReportRecord,
} from "../../../frontend/super-admin/functions/Logs/LogsReportGeneration";
import { APP_ROUTES } from "@/frontend/route";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

type ApiLog = {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  email: string | null;
  school_name: string | null;
  action: string | null;
  details: string | null;
  created_at: string;
};

export default function LogsReportGenerationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportRef = React.useRef<HTMLDivElement | null>(null);
  const previewViewportRef = React.useRef<HTMLDivElement | null>(null);

  const queryFrom = searchParams.get("from") || "";
  const queryTo = searchParams.get("to") || "";
  const querySearch = searchParams.get("search") || "";
  const queryRole = searchParams.get("role") || "";
  const queryLetter = searchParams.get("letter") || "";
  const querySortMode = searchParams.get("sortMode") || "";
  const reportScope =
    searchParams.get("report_scope") === "archived" ? "archived" : "active";
  const reportScopeLabel = reportScope === "archived" ? "archived" : "activity";
  const reportTitle =
    reportScope === "archived"
      ? "Archived Logs Report"
      : "Activity Logs Report";

  const [rows, setRows] = React.useState<LogsReportRecord[]>([]);
  const [generatedBy, setGeneratedBy] = React.useState("System");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [previewScale, setPreviewScale] = React.useState(1);
  const [scaledPreviewHeight, setScaledPreviewHeight] = React.useState(0);

  const A4_PREVIEW_WIDTH_PX = 794;

  React.useEffect(() => {
    if (loading) {
      return;
    }

    const updatePreviewLayout = () => {
      const viewportEl = previewViewportRef.current;
      if (!viewportEl) {
        return;
      }

      const viewportWidth = viewportEl.clientWidth;
      const nextScale =
        viewportWidth > 0
          ? Math.min(1, viewportWidth / A4_PREVIEW_WIDTH_PX)
          : 1;

      setPreviewScale(nextScale);

      const reportHeight = reportRef.current?.scrollHeight ?? 0;
      setScaledPreviewHeight(Math.ceil(reportHeight * nextScale));
    };

    updatePreviewLayout();

    const observer = new ResizeObserver(() => updatePreviewLayout());
    if (previewViewportRef.current) {
      observer.observe(previewViewportRef.current);
    }
    if (reportRef.current) {
      observer.observe(reportRef.current);
    }

    window.addEventListener("resize", updatePreviewLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePreviewLayout);
    };
  }, [loading, rows.length]);

  React.useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("authToken");
        if (!token) {
          router.replace(APP_ROUTES.LOGIN);
          return;
        }

        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          try {
            const user = JSON.parse(rawUser) as {
              firstName?: string;
              first_name?: string;
              lastName?: string;
              last_name?: string;
              name?: string;
            };
            const firstName = user.firstName || user.first_name || "";
            const lastName = user.lastName || user.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim();
            setGeneratedBy(fullName || user.name || "System");
          } catch {
            setGeneratedBy("System");
          }
        }

        const params = new URLSearchParams();
        params.set("format", "json");
        if (queryFrom) params.set("from", queryFrom);
        if (queryTo) params.set("to", queryTo);
        if (querySearch) params.set("search", querySearch);
        if (queryRole) params.set("role", queryRole);
        if (queryLetter) params.set("letter", queryLetter);
        if (querySortMode) params.set("sortMode", querySortMode);

        if (reportScope === "archived") {
          params.set("only_archived", "true");
        } else {
          params.set("include_archived", "false");
        }

        const response = await fetch(
          `${API_BASE}/api/backlogs/report?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch logs report data.");
        }

        const result = await response.json();
        const mappedRows: LogsReportRecord[] = (
          (result.data || []) as ApiLog[]
        ).map((item) => ({
          id: item.id,
          userId: item.user_id,
          firstName: item.first_name || "Unknown",
          lastName: item.last_name || "",
          role: item.role || "N/A",
          email: item.email || "N/A",
          schoolName: item.school_name || "N/A",
          action: item.action || "N/A",
          details: item.details || "",
          createdAt: item.created_at,
        }));

        setRows(mappedRows);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load logs report.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [
    router,
    queryFrom,
    queryTo,
    querySearch,
    queryRole,
    queryLetter,
    querySortMode,
    reportScope,
  ]);

  const handleGeneratePdf = async () => {
    if (!reportRef.current) {
      setError("Report preview is not ready yet. Please try again.");
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setError(null);
      await downloadLogsReportPdf(
        reportRef.current,
        createLogsReportFileName(reportScope),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate logs report PDF.",
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Logs Report</h1>
            <p className="text-sm text-gray-500">
              Generate and download {reportScopeLabel} logs as PDF.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(APP_ROUTES.SUPER_ADMIN)}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Super Admin
            </button>
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={loading || isGeneratingPdf}
              className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingPdf ? "Generating..." : "Generate PDF"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-blue-200 bg-white p-2 shadow-sm md:p-4">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              Loading report...
            </div>
          ) : (
            <div ref={previewViewportRef} className="w-full">
              <div style={{ height: scaledPreviewHeight || undefined }}>
                <div
                  style={{
                    width: "210mm",
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <LogsReportGeneration
                    ref={reportRef}
                    rows={rows}
                    generatedBy={generatedBy}
                    dateFrom={queryFrom || undefined}
                    dateTo={queryTo || undefined}
                    reportTitle={reportTitle}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
