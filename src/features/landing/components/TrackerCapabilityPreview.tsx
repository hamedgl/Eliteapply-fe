import {
  ArrowRight,
  Filter,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { PreviewFrame } from "../landingShared";


type TrackerAppItem = {
  id: string;
  name: string;
  grantor: string;
  status: "In progress" | "Planning" | "Drafting" | "Submitted";
  priority: "High" | "Medium" | "Normal";
  deadline: string;
  daysLeft: number;
  nextAction: string;
  requirements: { id: string; label: string; done: boolean }[];
};

const INITIAL_TRACKER_APPS: TrackerAppItem[] = [
  {
    id: "rhodes",
    name: "Rhodes Scholarship",
    grantor: "University of Oxford",
    status: "In progress",
    priority: "High",
    deadline: "15 Sep",
    daysLeft: 54,
    nextAction: "Connect evidence",
    requirements: [
      { id: "stmt", label: "Personal statement (1,000 words)", done: true },
      { id: "refs", label: "3 Academic & leadership references", done: true },
      { id: "trans", label: "Certified university transcript", done: true },
      { id: "evid", label: "Community impact evidence portfolio", done: false },
    ],
  },
  {
    id: "futures",
    name: "Global Futures",
    grantor: "Cambridge Trust",
    status: "Planning",
    priority: "Medium",
    deadline: "2 Oct",
    daysLeft: 71,
    nextAction: "Review requirements",
    requirements: [
      { id: "prop", label: "Research proposal outline", done: true },
      { id: "budg", label: "Estimated study budget plan", done: false },
      { id: "cv", label: "Academic CV (2 pages)", done: true },
      { id: "sup", label: "Faculty sponsor nomination", done: false },
    ],
  },
  {
    id: "fellowship",
    name: "Research Fellowship",
    grantor: "Stanford Graduate School",
    status: "Drafting",
    priority: "High",
    deadline: "18 Oct",
    daysLeft: 87,
    nextAction: "Continue statement",
    requirements: [
      { id: "abstr", label: "Abstract & summary statement", done: true },
      { id: "pub", label: "Publication & project list", done: true },
      { id: "essay", label: "Motivation statement draft", done: false },
      { id: "rec", label: "Department recommendation letter", done: false },
    ],
  },
  {
    id: "fulbright",
    name: "Fulbright Award",
    grantor: "US-UK Educational Commission",
    status: "In progress",
    priority: "High",
    deadline: "24 Oct",
    daysLeft: 93,
    nextAction: "Finalize budget",
    requirements: [
      { id: "host", label: "Host institution affiliation letter", done: true },
      { id: "proj", label: "Project statement", done: true },
      { id: "budg2", label: "Travel & living allowance budget", done: false },
      { id: "ref2", label: "Language evaluation form", done: true },
    ],
  },
  {
    id: "schwarzman",
    name: "Schwarzman Scholars",
    grantor: "Tsinghua University",
    status: "Submitted",
    priority: "Normal",
    deadline: "1 Nov",
    daysLeft: 101,
    nextAction: "Prepare interview",
    requirements: [
      { id: "video", label: "1-minute video introduction", done: true },
      { id: "essay2", label: "Leadership essay", done: true },
      { id: "app", label: "Submitted application form", done: true },
    ],
  },
];


export function TrackerPreview() {
  const [apps, setApps] = useState<TrackerAppItem[]>(INITIAL_TRACKER_APPS);
  const [selectedId, setSelectedId] = useState<string>("rhodes");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterBarOpen, setIsFilterBarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleRequirement = (appId: string, reqId: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        const updatedReqs = app.requirements.map((r) =>
          r.id === reqId ? { ...r, done: !r.done } : r,
        );
        const doneCount = updatedReqs.filter((r) => r.done).length;
        const newProgress = Math.round((doneCount / updatedReqs.length) * 100);
        return {
          ...app,
          requirements: updatedReqs,
          status:
            newProgress === 100
              ? "Submitted"
              : app.status === "Submitted"
                ? "In progress"
                : app.status,
        };
      }),
    );
  };

  const handleNextActionClick = (app: TrackerAppItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(app.id);
    setToastMessage(`Triggered action: "${app.nextAction}" for ${app.name}`);
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.grantor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.nextAction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      app.status.toLowerCase().replace(/\s+/g, "-") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedApp = apps.find((a) => a.id === selectedId) || filteredApps[0];

  const getStatusClass = (status: string) => {
    switch (status) {
      case "In progress":
        return "in-progress";
      case "Planning":
        return "planning";
      case "Drafting":
        return "drafting";
      case "Submitted":
        return "submitted";
      default:
        return "in-progress";
    }
  };

  return (
    <PreviewFrame title="Applications">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="tracker-toast-bar" role="status">
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
      <div className="preview-toolbar">
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          className="tracker-search-input"
          placeholder="Search applications (e.g. Rhodes, Stanford)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search applications"
        />
        {searchTerm && (
          <button
            className="tracker-icon-btn"
            onClick={() => setSearchTerm("")}
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
        <button
          className={`tracker-icon-btn ${isFilterBarOpen || statusFilter !== "all" ? "active" : ""}`}
          onClick={() => setIsFilterBarOpen((prev) => !prev)}
          title="Filter status"
          aria-label="Toggle status filter"
        >
          <Filter size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Toggleable Filter Chips */}
      {isFilterBarOpen && (
        <div className="tracker-filter-bar">
          <span style={{ color: "var(--m-muted)", fontWeight: 600 }}>Status:</span>
          {[
            { id: "all", label: "All" },
            { id: "in-progress", label: "In progress" },
            { id: "planning", label: "Planning" },
            { id: "drafting", label: "Drafting" },
            { id: "submitted", label: "Submitted" },
          ].map((chip) => (
            <button
              key={chip.id}
              className={`tracker-filter-chip ${statusFilter === chip.id ? "active" : ""}`}
              onClick={() => setStatusFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
          {statusFilter !== "all" && (
            <button
              className="tracker-action-btn"
              style={{ fontSize: "0.72rem", marginLeft: "auto" }}
              onClick={() => setStatusFilter("all")}
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* Applications Table */}
      <div
        className="tracker-table"
        role="table"
        aria-label="Sample scholarship applications"
      >
        <div className="tracker-row tracker-head" role="row">
          <span role="columnheader">Application</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Deadline</span>
          <span role="columnheader">Progress</span>
          <span role="columnheader">Next action</span>
        </div>

        {filteredApps.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--m-muted)",
              fontSize: "0.85rem",
            }}
          >
            No applications found matching "{searchTerm}".
            <br />
            <button
              className="tracker-action-btn"
              style={{ marginTop: "0.5rem" }}
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredApps.map((app) => {
            const doneCount = app.requirements.filter((r) => r.done).length;
            const progressPct = Math.round(
              (doneCount / app.requirements.length) * 100,
            );
            const isSelected = selectedApp?.id === app.id;

            return (
              <div
                className={`tracker-row ${isSelected ? "selected" : ""}`}
                role="row"
                tabIndex={0}
                key={app.id}
                onClick={() => setSelectedId(app.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(app.id);
                  }
                }}
                aria-selected={isSelected}
              >
                <span role="cell">
                  <strong>{app.name}</strong>
                  <br />
                  <small style={{ color: "var(--m-muted)", fontWeight: 400 }}>
                    {app.grantor}
                  </small>
                </span>
                <span role="cell">
                  <span className={`status-pill ${getStatusClass(app.status)}`}>
                    {app.status}
                  </span>
                </span>
                <span role="cell">{app.deadline}</span>
                <span role="cell">
                  <i className="mini-progress">
                    <b style={{ "--fill": progressPct / 100 } as CSSProperties} />
                  </i>
                  {progressPct}%
                </span>
                <span role="cell">
                  <button
                    className="tracker-action-btn"
                    onClick={(e) => handleNextActionClick(app, e)}
                    title={`Action: ${app.nextAction}`}
                  >
                    {app.nextAction} <ArrowRight size={12} />
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Application Workspace Detail Card */}
      {selectedApp && (
        <div className="tracker-detail-card">
          <div className="tracker-detail-header">
            <div>
              <h4>{selectedApp.name}</h4>
              <p>
                {selectedApp.grantor} • Priority:{" "}
                <span style={{ fontWeight: 600, color: "var(--m-text-strong)" }}>
                  {selectedApp.priority}
                </span>{" "}
                • {selectedApp.daysLeft} days left ({selectedApp.deadline})
              </p>
            </div>
            <span className={`status-pill ${getStatusClass(selectedApp.status)}`}>
              {selectedApp.status}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              margin: "0.5rem 0",
            }}
          >
            <span style={{ color: "var(--m-text-strong)", fontWeight: 600 }}>
              Requirements checklist (
              {selectedApp.requirements.filter((r) => r.done).length} of{" "}
              {selectedApp.requirements.length} complete):
            </span>
            <span style={{ color: "var(--m-blue)", fontWeight: 600 }}>
              {Math.round(
                (selectedApp.requirements.filter((r) => r.done).length /
                  selectedApp.requirements.length) *
                  100,
              )}
              % overall progress
            </span>
          </div>

          {/* Checklist items */}
          <div className="tracker-req-list">
            {selectedApp.requirements.map((req) => (
              <label
                key={req.id}
                className={`tracker-req-item ${req.done ? "done" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRequirement(selectedApp.id, req.id);
                  setToastMessage(
                    `${req.done ? "Unchecked" : "Completed"}: "${req.label}"`,
                  );
                }}
              >
                <input
                  type="checkbox"
                  checked={req.done}
                  onChange={() => {}}
                  style={{ accentColor: "var(--m-blue)" }}
                />
                <span>{req.label}</span>
              </label>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "1rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--m-line-soft)",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "var(--m-muted)" }}>
              Tip: Click any requirement item to update progress live!
            </span>
            <button
              className="tracker-action-btn"
              style={{
                background: "var(--m-blue)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "6px",
              }}
              onClick={(e) => handleNextActionClick(selectedApp, e)}
            >
              {selectedApp.nextAction} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </PreviewFrame>
  );
}


