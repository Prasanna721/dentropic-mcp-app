import { MCPServer, text, widget, error } from "mcp-use/server";
import { z } from "zod";

const OPENDENTAL_API_URL =
  process.env.OPENDENTAL_API_URL || "http://localhost:8000";

const TOOL_TIMEOUTS = {
  "get-patients": 30 * 60_000,
  "get-patient-chart": 30 * 60_000,
  "get-reports": 30 * 60_000,
} as const;

const server = new MCPServer({
  name: "opendental",
  title: "OpenDental",
  version: "1.0.0",
  description: "OpenDental patient management via CUA",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// Shared helper to call the FastAPI backend with per-tool timeout
async function callBackend(
  path: string,
  method: "GET" | "POST" = "POST",
  params?: Record<string, string>,
  timeoutMs: number = 5 * 60_000
) {
  const url = new URL(path, OPENDENTAL_API_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url.toString(), {
      method,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ── Tool 1: get-patients ──────────────────────────────────────────────
server.tool(
  {
    name: "get-patients",
    description: "Retrieve the full list of patients from OpenDental",
    schema: z.object({}),
    annotations: { readOnlyHint: true },
    widget: {
      name: "patient-list",
      invoking: "Fetching patient list…",
      invoked: "Patient list loaded",
    },
  },
  async () => {
    try {
      const json = await callBackend(
        "/api/patients",
        "POST",
        undefined,
        TOOL_TIMEOUTS["get-patients"]
      );
      const data = json.data ?? json;
      const patients = data.patients ?? [];
      const totalCount = data.total_count ?? patients.length;

      return widget({
        props: { patients, totalCount },
        output: text(
          `Found ${totalCount} patient(s). Use the table to browse or click a patient for details.`
        ),
      });
    } catch (e: any) {
      return error(`Failed to fetch patients: ${e.message}`);
    }
  }
);

// ── Tool 2: get-patient-chart ─────────────────────────────────────────
server.tool(
  {
    name: "get-patient-chart",
    description:
      "Get the dental chart for a patient including tooth conditions, procedures, and clinical notes",
    schema: z.object({
      patient_name: z.string().describe("Patient name to search for"),
    }),
    annotations: { readOnlyHint: true },
    widget: {
      name: "patient-chart",
      invoking: "Loading dental chart…",
      invoked: "Dental chart ready",
    },
  },
  async ({ patient_name }) => {
    try {
      const json = await callBackend(
        "/api/patient_chart",
        "POST",
        { patient_name },
        TOOL_TIMEOUTS["get-patient-chart"]
      );
      const data = json.data ?? json;
      const chart = data.patient_chart;
      if (!chart) return error("No chart data returned for this patient.");

      return widget({
        props: { chart, patientName: patient_name },
        output: text(
          `Dental chart for ${patient_name}: ${chart.summary?.total_teeth_with_work ?? 0} teeth with work, ${chart.summary?.missing_teeth_count ?? 0} missing.`
        ),
      });
    } catch (e: any) {
      return error(`Failed to fetch chart: ${e.message}`);
    }
  }
);

// ── Tool 3: get-reports ───────────────────────────────────────────────
server.tool(
  {
    name: "get-reports",
    description:
      "Get a comprehensive report for a patient including demographics, insurance, account, treatment plans, and appointments",
    schema: z.object({
      patient_name: z.string().describe("Patient name to search for"),
    }),
    annotations: { readOnlyHint: true },
    widget: {
      name: "patient-report",
      invoking: "Generating patient report…",
      invoked: "Patient report ready",
    },
  },
  async ({ patient_name }) => {
    try {
      const json = await callBackend(
        "/api/reports",
        "POST",
        { patient_name },
        TOOL_TIMEOUTS["get-reports"]
      );
      const data = json.data ?? json;
      const report = data.patient_report;
      if (!report) return error("No report data returned for this patient.");

      return widget({
        props: { report, patientName: patient_name },
        output: text(
          `Report for ${patient_name}: balance $${report.summary?.total_outstanding_balance ?? 0}, ${report.summary?.pending_insurance_claims ?? 0} pending claims.`
        ),
      });
    } catch (e: any) {
      return error(`Failed to fetch report: ${e.message}`);
    }
  }
);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`OpenDental MCP server running on port ${PORT}`);
server.listen(PORT);
