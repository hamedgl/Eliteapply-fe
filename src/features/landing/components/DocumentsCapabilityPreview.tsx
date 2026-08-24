import {
  ArrowRight,
  FileText,
  Filter,
  Folder,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PreviewFrame } from "../landingShared";


type DocumentItem = {
  id: string;
  name: string;
  mappedApps: string[];
  status: "Ready" | "Update needed" | "Missing";
  fileSize: string;
  lastUpdated: string;
  version: string;
  reqsCoveredCount: number;
};

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "transcript",
    name: "Academic transcript",
    mappedApps: ["Rhodes", "Global Futures"],
    status: "Ready",
    fileSize: "2.4 MB",
    lastUpdated: "12 Aug",
    version: "v2.1",
    reqsCoveredCount: 3,
  },
  {
    id: "degree",
    name: "Degree certificate",
    mappedApps: ["Rhodes"],
    status: "Ready",
    fileSize: "1.1 MB",
    lastUpdated: "5 Jun",
    version: "v1.0",
    reqsCoveredCount: 2,
  },
  {
    id: "proposal",
    name: "Research proposal",
    mappedApps: ["Research Fellowship"],
    status: "Update needed",
    fileSize: "840 KB",
    lastUpdated: "15 Jul",
    version: "v1.2",
    reqsCoveredCount: 2,
  },
  {
    id: "portfolio",
    name: "Community impact portfolio",
    mappedApps: ["Rhodes", "Fulbright"],
    status: "Ready",
    fileSize: "4.8 MB",
    lastUpdated: "18 Aug",
    version: "v3.0",
    reqsCoveredCount: 2,
  },
  {
    id: "financial",
    name: "Financial declaration form",
    mappedApps: [],
    status: "Missing",
    fileSize: "—",
    lastUpdated: "Not uploaded",
    version: "—",
    reqsCoveredCount: 0,
  },
];

const AVAILABLE_APPS = [
  "Rhodes",
  "Global Futures",
  "Research Fellowship",
  "Fulbright",
  "Schwarzman",
];


export function DocumentsCapabilityPreview() {
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [selectedId, setSelectedId] = useState<string>("transcript");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterBarOpen, setIsFilterBarOpen] = useState<boolean>(false);
  const [isMappingPickerOpen, setIsMappingPickerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleAppMapping = (docId: string, appName: string) => {
    setDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const isMapped = doc.mappedApps.includes(appName);
        const updatedApps = isMapped
          ? doc.mappedApps.filter((a) => a !== appName)
          : [...doc.mappedApps, appName];
        return {
          ...doc,
          mappedApps: updatedApps,
          status:
            updatedApps.length === 0
              ? "Missing"
              : doc.status === "Missing"
                ? "Ready"
                : doc.status,
        };
      }),
    );
  };

  const handleUploadNewVersion = (doc: DocumentItem) => {
    setDocs((prev) =>
      prev.map((d) => {
        if (d.id !== doc.id) return d;
        const verNum = parseFloat(d.version.replace("v", "")) || 1.0;
        const nextVer = `v${(verNum + 0.1).toFixed(1)}`;
        return {
          ...d,
          status: "Ready",
          version: nextVer,
          lastUpdated: "Just now",
          fileSize: d.fileSize === "—" ? "1.8 MB" : d.fileSize,
        };
      }),
    );
    setToastMessage(
      `Uploaded ${doc.name} ${doc.status === "Missing" ? "v1.0" : "newer version"}! Status is now Ready.`,
    );
  };

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.mappedApps.some((a) =>
        a.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    const matchesStatus =
      statusFilter === "all" ||
      doc.status.toLowerCase().replace(/\s+/g, "-") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedDoc = docs.find((d) => d.id === selectedId) || filteredDocs[0];

  const readyMappedCount = docs.filter(
    (d) => d.status === "Ready" && d.mappedApps.length > 0,
  ).length;
  const connectedCount = Math.min(9, 5 + readyMappedCount);

  return (
    <PreviewFrame title="Documents and evidence">
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
          placeholder="Search documents or mapped applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search documents"
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
            { id: "ready", label: "Ready" },
            { id: "update-needed", label: "Update needed" },
            { id: "missing", label: "Missing" },
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

      {/* Document List */}
      <div className="document-preview-list">
        {filteredDocs.length === 0 ? (
          <div
            style={{
              padding: "1.5rem",
              textAlign: "center",
              color: "var(--m-muted)",
              fontSize: "0.82rem",
            }}
          >
            No documents found matching "{searchTerm}".
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                tabIndex={0}
                onClick={() => setSelectedId(doc.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(doc.id);
                  }
                }}
                className={`tracker-row-item ${isSelected ? "selected" : ""}`}
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
                <FileText
                  aria-hidden="true"
                  style={{
                    color: isSelected ? "var(--m-blue)" : "var(--m-muted)",
                  }}
                />
                <span>
                  <strong>{doc.name}</strong>
                  <small>
                    {doc.mappedApps.length > 0
                      ? `Mapped to ${doc.mappedApps.join(", ")}`
                      : "Not mapped to any application"}
                  </small>
                </span>
                <em
                  className={
                    doc.status === "Update needed"
                      ? "attention"
                      : doc.status === "Missing"
                        ? "missing"
                        : ""
                  }
                >
                  {doc.status}
                </em>
              </div>
            );
          })
        )}
      </div>

      {/* Document Workspace Details Inspector Card */}
      {selectedDoc && (
        <div
          className="tracker-detail-card"
          style={{ margin: "0.5rem 1.25rem 1rem" }}
        >
          <div className="tracker-detail-header">
            <div>
              <h4>{selectedDoc.name}</h4>
              <p>
                Size: <strong>{selectedDoc.fileSize}</strong> • Version:{" "}
                <strong>{selectedDoc.version}</strong> • Updated:{" "}
                {selectedDoc.lastUpdated}
              </p>
            </div>
            <em
              className={
                selectedDoc.status === "Update needed"
                  ? "attention"
                  : selectedDoc.status === "Missing"
                    ? "missing"
                    : ""
              }
            >
              {selectedDoc.status}
            </em>
          </div>

          <div style={{ fontSize: "0.8rem", margin: "0.5rem 0" }}>
            <strong style={{ color: "var(--m-text-strong)" }}>
              Mapped applications:
            </strong>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                marginTop: "0.4rem",
              }}
            >
              {selectedDoc.mappedApps.length === 0 ? (
                <span style={{ fontSize: "0.75rem", color: "var(--m-muted)" }}>
                  No applications mapped yet.
                </span>
              ) : (
                selectedDoc.mappedApps.map((appName) => (
                  <span
                    key={appName}
                    className="tracker-filter-chip active"
                    style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                    onClick={() => toggleAppMapping(selectedDoc.id, appName)}
                    title="Click to unmap"
                  >
                    {appName} ✕
                  </span>
                ))
              )}
              <button
                className="tracker-action-btn"
                style={{ fontSize: "0.72rem" }}
                onClick={() => setIsMappingPickerOpen(!isMappingPickerOpen)}
              >
                + Manage mappings
              </button>
            </div>

            {/* Mapping Selector */}
            {isMappingPickerOpen && (
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem",
                  background: "var(--m-canvas)",
                  borderRadius: "6px",
                  border: "1px solid var(--m-line-soft)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--m-text-strong)",
                  }}
                >
                  Toggle mapping:
                </span>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.3rem",
                    marginTop: "0.3rem",
                  }}
                >
                  {AVAILABLE_APPS.map((appName) => {
                    const isMapped = selectedDoc.mappedApps.includes(appName);
                    return (
                      <button
                        key={appName}
                        className={`tracker-filter-chip ${isMapped ? "active" : ""}`}
                        style={{ fontSize: "0.72rem" }}
                        onClick={() => toggleAppMapping(selectedDoc.id, appName)}
                      >
                        {isMapped ? `✓ ${appName}` : `+ ${appName}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
              {selectedDoc.status === "Update needed"
                ? "⚠️ Needs newer document version for 2026 application cycle."
                : "Document is connected and verified."}
            </span>
            <button
              className="tracker-action-btn"
              style={{
                background: "var(--m-blue)",
                color: "#ffffff",
                padding: "5px 10px",
                borderRadius: "6px",
              }}
              onClick={() => handleUploadNewVersion(selectedDoc)}
            >
              {selectedDoc.status === "Missing"
                ? "Upload document"
                : "Upload newer version"}{" "}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Requirement Coverage Summary Bar */}
      <div
        className="preview-summary"
        style={{ cursor: "pointer" }}
        onClick={() =>
          setToastMessage(
            `Requirement coverage: ${connectedCount} of 9 document requirements connected across all applications.`,
          )
        }
      >
        <Folder aria-hidden="true" />
        <span>
          <strong>Requirement coverage</strong>
          {connectedCount} of 9 document requirements connected
        </span>
      </div>
    </PreviewFrame>
  );
}


