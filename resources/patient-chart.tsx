import {
  McpUseProvider,
  useWidget,
  useWidgetTheme,
  type WidgetMetadata,
} from "mcp-use/react";
import { z } from "zod";
import { useState, useMemo } from "react";

// ── Schema ────────────────────────────────────────────────────────────
const propsSchema = z.object({
  chart: z.any(),
  patientName: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description:
    "Dental chart with tooth visualization, procedures, and clinical notes",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;
type Tab = "teeth" | "procedures" | "clinical";

// ── Colors ────────────────────────────────────────────────────────────
function useColors() {
  const theme = useWidgetTheme();
  const dark = theme === "dark";
  return {
    bg: dark ? "#1a1a2e" : "#ffffff",
    card: dark ? "#16213e" : "#f8f9fa",
    text: dark ? "#e0e0e0" : "#1a1a1a",
    textSecondary: dark ? "#a0a0a0" : "#666666",
    border: dark ? "#2a2a4a" : "#e0e0e0",
    accent: dark ? "#4a9eff" : "#0066cc",
    headerBg: dark ? "#0f3460" : "#f0f4f8",
    inputBg: dark ? "#0f1b30" : "#ffffff",
    tabActive: dark ? "#4a9eff" : "#0066cc",
    tabInactive: dark ? "#2a2a4a" : "#e9ecef",
    // Dental condition colors
    healthy: dark ? "#2d6a4f" : "#28a745",
    missing: dark ? "#6c757d" : "#adb5bd",
    crown: dark ? "#2563eb" : "#007bff",
    filling: dark ? "#ca8a04" : "#ffc107",
    decay: dark ? "#dc2626" : "#dc3545",
    rootCanal: dark ? "#7c3aed" : "#6f42c1",
    implant: dark ? "#0d9488" : "#20c997",
    other: dark ? "#a0a0a0" : "#6c757d",
  };
}

const CONDITION_MAP: Record<string, { label: string; key: string }> = {
  healthy: { label: "Healthy", key: "healthy" },
  missing: { label: "Missing", key: "missing" },
  crown: { label: "Crown", key: "crown" },
  filling: { label: "Filling", key: "filling" },
  decay: { label: "Decay", key: "decay" },
  "root canal": { label: "Root Canal", key: "rootCanal" },
  rootcanal: { label: "Root Canal", key: "rootCanal" },
  implant: { label: "Implant", key: "implant" },
};

function getConditionColor(
  condition: string,
  colors: ReturnType<typeof useColors>,
) {
  const key = CONDITION_MAP[condition.toLowerCase()]?.key ?? "other";
  return (colors as any)[key] ?? colors.other;
}

// ── Component ─────────────────────────────────────────────────────────
export default function PatientChartWidget() {
  const { props, isPending } = useWidget<Props>();
  const c = useColors();
  const [tab, setTab] = useState<Tab>("teeth");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [procFilter, setProcFilter] = useState<"all" | "completed" | "planned">(
    "all",
  );

  const chart = props?.chart ?? {};
  const patientName = props?.patientName ?? "Patient";
  const info = chart?.patient_info ?? {};
  const toothChart = chart?.tooth_chart ?? {};
  const teethConditions: any[] = toothChart.teeth_with_conditions ?? [];
  const procedures: any[] = chart?.procedures ?? [];
  const procSummary = chart?.procedure_summary ?? {};
  const clinical = chart?.clinical_explanation ?? {};
  const summary = chart?.summary ?? {};
  const quadrants = toothChart.quadrant_summary ?? {};

  // Build tooth map (number → condition data)
  const toothMap = useMemo(() => {
    const m: Record<number, any> = {};
    teethConditions.forEach((t: any) => {
      m[t.tooth_number] = t;
    });
    return m;
  }, [teethConditions]);

  // Filter procedures
  const filteredProcs = useMemo(() => {
    if (procFilter === "all") return procedures;
    return procedures.filter((p: any) => {
      const s = (p.status ?? "").toLowerCase();
      if (procFilter === "completed") return s.includes("complet");
      return s.includes("plan") || s.includes("tp");
    });
  }, [procedures, procFilter]);

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div
          style={{ padding: 40, textAlign: "center", color: c.textSecondary }}
        >
          Loading dental chart…
        </div>
      </McpUseProvider>
    );
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    borderBottom:
      tab === t ? `3px solid ${c.tabActive}` : "3px solid transparent",
    backgroundColor: "transparent",
    color: tab === t ? c.tabActive : c.textSecondary,
  });

  const thStyle: React.CSSProperties = {
    padding: "8px 10px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: `2px solid ${c.border}`,
    backgroundColor: c.headerBg,
    color: c.textSecondary,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "8px 10px",
    fontSize: 13,
    borderBottom: `1px solid ${c.border}`,
    color: c.text,
  };

  // ── Tooth Grid ────────────────────────────────────────────────────
  const renderToothGrid = () => {
    const upper = Array.from({ length: 16 }, (_, i) => i + 1);
    const lower = Array.from({ length: 16 }, (_, i) => 32 - i);

    const renderTooth = (num: number) => {
      const data = toothMap[num];
      const condition = data?.condition?.toLowerCase() ?? "healthy";
      const color = getConditionColor(condition, c);
      const isSelected = selectedTooth === num;

      return (
        <div
          key={num}
          onClick={() => setSelectedTooth(isSelected ? null : num)}
          style={{
            width: 40,
            height: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRadius: 6,
            border: isSelected
              ? `2px solid ${c.accent}`
              : `1px solid ${c.border}`,
            backgroundColor: isSelected ? c.card : "transparent",
            transition: "all 0.15s",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: condition === "missing" ? 4 : "50%",
              backgroundColor: color,
              opacity: condition === "missing" ? 0.4 : 1,
              border:
                condition === "missing" ? `2px dashed ${c.missing}` : "none",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              marginTop: 2,
              color: c.textSecondary,
            }}
          >
            {num}
          </span>
        </div>
      );
    };

    const selectedData = selectedTooth ? toothMap[selectedTooth] : null;

    return (
      <div>
        {/* Upper arch */}
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: c.textSecondary,
            marginBottom: 4,
          }}
        >
          Upper Arch
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {upper.map(renderTooth)}
        </div>

        <div
          style={{
            borderTop: `2px dashed ${c.border}`,
            margin: "12px 0",
          }}
        />

        {/* Lower arch */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {lower.map(renderTooth)}
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: c.textSecondary,
            marginTop: 4,
          }}
        >
          Lower Arch
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 16,
            fontSize: 12,
          }}
        >
          {[
            { label: "Healthy", color: c.healthy },
            { label: "Missing", color: c.missing },
            { label: "Crown", color: c.crown },
            { label: "Filling", color: c.filling },
            { label: "Decay", color: c.decay },
            { label: "Root Canal", color: c.rootCanal },
          ].map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: item.color,
                }}
              />
              <span style={{ color: c.textSecondary }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Selected tooth detail */}
        {selectedData && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              backgroundColor: c.card,
              border: `1px solid ${c.border}`,
            }}
          >
            <strong>Tooth #{selectedTooth}</strong>
            <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>
              Condition: {selectedData.condition}
              {selectedData.surface && <> · Surface: {selectedData.surface}</>}
              {selectedData.notes && (
                <div style={{ marginTop: 4 }}>{selectedData.notes}</div>
              )}
            </div>
          </div>
        )}

        {/* Quadrant summary */}
        {Object.keys(quadrants).length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[
              { label: "Upper Right (Q1)", val: quadrants.upper_right },
              { label: "Upper Left (Q2)", val: quadrants.upper_left },
              { label: "Lower Left (Q3)", val: quadrants.lower_left },
              { label: "Lower Right (Q4)", val: quadrants.lower_right },
            ].map((q) => (
              <div
                key={q.label}
                style={{
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor: c.card,
                  border: `1px solid ${c.border}`,
                  fontSize: 12,
                }}
              >
                <strong>{q.label}</strong>
                <div style={{ color: c.textSecondary, marginTop: 2 }}>
                  {q.val || "No data"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Procedures Table ──────────────────────────────────────────────
  const renderProcedures = () => (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["all", "completed", "planned"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setProcFilter(f)}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              backgroundColor: procFilter === f ? c.accent : c.tabInactive,
              color: procFilter === f ? "#fff" : c.textSecondary,
            }}
          >
            {f === "all"
              ? `All (${procedures.length})`
              : f === "completed"
                ? `Completed (${procSummary.completed_procedures ?? "—"})`
                : `Planned (${procSummary.treatment_planned_procedures ?? "—"})`}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Total", val: procSummary.total_procedures },
          {
            label: "Charges",
            val:
              procSummary.total_charges != null
                ? `$${Number(procSummary.total_charges).toLocaleString()}`
                : "—",
          },
          { label: "Exams", val: procSummary.procedures_by_type?.exams },
          {
            label: "Cleanings",
            val: procSummary.procedures_by_type?.cleanings,
          },
          { label: "Fillings", val: procSummary.procedures_by_type?.fillings },
          { label: "Crowns", val: procSummary.procedures_by_type?.crowns },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              backgroundColor: c.card,
              border: `1px solid ${c.border}`,
              fontSize: 13,
            }}
          >
            <div style={{ color: c.textSecondary, fontSize: 11 }}>
              {s.label}
            </div>
            <div style={{ fontWeight: 700 }}>{s.val ?? "—"}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}
        >
          <thead>
            <tr>
              {[
                "Date",
                "Tooth",
                "Surface",
                "Code",
                "Description",
                "Status",
                "Provider",
                "Amount",
              ].map((h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProcs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 30,
                    textAlign: "center",
                    color: c.textSecondary,
                  }}
                >
                  No procedures found.
                </td>
              </tr>
            ) : (
              filteredProcs.map((p: any, i: number) => (
                <tr key={i}>
                  <td style={tdStyle}>{p.date || "—"}</td>
                  <td style={tdStyle}>{p.tooth || "—"}</td>
                  <td style={tdStyle}>{p.surface || "—"}</td>
                  <td
                    style={{
                      ...tdStyle,
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    {p.ada_code || p.dx || "—"}
                  </td>
                  <td style={tdStyle}>{p.description || "—"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: (p.status ?? "")
                          .toLowerCase()
                          .includes("complet")
                          ? c.healthy
                          : c.filling,
                        color: "#fff",
                      }}
                    >
                      {p.status || "—"}
                    </span>
                  </td>
                  <td style={tdStyle}>{p.provider || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {p.amount != null ? `$${Number(p.amount).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Clinical Notes ────────────────────────────────────────────────
  const renderClinical = () => {
    const sections = [
      { title: "Overall Dental Health", text: clinical.overall_dental_health },
      { title: "Teeth Assessment", text: clinical.teeth_assessment },
      { title: "Treatment History", text: clinical.treatment_history },
      { title: "Treatment Needs", text: clinical.treatment_needs },
      { title: "Periodontal Status", text: clinical.periodontal_status },
      { title: "Risk Factors", text: clinical.risk_factors },
      { title: "Recommendations", text: clinical.recommendations },
      { title: "Notes", text: clinical.notes },
    ].filter((s) => s.text);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sections.map((s) => (
          <div
            key={s.title}
            style={{
              padding: 14,
              borderRadius: 8,
              backgroundColor: c.card,
              border: `1px solid ${c.border}`,
            }}
          >
            <h4
              style={{
                margin: "0 0 6px",
                fontSize: 14,
                fontWeight: 700,
                color: c.accent,
              }}
            >
              {s.title}
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.6,
                color: c.text,
              }}
            >
              {s.text}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <McpUseProvider autoSize>
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: c.bg,
          color: c.text,
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${c.border}`,
        }}
      >
        {/* Header + Patient Sidebar */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
            backgroundColor: c.card,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              Dental Chart — {patientName}
            </h2>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 6,
                fontSize: 13,
                color: c.textSecondary,
              }}
            >
              {info.age && <span>Age: {info.age}</span>}
              {summary.primary_provider && (
                <span>Provider: {summary.primary_provider}</span>
              )}
              {summary.last_visit_date && (
                <span>Last Visit: {summary.last_visit_date}</span>
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              fontSize: 12,
            }}
          >
            {info.allergies && info.allergies !== "none" && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 12,
                  backgroundColor: c.decay,
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Allergies: {info.allergies}
              </span>
            )}
            {info.medications && info.medications !== "none" && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 12,
                  backgroundColor: c.crown,
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Meds: {info.medications}
              </span>
            )}
            {info.problems && info.problems !== "none" && (
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 12,
                  backgroundColor: c.filling,
                  color: "#000",
                  fontWeight: 600,
                }}
              >
                Problems: {info.problems}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${c.border}`,
            backgroundColor: c.bg,
          }}
        >
          <button style={tabStyle("teeth")} onClick={() => setTab("teeth")}>
            Tooth Chart
          </button>
          <button
            style={tabStyle("procedures")}
            onClick={() => setTab("procedures")}
          >
            Procedures ({procedures.length})
          </button>
          <button
            style={tabStyle("clinical")}
            onClick={() => setTab("clinical")}
          >
            Clinical
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: 20 }}>
          {tab === "teeth" && renderToothGrid()}
          {tab === "procedures" && renderProcedures()}
          {tab === "clinical" && renderClinical()}
        </div>
      </div>
    </McpUseProvider>
  );
}
