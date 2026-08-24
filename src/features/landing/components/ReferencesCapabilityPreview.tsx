import {
  ArrowRight,
  Filter,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PreviewFrame } from "../landingShared";


type ReferenceItem = {
  id: string;
  name: string;
  requirement: string;
  institution: string;
  status: "Confirmed" | "Request sent" | "Follow-up due" | "Draft";
  due: string;
  lastContact: string;
  attachedContext: string[];
};

const INITIAL_REFERENCES: ReferenceItem[] = [
  {
    id: "khan",
    name: "Dr A. Khan",
    requirement: "Academic reference",
    institution: "University of Oxford",
    status: "Confirmed",
    due: "28 Aug",
    lastContact: "Confirmed 12 Aug",
    attachedContext: ["Certified transcript", "Research abstract", "Custom prompt notes"],
  },
  {
    id: "okoro",
    name: "Prof. D. Okoro",
    requirement: "Research potential",
    institution: "Cambridge Trust",
    status: "Request sent",
    due: "2 Sep",
    lastContact: "Request sent 18 Aug",
    attachedContext: ["Project summary draft", "CV v2"],
  },
  {
    id: "nair",
    name: "M. Priya Nair",
    requirement: "Leadership context",
    institution: "Community NGO",
    status: "Follow-up due",
    due: "5 Sep",
    lastContact: "Sent 5 Aug (18 days ago)",
    attachedContext: ["Leadership initiative log", "Volunteer summary"],
  },
  {
    id: "vance",
    name: "Prof. E. Vance",
    requirement: "Department chair",
    institution: "Stanford Graduate School",
    status: "Confirmed",
    due: "15 Sep",
    lastContact: "Confirmed 15 Aug",
    attachedContext: ["Academic record", "Publication list"],
  },
  {
    id: "tanaka",
    name: "Dr. H. Tanaka",
    requirement: "Laboratory supervisor",
    institution: "RIKEN Institute",
    status: "Draft",
    due: "20 Sep",
    lastContact: "Not sent yet",
    attachedContext: ["Lab project draft"],
  },
];


export function ReferencesCapabilityPreview() {
  const [refs, setRefs] = useState<ReferenceItem[]>(INITIAL_REFERENCES);
  const [selectedId, setSelectedId] = useState<string>("khan");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterBarOpen, setIsFilterBarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleSendReminder = (refItem: ReferenceItem) => {
    setRefs((prev) =>
      prev.map((r) => {
        if (r.id !== refItem.id) return r;
        return {
          ...r,
          status: "Request sent",
          lastContact: "Reminder sent just now",
        };
      }),
    );
    setToastMessage(
      `Sent follow-up reminder to ${refItem.name} for ${refItem.requirement}!`,
    );
  };

  const filteredRefs = refs.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requirement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.institution.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      r.status.toLowerCase().replace(/\s+/g, "-") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedRef = refs.find((r) => r.id === selectedId) || filteredRefs[0];

  const confirmedCount = refs.filter((r) => r.status === "Confirmed").length;
  const sentCount = refs.filter((r) => r.status === "Request sent").length;
  const followUpCount = refs.filter((r) => r.status === "Follow-up due").length;

  return (
    <PreviewFrame title="Reference tracking">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="tracker-toast-bar"
          role="status"
          style={{ margin: "0.5rem 1.25rem" }}
        >
          <span>{toastMessage}</span>
          <button
            className="tracker-icon-btn"
            onClick={() => setToastMessage(null)}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="preview-toolbar" style={{ margin: "0.75rem 1.25rem" }}>
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          className="tracker-search-input"
          placeholder="Search referees or requirements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search references"
        />
        {searchTerm && (
          <button
            className="tracker-icon-btn"
            onClick={() => setSearchTerm("")}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          className={`tracker-icon-btn ${isFilterBarOpen || statusFilter !== "all" ? "active" : ""}`}
          onClick={() => setIsFilterBarOpen((prev) => !prev)}
          title="Filter status"
        >
          <Filter size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Status Filter Chips */}
      {isFilterBarOpen && (
        <div
          className="tracker-filter-bar"
          style={{ margin: "0 1.25rem 0.75rem" }}
        >
          <span style={{ color: "var(--m-muted)", fontWeight: 600 }}>Filter:</span>
          {[
            { id: "all", label: "All" },
            { id: "confirmed", label: "Confirmed" },
            { id: "request-sent", label: "Request sent" },
            { id: "follow-up-due", label: "Follow-up due" },
            { id: "draft", label: "Draft" },
          ].map((chip) => (
            <button
              key={chip.id}
              className={`tracker-filter-chip ${statusFilter === chip.id ? "active" : ""}`}
              onClick={() => setStatusFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Reference List */}
      <div className="reference-preview-list">
        {filteredRefs.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              textAlign: "center",
              color: "var(--m-muted)",
              fontSize: "0.82rem",
            }}
          >
            No references found matching "{searchTerm}".
          </div>
        ) : (
          filteredRefs.map((item) => {
            const isSelected = selectedRef?.id === item.id;
            return (
              <div
                key={item.id}
                tabIndex={0}
                onClick={() => setSelectedId(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(item.id);
                  }
                }}
                style={{
                  cursor: "pointer",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  margin: "2px 0",
                  background: isSelected ? "var(--m-selected)" : "transparent",
                  borderLeft: isSelected
                    ? "3px solid var(--m-blue)"
                    : "3px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.requirement} • {item.institution}
                  </small>
                </span>
                <em data-status={item.status}>{item.status}</em>
                <time>{item.due}</time>
              </div>
            );
          })
        )}
      </div>

      {/* Reference Workspace Inspector Card */}
      {selectedRef && (
        <div
          className="tracker-detail-card"
          style={{ margin: "0.5rem 1.25rem 1rem" }}
        >
          <div className="tracker-detail-header">
            <div>
              <h4>{selectedRef.name}</h4>
              <p>
                {selectedRef.requirement} •{" "}
                <strong>{selectedRef.institution}</strong> • Target Due:{" "}
                <strong>{selectedRef.due}</strong>
              </p>
            </div>
            <em data-status={selectedRef.status}>{selectedRef.status}</em>
          </div>

          <div style={{ fontSize: "0.8rem", margin: "0.5rem 0" }}>
            <p style={{ margin: "0 0 0.4rem 0", color: "var(--m-muted)" }}>
              Last activity:{" "}
              <span style={{ color: "var(--m-text-strong)", fontWeight: 600 }}>
                {selectedRef.lastContact}
              </span>
            </p>
            <strong style={{ color: "var(--m-text-strong)" }}>
              Connected context package:
            </strong>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                marginTop: "0.4rem",
              }}
            >
              {selectedRef.attachedContext.map((ctx) => (
                <span
                  key={ctx}
                  className="tracker-filter-chip"
                  style={{ fontSize: "0.72rem", background: "var(--m-canvas)" }}
                >
                  📄 {ctx}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.8rem",
              paddingTop: "0.6rem",
              borderTop: "1px solid var(--m-line-soft)",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--m-muted)" }}>
              {selectedRef.status === "Confirmed"
                ? "✓ Reference is confirmed and ready."
                : selectedRef.status === "Follow-up due"
                  ? "⚠️ Overdue for follow-up message."
                  : "Request portal is active."}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {selectedRef.status === "Follow-up due" ||
              selectedRef.status === "Request sent" ? (
                <button
                  className="tracker-action-btn"
                  style={{
                    background: "var(--m-blue)",
                    color: "#ffffff",
                    padding: "5px 10px",
                    borderRadius: "6px",
                  }}
                  onClick={() => handleSendReminder(selectedRef)}
                >
                  Send reminder <ArrowRight size={12} />
                </button>
              ) : selectedRef.status === "Draft" ? (
                <button
                  className="tracker-action-btn"
                  style={{
                    background: "var(--m-blue)",
                    color: "#ffffff",
                    padding: "5px 10px",
                    borderRadius: "6px",
                  }}
                  onClick={() => handleSendReminder(selectedRef)}
                >
                  Send request link <ArrowRight size={12} />
                </button>
              ) : (
                <button
                  className="tracker-action-btn"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() =>
                    setToastMessage(
                      `Verified submission receipt for ${selectedRef.name} (Confidential).`,
                    )
                  }
                >
                  View receipt ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shared Context Summary Bar */}
      <div
        className="preview-summary"
        style={{ cursor: "pointer" }}
        onClick={() =>
          setToastMessage(
            `Reference status overview: ${confirmedCount} confirmed, ${sentCount} request sent, ${followUpCount} follow-up due.`,
          )
        }
      >
        <Users aria-hidden="true" />
        <span>
          <strong>Shared context stays visible</strong>
          {confirmedCount} confirmed, {sentCount} request sent, {followUpCount} follow-up due. Prompt & deadline connected.
        </span>
      </div>
    </PreviewFrame>
  );
}


