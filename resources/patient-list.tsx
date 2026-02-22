import {
  McpUseProvider,
  useWidget,
  useWidgetTheme,
  type WidgetMetadata,
} from "mcp-use/react";
import { z } from "zod";
import { useState, useMemo } from "react";

const patientSchema = z.object({
  patient_id: z.number().nullable().optional(),
  first_name: z.string(),
  last_name: z.string(),
  age: z.number().nullable().optional(),
  wireless_phone: z.string().nullable().optional(),
  home_phone: z.string().nullable().optional(),
  work_phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
});

const propsSchema = z.object({
  patients: z.array(patientSchema),
  totalCount: z.number(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Patient list table with search, sort, pagination, and drill-down",
  props: propsSchema,
  exposeAsTool: false,
};

type Props = z.infer<typeof propsSchema>;
type Patient = z.infer<typeof patientSchema>;
type SortKey = "last_name" | "first_name" | "age" | "city" | "status";
type SortDir = "asc" | "desc";

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
    accentHover: dark ? "#3a8eef" : "#0052a3",
    headerBg: dark ? "#0f3460" : "#f0f4f8",
    rowHover: dark ? "#1e2d4a" : "#f5f8ff",
    badgeGreen: dark ? "#1b4332" : "#d4edda",
    badgeGreenText: dark ? "#95d5b2" : "#155724",
    badgeYellow: dark ? "#3d3200" : "#fff3cd",
    badgeYellowText: dark ? "#ffd166" : "#856404",
    badgeGray: dark ? "#2d2d2d" : "#e9ecef",
    badgeGrayText: dark ? "#adb5bd" : "#495057",
    inputBg: dark ? "#0f1b30" : "#ffffff",
  };
}

const PAGE_SIZE = 10;

export default function PatientListWidget() {
  const { props, isPending, sendFollowUpMessage } = useWidget<Props>();
  const c = useColors();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("last_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!props?.patients) return [];
    const q = search.toLowerCase();
    return props.patients.filter((p) => {
      const phone = p.wireless_phone || p.home_phone || p.work_phone || "";
      return (
        !q ||
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q)
      );
    });
  }, [props?.patients, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "age") {
        av = a.age ?? 0;
        bv = b.age ?? 0;
      } else {
        av = (a[sortKey] ?? "").toString().toLowerCase();
        bv = (b[sortKey] ?? "").toString().toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 40, textAlign: "center", color: c.textSecondary }}>
          Loading patients…
        </div>
      </McpUseProvider>
    );
  }

  const getPhone = (p: Patient) =>
    p.wireless_phone || p.home_phone || p.work_phone || "—";

  const statusBadge = (status: string | null | undefined) => {
    const s = (status ?? "").toLowerCase();
    let bg = c.badgeGray;
    let color = c.badgeGrayText;
    if (s === "patient" || s === "active") {
      bg = c.badgeGreen;
      color = c.badgeGreenText;
    } else if (s === "inactive") {
      bg = c.badgeYellow;
      color = c.badgeYellowText;
    }
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: bg,
          color,
        }}
      >
        {status || "Unknown"}
      </span>
    );
  };

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const thStyle: React.CSSProperties = {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "pointer",
    userSelect: "none",
    borderBottom: `2px solid ${c.border}`,
    backgroundColor: c.headerBg,
    color: c.textSecondary,
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 14,
    borderBottom: `1px solid ${c.border}`,
    color: c.text,
  };

  const btnStyle: React.CSSProperties = {
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    backgroundColor: c.accent,
    color: "#fff",
    marginRight: 4,
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
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${c.border}`,
            backgroundColor: c.card,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              Patients
            </h2>
            <span style={{ fontSize: 13, color: c.textSecondary }}>
              {props.totalCount} total · {filtered.length} shown
            </span>
          </div>
          <input
            type="text"
            placeholder="Search name, city, phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "8px 14px",
              fontSize: 14,
              borderRadius: 8,
              border: `1px solid ${c.border}`,
              backgroundColor: c.inputBg,
              color: c.text,
              width: 260,
              outline: "none",
            }}
          />
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 700,
            }}
          >
            <thead>
              <tr>
                <th style={thStyle} onClick={() => toggleSort("last_name")}>
                  Last Name{sortArrow("last_name")}
                </th>
                <th style={thStyle} onClick={() => toggleSort("first_name")}>
                  First Name{sortArrow("first_name")}
                </th>
                <th style={thStyle} onClick={() => toggleSort("age")}>
                  Age{sortArrow("age")}
                </th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle} onClick={() => toggleSort("city")}>
                  City{sortArrow("city")}
                </th>
                <th style={thStyle} onClick={() => toggleSort("status")}>
                  Status{sortArrow("status")}
                </th>
                <th style={{ ...thStyle, cursor: "default" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: c.textSecondary,
                    }}
                  >
                    No patients found.
                  </td>
                </tr>
              ) : (
                pageData.map((p, i) => (
                  <tr
                    key={p.patient_id ?? i}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = c.rowHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      {p.last_name}
                    </td>
                    <td style={tdStyle}>{p.first_name}</td>
                    <td style={tdStyle}>{p.age ?? "—"}</td>
                    <td style={{ ...tdStyle, fontSize: 13 }}>
                      {getPhone(p)}
                    </td>
                    <td style={tdStyle}>{p.city || "—"}</td>
                    <td style={tdStyle}>{statusBadge(p.status)}</td>
                    <td style={tdStyle}>
                      <button
                        style={btnStyle}
                        onClick={() =>
                          sendFollowUpMessage(
                            `Show the dental chart for ${p.first_name} ${p.last_name}`
                          )
                        }
                      >
                        Chart
                      </button>
                      <button
                        style={{
                          ...btnStyle,
                          backgroundColor: "transparent",
                          color: c.accent,
                          border: `1px solid ${c.accent}`,
                        }}
                        onClick={() =>
                          sendFollowUpMessage(
                            `Show the full report for ${p.first_name} ${p.last_name}`
                          )
                        }
                      >
                        Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: `1px solid ${c.border}`,
              backgroundColor: c.card,
              fontSize: 13,
              color: c.textSecondary,
            }}
          >
            <span>
              Page {safePage} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                style={{
                  ...btnStyle,
                  backgroundColor: safePage <= 1 ? c.badgeGray : c.accent,
                  cursor: safePage <= 1 ? "not-allowed" : "pointer",
                }}
              >
                Prev
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                style={{
                  ...btnStyle,
                  backgroundColor:
                    safePage >= totalPages ? c.badgeGray : c.accent,
                  cursor:
                    safePage >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </McpUseProvider>
  );
}
