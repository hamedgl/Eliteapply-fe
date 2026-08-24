import {
  ArrowRight,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PreviewFrame } from "../landingShared";


type TaskItem = {
  id: string;
  label: string;
  done: boolean;
};

type ReadinessArea = {
  id: string;
  name: string;
  status: string;
  action: string;
  tasks: TaskItem[];
};

type ApplicationReadinessData = {
  id: string;
  appName: string;
  daysToDeadline: number;
  deadlineDate: string;
  areas: ReadinessArea[];
};

const INITIAL_READINESS_APPS: ApplicationReadinessData[] = [
  {
    id: "rhodes",
    appName: "Rhodes Scholarship",
    daysToDeadline: 18,
    deadlineDate: "15 Sep",
    areas: [
      {
        id: "reqs",
        name: "Requirements coverage",
        status: "2 missing",
        action: "Review",
        tasks: [
          { id: "r1", label: "Personal statement (1,000 words)", done: true },
          { id: "r2", label: "Certified transcript", done: true },
          { id: "r3", label: "Community impact portfolio", done: false },
          { id: "r4", label: "Financial declaration", done: false },
        ],
      },
      {
        id: "evidence",
        name: "Evidence coverage",
        status: "3 need attention",
        action: "Review",
        tasks: [
          { id: "e1", label: "Peer support program metric", done: true },
          { id: "e2", label: "Faculty mentor verification letter", done: false },
          { id: "e3", label: "Community research data log", done: false },
          { id: "e4", label: "Award certificate scan", done: false },
        ],
      },
      {
        id: "writing",
        name: "Writing status",
        status: "Draft in review",
        action: "Open draft",
        tasks: [
          { id: "w1", label: "Core narrative structure", done: true },
          { id: "w2", label: "Specific outcome metric added", done: true },
          { id: "w3", label: "Proofreading & word count check", done: false },
        ],
      },
      {
        id: "refs",
        name: "Reference status",
        status: "1 follow-up due",
        action: "Follow up",
        tasks: [
          { id: "rf1", label: "Dr A. Khan (Academic)", done: true },
          { id: "rf2", label: "Prof. D. Okoro (Research)", done: true },
          { id: "rf3", label: "M. Priya Nair (Leadership)", done: false },
        ],
      },
      {
        id: "decl",
        name: "Declaration status",
        status: "Not started",
        action: "Complete",
        tasks: [
          { id: "d1", label: "Academic integrity affirmation", done: false },
          { id: "d2", label: "Final submission consent", done: false },
        ],
      },
    ],
  },
  {
    id: "fulbright",
    appName: "Fulbright Award",
    daysToDeadline: 35,
    deadlineDate: "24 Oct",
    areas: [
      {
        id: "reqs2",
        name: "Requirements coverage",
        status: "1 missing",
        action: "Review",
        tasks: [
          { id: "fr1", label: "Host institution affiliation letter", done: true },
          { id: "fr2", label: "Project statement", done: true },
          { id: "fr3", label: "Travel budget plan", done: false },
        ],
      },
      {
        id: "evidence2",
        name: "Evidence coverage",
        status: "All covered",
        action: "Verified",
        tasks: [
          { id: "fe1", label: "Language evaluation", done: true },
          { id: "fe2", label: "Publication record", done: true },
        ],
      },
      {
        id: "writing2",
        name: "Writing status",
        status: "Polished & ready",
        action: "Open draft",
        tasks: [
          { id: "fw1", label: "Final proofreading complete", done: true },
        ],
      },
      {
        id: "refs2",
        name: "Reference status",
        status: "All confirmed",
        action: "Complete",
        tasks: [
          { id: "frf1", label: "3 of 3 References confirmed", done: true },
        ],
      },
      {
        id: "decl2",
        name: "Declaration status",
        status: "Signed",
        action: "Signed",
        tasks: [
          { id: "fd1", label: "Full consent verified", done: true },
        ],
      },
    ],
  },
];


export function ReadinessCapabilityPreview() {
  const [apps, setApps] = useState<ApplicationReadinessData[]>(
    INITIAL_READINESS_APPS,
  );
  const [selectedAppId, setSelectedAppId] = useState<string>("rhodes");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("reqs");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleTask = (appId: string, areaId: string, taskId: string) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        const updatedAreas = app.areas.map((area) => {
          if (area.id !== areaId) return area;
          const updatedTasks = area.tasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t,
          );
          const doneCount = updatedTasks.filter((t) => t.done).length;
          const totalCount = updatedTasks.length;
          const isComplete = doneCount === totalCount;
          let newStatus = area.status;
          if (isComplete) {
            newStatus = "All complete ✓";
          } else {
            const missing = totalCount - doneCount;
            newStatus = `${missing} missing`;
          }
          return {
            ...area,
            tasks: updatedTasks,
            status: newStatus,
            action: isComplete ? "Verified ✓" : area.action.replace(" ✓", ""),
          };
        });
        return { ...app, areas: updatedAreas };
      }),
    );
  };

  const selectedApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  const totalTasks = selectedApp.areas.flatMap((a) => a.tasks);
  const doneTasks = totalTasks.filter((t) => t.done);
  const readinessPct = Math.round(
    (doneTasks.length / totalTasks.length) * 100,
  );

  const selectedArea =
    selectedApp.areas.find((a) => a.id === selectedAreaId) ||
    selectedApp.areas[0];

  const handleQuickAction = (area: ReadinessArea, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAreaId(area.id);
    const incompleteTask = area.tasks.find((t) => !t.done);
    if (incompleteTask) {
      toggleTask(selectedApp.id, area.id, incompleteTask.id);
      setToastMessage(
        `Completed task: "${incompleteTask.label}" in ${area.name}`,
      );
    } else {
      setToastMessage(`All items in ${area.name} are already verified!`);
    }
  };

  return (
    <PreviewFrame title="Application readiness">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="tracker-toast-bar"
          role="status"
          style={{ margin: "0.5rem 1.25rem 0" }}
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

      {/* Application Switcher Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.75rem 1.25rem 0.25rem",
          fontSize: "0.8rem",
          overflowX: "auto",
        }}
      >
        {apps.map((app) => (
          <button
            key={app.id}
            className={`tracker-filter-chip ${selectedAppId === app.id ? "active" : ""}`}
            onClick={() => setSelectedAppId(app.id)}
          >
            {app.appName}
          </button>
        ))}
      </div>

      {/* Overview Banner */}
      <div
        className="readiness-overview"
        style={{
          background: readinessPct === 100 ? "#ecfdf5" : "var(--m-pale)",
          transition: "background 0.3s ease",
        }}
      >
        <span>
          <strong
            style={{
              color: readinessPct === 100 ? "#047857" : "var(--m-blue)",
            }}
          >
            {readinessPct}%
          </strong>{" "}
          {readinessPct === 100
            ? "ready for final submission! 🎉"
            : "ready for final review"}
        </span>
        <small>
          {selectedApp.daysToDeadline} days to deadline (
          {selectedApp.deadlineDate})
        </small>
      </div>

      {/* Area Rows List */}
      <div className="readiness-list">
        {selectedApp.areas.map((row) => {
          const isAreaSelected = selectedArea?.id === row.id;
          const isComplete = row.tasks.every((t) => t.done);
          return (
            <div
              key={row.id}
              tabIndex={0}
              onClick={() => setSelectedAreaId(row.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedAreaId(row.id);
                }
              }}
              style={{
                cursor: "pointer",
                padding: "0.65rem 0.8rem",
                borderRadius: "6px",
                margin: "2px 0",
                background: isAreaSelected
                  ? "var(--m-selected)"
                  : "transparent",
                borderLeft: isAreaSelected
                  ? "3px solid var(--m-blue)"
                  : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontWeight: isAreaSelected ? 600 : 400 }}>
                {row.name}
              </span>
              <em
                style={{
                  color: isComplete
                    ? "var(--m-success)"
                    : "var(--m-warning)",
                }}
              >
                {row.status}
              </em>
              <b
                onClick={(e) => handleQuickAction(row, e)}
                style={{ cursor: "pointer" }}
                title={`Click to resolve ${row.name}`}
              >
                {row.action}
              </b>
            </div>
          );
        })}
      </div>

      {/* Selected Readiness Area Task Inspector */}
      {selectedArea && (
        <div
          className="tracker-detail-card"
          style={{ margin: "0.5rem 1.25rem 1rem" }}
        >
          <div className="tracker-detail-header">
            <div>
              <h4>{selectedArea.name}</h4>
              <p>
                {selectedArea.tasks.filter((t) => t.done).length} of{" "}
                {selectedArea.tasks.length} items complete
              </p>
            </div>
            <em
              style={{
                color: selectedArea.tasks.every((t) => t.done)
                  ? "var(--m-success)"
                  : "var(--m-warning)",
              }}
            >
              {selectedArea.status}
            </em>
          </div>

          <div className="tracker-req-list">
            {selectedArea.tasks.map((task) => (
              <label
                key={task.id}
                className={`tracker-req-item ${task.done ? "done" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTask(selectedApp.id, selectedArea.id, task.id);
                  setToastMessage(
                    `${task.done ? "Unchecked" : "Completed"}: "${task.label}"`,
                  );
                }}
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => {}}
                  style={{ accentColor: "var(--m-blue)" }}
                />
                <span>{task.label}</span>
              </label>
            ))}
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
              Tip: Click items to toggle readiness status live!
            </span>
            <button
              className="tracker-action-btn"
              style={{
                background: "var(--m-blue)",
                color: "#ffffff",
                padding: "5px 10px",
                borderRadius: "6px",
              }}
              onClick={(e) => handleQuickAction(selectedArea, e)}
            >
              {selectedArea.action} <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      <p className="readiness-disclaimer">
        Readiness shows what is complete or missing. It does not predict an
        award decision.
      </p>
    </PreviewFrame>
  );
}


