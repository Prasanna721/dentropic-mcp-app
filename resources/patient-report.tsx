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
  report: z.any(),
  patientName: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description:
    "Comprehensive patient report with demographics, family, insurance, account, treatment plans, and appointments",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;
type Tab =
  | "overview"
  | "family"
  | "insurance"
  | "account"
  | "treatment"
  | "appointments";

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
    tabActive: dark ? "#4a9eff" : "#0066cc",
    tabInactive: dark ? "#2a2a4a" : "#e9ecef",
    green: dark ? "#2d6a4f" : "#28a745",
    greenText: dark ? "#95d5b2" : "#155724",
    greenBg: dark ? "#1b4332" : "#d4edda",
    red: dark ? "#dc2626" : "#dc3545",
    redBg: dark ? "#3d1f1f" : "#f8d7da",
    yellow: dark ? "#ca8a04" : "#ffc107",
    yellowBg: dark ? "#3d3200" : "#fff3cd",
    blue: dark ? "#2563eb" : "#007bff",
    blueBg: dark ? "#1e3a5f" : "#d1ecf1",
  };
}

const fmt = (v: number | null | undefined) =>
  v != null ? `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

// ── Component ─────────────────────────────────────────────────────────
export default function PatientReportWidget() {
  const { props, isPending } = useWidget<Props>();
  const c = useColors();
  const [tab, setTab] = useState<Tab>("overview");
  const [acctPage, setAcctPage] = useState(1);

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 40, textAlign: "center", color: c.textSecondary }}>
          Loading patient report…
        </div>
      </McpUseProvider>
    );
  }

  const { report, patientName } = props;
  const info = report?.patient_info ?? {};
  const family = report?.family_members ?? [];
  const insurance = report?.insurance ?? {};
  const recall = report?.recall ?? {};
  const account = report?.account ?? {};
  const treatments = report?.treatment_plans ?? {};
  const appointments = report?.appointments ?? {};
  const summary = report?.summary ?? {};

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    borderBottom: tab === t ? `3px solid ${c.tabActive}` : "3px solid transparent",
    backgroundColor: "transparent",
    color: tab === t ? c.tabActive : c.textSecondary,
    whiteSpace: "nowrap",
  });

  const thStyle: React.CSSProperties = {
    padding: "8px 10px",
    textAlign: "left",
    fontSize: 11,
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

  const cardBox = (
    label: string,
    value: string | number | null | undefined,
    bgColor?: string,
    textColor?: string
  ) => (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 8,
        backgroundColor: bgColor ?? c.card,
        border: `1px solid ${c.border}`,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 11, color: c.textSecondary, fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          marginTop: 2,
          color: textColor ?? c.text,
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );

  const sectionCard = (title: string, children: React.ReactNode) => (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        backgroundColor: c.card,
        border: `1px solid ${c.border}`,
        marginBottom: 12,
      }}
    >
      <h4
        style={{
          margin: "0 0 10px",
          fontSize: 14,
          fontWeight: 700,
          color: c.accent,
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );

  const field = (label: string, value: any) =>
    value ? (
      <div style={{ marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: c.textSecondary }}>{label}: </span>
        <span style={{ fontWeight: 500 }}>{value}</span>
      </div>
    ) : null;

  // ── Tab: Overview ─────────────────────────────────────────────────
  const renderOverview = () => {
    const addr = info.address ?? {};
    const contact = info.contact ?? {};
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sectionCard("Demographics", (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              {field("Name", `${info.first_name ?? ""} ${info.middle_name ?? ""} ${info.last_name ?? ""}`.trim())}
              {field("Preferred", info.preferred_name)}
              {field("Gender", info.gender)}
              {field("Birthdate", info.birthdate)}
              {field("Age", info.age)}
              {field("Title", info.title)}
            </div>
            <div>
              {field("Patient ID", info.patient_id)}
              {field("SSN (last 4)", info.ssn_last_four)}
              {field("Billing Type", info.billing_type)}
              {field("Primary Provider", info.primary_provider)}
              {field("Secondary Provider", info.secondary_provider)}
            </div>
          </div>
        ))}
        {sectionCard("Address", (
          <>
            {field("Street", addr.street)}
            {addr.street2 && field("Street 2", addr.street2)}
            {field("City / State / Zip", [addr.city, addr.state, addr.zip].filter(Boolean).join(", "))}
          </>
        ))}
        {sectionCard("Contact", (
          <>
            {field("Home", contact.home_phone)}
            {field("Work", contact.work_phone)}
            {field("Cell", contact.wireless_phone)}
            {field("Email", contact.email)}
            {field("Preferred Method", contact.preferred_contact_method)}
          </>
        ))}
        {recall.type &&
          sectionCard("Recall", (
            <>
              {field("Type", recall.type)}
              {field("Interval", recall.interval)}
              {field("Previous", recall.previous_date)}
              {field("Due", recall.due_date)}
              {field("Scheduled", recall.scheduled_date)}
            </>
          ))}
      </div>
    );
  };

  // ── Tab: Family ───────────────────────────────────────────────────
  const renderFamily = () => (
    <div style={{ overflowX: "auto" }}>
      {family.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: c.textSecondary }}>
          No family members found.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Name", "Position", "Gender", "Status", "Age", "Recall Due"].map(
                (h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {family.map((m: any, i: number) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{m.name}</td>
                <td style={tdStyle}>{m.position || "—"}</td>
                <td style={tdStyle}>{m.gender || "—"}</td>
                <td style={tdStyle}>{m.status || "—"}</td>
                <td style={tdStyle}>{m.age || "—"}</td>
                <td style={tdStyle}>{m.recall_due || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // ── Tab: Insurance ────────────────────────────────────────────────
  const renderInsurance = () => {
    const renderPlan = (plan: any, label: string) => {
      if (!plan || !plan.carrier) return null;
      const cov = plan.coverage_percentages ?? {};
      return sectionCard(label, (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            {field("Carrier", plan.carrier)}
            {field("Group", `${plan.group_name ?? ""} (${plan.group_number ?? ""})`)}
            {field("Subscriber", plan.subscriber_name)}
            {field("Subscriber ID", plan.subscriber_id)}
            {field("Relationship", plan.relationship_to_subscriber)}
            {field("Employer", plan.employer)}
            {field("Plan Type", plan.plan_type)}
            {field("Fee Schedule", plan.fee_schedule)}
          </div>
          {Object.keys(cov).length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, marginBottom: 6 }}>
                COVERAGE
              </div>
              {Object.entries(cov).map(([k, v]) =>
                v ? (
                  <div key={k} style={{ fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: c.textSecondary }}>
                      {k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:{" "}
                    </span>
                    <span style={{ fontWeight: 600 }}>{v as string}</span>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      ));
    };

    return (
      <div>
        {renderPlan(insurance.primary, "Primary Insurance")}
        {renderPlan(insurance.secondary, "Secondary Insurance")}
        {!insurance.primary?.carrier && !insurance.secondary?.carrier && (
          <div style={{ padding: 30, textAlign: "center", color: c.textSecondary }}>
            No insurance information on file.
          </div>
        )}
      </div>
    );
  };

  // ── Tab: Account ──────────────────────────────────────────────────
  const renderAccount = () => {
    const transactions: any[] = account.transactions ?? [];
    const claims: any[] = account.claims ?? [];
    const balances = account.balances ?? {};
    const perPage = 15;
    const totalPages = Math.max(1, Math.ceil(transactions.length / perPage));
    const safePage = Math.min(acctPage, totalPages);
    const pageTx = transactions.slice(
      (safePage - 1) * perPage,
      safePage * perPage
    );

    return (
      <div>
        {/* Balance summary */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {cardBox("Patient Balance", fmt(balances.patient_balance))}
          {cardBox("Family Balance", fmt(balances.total_family_balance))}
        </div>

        {/* Family balances */}
        {balances.family_balances?.length > 0 &&
          sectionCard("Family Balances", (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {balances.family_balances.map((fb: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    backgroundColor: c.bg,
                    border: `1px solid ${c.border}`,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: c.textSecondary }}>{fb.name}: </span>
                  <span style={{ fontWeight: 600 }}>{fmt(fb.balance)}</span>
                </div>
              ))}
            </div>
          ))}

        {/* Transactions table */}
        {sectionCard(`Transactions (${transactions.length})`, (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
                <thead>
                  <tr>
                    {["Date", "Patient", "Provider", "Code", "Tooth", "Description", "Charges", "Credits", "Balance"].map(
                      (h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageTx.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 20, textAlign: "center", color: c.textSecondary }}>
                        No transactions.
                      </td>
                    </tr>
                  ) : (
                    pageTx.map((t: any, i: number) => (
                      <tr key={i}>
                        <td style={tdStyle}>{t.date}</td>
                        <td style={tdStyle}>{t.patient}</td>
                        <td style={tdStyle}>{t.provider || "—"}</td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12 }}>
                          {t.code || "—"}
                        </td>
                        <td style={tdStyle}>{t.tooth || "—"}</td>
                        <td style={tdStyle}>{t.description}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(t.charges)}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(t.credits)}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                          {fmt(t.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 8,
                  fontSize: 12,
                  color: c.textSecondary,
                }}
              >
                <span>
                  Page {safePage} of {totalPages}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    disabled={safePage <= 1}
                    onClick={() => setAcctPage(safePage - 1)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      border: "none",
                      borderRadius: 4,
                      cursor: safePage <= 1 ? "not-allowed" : "pointer",
                      backgroundColor: safePage <= 1 ? c.tabInactive : c.accent,
                      color: "#fff",
                    }}
                  >
                    Prev
                  </button>
                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setAcctPage(safePage + 1)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      border: "none",
                      borderRadius: 4,
                      cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                      backgroundColor: safePage >= totalPages ? c.tabInactive : c.accent,
                      color: "#fff",
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ))}

        {/* Claims */}
        {claims.length > 0 &&
          sectionCard(`Claims (${claims.length})`, (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Carrier", "Amount", "Status", "Est. Payment", "Patient Portion"].map(
                      (h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((cl: any, i: number) => (
                    <tr key={i}>
                      <td style={tdStyle}>{cl.date}</td>
                      <td style={tdStyle}>{cl.carrier}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(cl.amount)}</td>
                      <td style={tdStyle}>{cl.status || "—"}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(cl.estimated_payment)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(cl.patient_portion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    );
  };

  // ── Tab: Treatment Plans ──────────────────────────────────────────
  const renderTreatment = () => {
    const plans: any[] = treatments.active_plans ?? [];
    const procs: any[] = treatments.procedures ?? [];
    const totals = treatments.totals ?? {};
    const benefits = treatments.insurance_benefits ?? {};

    return (
      <div>
        {/* Active plans */}
        {plans.length > 0 &&
          sectionCard("Active Plans", (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {plans.map((p: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    backgroundColor: c.bg,
                    border: `1px solid ${c.border}`,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{p.heading || "Treatment Plan"}</div>
                  <div style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>
                    {p.date} · {p.status} · Signed: {p.signed || "—"}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* Procedures table */}
        {sectionCard(`Procedures (${procs.length})`, (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr>
                  {["Done", "Priority", "Tooth", "Surface", "Code", "Description", "Fee", "Ins Est", "Patient"].map(
                    (h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {procs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 20, textAlign: "center", color: c.textSecondary }}>
                      No treatment procedures.
                    </td>
                  </tr>
                ) : (
                  procs.map((p: any, i: number) => (
                    <tr key={i}>
                      <td style={tdStyle}>
                        {p.done === "Yes" ? (
                          <span style={{ color: c.green, fontWeight: 700 }}>✓</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={tdStyle}>{p.priority || "—"}</td>
                      <td style={tdStyle}>{p.tooth || "—"}</td>
                      <td style={tdStyle}>{p.surface || "—"}</td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12 }}>
                        {p.code}
                      </td>
                      <td style={tdStyle}>{p.description}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(p.fee)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(p.insurance_estimate)}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                        {fmt(p.patient_portion)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ))}

        {/* Totals */}
        {(totals.total_fee != null || totals.total_patient_portion != null) && (
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 4,
              marginBottom: 12,
            }}
          >
            {cardBox("Total Fee", fmt(totals.total_fee))}
            {cardBox("Insurance Est.", fmt(totals.total_insurance_estimate))}
            {cardBox("Patient Portion", fmt(totals.total_patient_portion), c.yellowBg)}
          </div>
        )}

        {/* Insurance benefits */}
        {(benefits.primary || benefits.secondary) &&
          sectionCard("Insurance Benefits", (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {benefits.primary && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, marginBottom: 6 }}>
                    PRIMARY
                  </div>
                  {field("Annual Max", fmt(benefits.primary.annual_max))}
                  {field("Deductible Remaining", fmt(benefits.primary.deductible_remaining))}
                  {field("Used", fmt(benefits.primary.insurance_used))}
                  {field("Pending", fmt(benefits.primary.pending))}
                  {field("Remaining", fmt(benefits.primary.remaining))}
                </div>
              )}
              {benefits.secondary && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.textSecondary, marginBottom: 6 }}>
                    SECONDARY
                  </div>
                  {field("Annual Max", fmt(benefits.secondary.annual_max))}
                  {field("Deductible", fmt(benefits.secondary.deductible))}
                  {field("Used", fmt(benefits.secondary.insurance_used))}
                  {field("Pending", fmt(benefits.secondary.pending))}
                  {field("Remaining", fmt(benefits.secondary.remaining))}
                </div>
              )}
            </div>
          ))}
      </div>
    );
  };

  // ── Tab: Appointments ─────────────────────────────────────────────
  const renderAppointments = () => {
    const past: any[] = appointments.past_appointments ?? [];
    const scheduled: any[] = appointments.scheduled_appointments ?? [];
    const next = appointments.next_appointment;

    const statusColor = (status: string | null) => {
      const s = (status ?? "").toLowerCase();
      if (s.includes("complet")) return { bg: c.greenBg, color: c.greenText };
      if (s.includes("broken") || s.includes("cancel"))
        return { bg: c.redBg, color: c.red };
      if (s.includes("confirm"))
        return { bg: c.blueBg, color: c.blue };
      if (s.includes("schedul"))
        return { bg: c.yellowBg, color: c.yellow };
      return { bg: c.card, color: c.textSecondary };
    };

    const apptTable = (rows: any[], columns: string[]) => (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {columns.map((h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: 20, textAlign: "center", color: c.textSecondary }}
                >
                  None.
                </td>
              </tr>
            ) : (
              rows.map((a: any, i: number) => {
                const sc = statusColor(a.status);
                return (
                  <tr key={i}>
                    <td style={tdStyle}>{a.date}</td>
                    <td style={tdStyle}>{a.time || "—"}</td>
                    <td style={tdStyle}>{a.provider || "—"}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: sc.bg,
                          color: sc.color,
                        }}
                      >
                        {a.status || "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>{a.procedures || "—"}</td>
                    <td style={tdStyle}>{a.notes || a.operatory || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );

    return (
      <div>
        {/* Next appointment highlight */}
        {next?.date &&
          sectionCard("Next Appointment", (
            <div style={{ fontSize: 14 }}>
              <strong>{next.date}</strong>
              {next.time && <> at {next.time}</>}
              {next.provider && <> with {next.provider}</>}
              {next.procedures && <div style={{ marginTop: 4, color: c.textSecondary }}>{next.procedures}</div>}
            </div>
          ))}

        {sectionCard(`Scheduled (${scheduled.length})`,
          apptTable(scheduled, ["Date", "Time", "Provider", "Status", "Procedures", "Operatory"])
        )}

        {sectionCard(`Past (${past.length})`,
          apptTable(past, ["Date", "Time", "Provider", "Status", "Procedures", "Notes"])
        )}
      </div>
    );
  };

  // ── Main Render ───────────────────────────────────────────────────
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
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
            backgroundColor: c.card,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            Patient Report — {patientName}
          </h2>

          {/* Summary cards */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 12,
            }}
          >
            {cardBox("Outstanding", fmt(summary.total_outstanding_balance))}
            {cardBox("Pending Claims", summary.pending_insurance_claims ?? "—")}
            {cardBox("Treatment Value", fmt(summary.pending_treatment_value))}
            {cardBox("Next Recall", summary.next_recall_due ?? "—")}
            {cardBox("Ins. Remaining", fmt(summary.insurance_benefits_remaining))}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${c.border}`,
            backgroundColor: c.bg,
            overflowX: "auto",
          }}
        >
          {(
            [
              ["overview", "Overview"],
              ["family", `Family (${family.length})`],
              ["insurance", "Insurance"],
              ["account", "Account"],
              ["treatment", "Treatment"],
              ["appointments", "Appointments"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {tab === "overview" && renderOverview()}
          {tab === "family" && renderFamily()}
          {tab === "insurance" && renderInsurance()}
          {tab === "account" && renderAccount()}
          {tab === "treatment" && renderTreatment()}
          {tab === "appointments" && renderAppointments()}
        </div>
      </div>
    </McpUseProvider>
  );
}
