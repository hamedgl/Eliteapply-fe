import type { RefObject } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { label, stages, type Application } from "../model";
import { useApplicationSubtitle } from "../hooks";
import { DeadlineCell, PriorityDot } from "./Badges";
import { ReadinessIndicator } from "./ReadinessIndicator";
import { RowActionMenu, type ActionKind } from "./RowActionMenu";

export function ApplicationsBoard({
  visibleStages,
  appsByStage,
  boardApps,
  collapsedStages,
  toggleStage,
  draggedId,
  setDraggedId,
  draggedIdRef,
  dragOverStage,
  setDragOverStage,
  moveApplication,
  updatePending,
  onAction,
}: {
  visibleStages: string[];
  appsByStage: Map<string, Application[]>;
  boardApps: Application[];
  collapsedStages: Set<string>;
  toggleStage: (stage: string) => void;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  draggedIdRef: RefObject<string | null>;
  dragOverStage: string | null;
  setDragOverStage: (stage: string | null) => void;
  moveApplication: (app: Application, next: string) => void;
  updatePending: boolean;
  onAction: (app: Application, kind: ActionKind) => void;
}) {
  return (
    <div className="apps-board" aria-label="Application board">
      {visibleStages.map((column) => {
        const columnApps = appsByStage.get(column) ?? [];
        const collapsed = collapsedStages.has(column);
        const isDropTarget = dragOverStage === column;
        return (
          <section
            className={`apps-board-column${collapsed ? " is-collapsed" : ""}${isDropTarget ? " is-drop-target" : ""}`}
            key={column}
            aria-labelledby={`column-${column}-title`}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dragOverStage !== column) setDragOverStage(column);
            }}
            onDragLeave={(event) => {
              if (
                !event.relatedTarget ||
                !event.currentTarget.contains(event.relatedTarget as Node)
              )
                setDragOverStage(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const appId =
                event.dataTransfer.getData("text/plain") || draggedIdRef.current;
              const app = boardApps.find((item) => item.id === appId);
              draggedIdRef.current = null;
              setDraggedId(null);
              setDragOverStage(null);
              if (app) moveApplication(app, column);
            }}
          >
            <header className="apps-board-column-header">
              <button
                type="button"
                className="apps-board-column-toggle"
                aria-expanded={!collapsed}
                aria-controls={`column-${column}-content`}
                aria-label={`${collapsed ? "Expand" : "Collapse"} ${label(column)}`}
                title={label(column)}
                onClick={() => toggleStage(column)}
              >
                {collapsed ? (
                  <ChevronRight aria-hidden="true" />
                ) : (
                  <ChevronDown aria-hidden="true" />
                )}
                <span id={`column-${column}-title`}>{label(column)}</span>
                <strong>{columnApps.length}</strong>
              </button>
            </header>
            <div
              className="apps-board-column-content"
              id={`column-${column}-content`}
              hidden={collapsed}
            >
              {columnApps.map((app) => (
                <BoardCard
                  key={app.id}
                  app={app}
                  dragging={draggedId === app.id}
                  updatePending={updatePending}
                  onDragStart={() => {
                    draggedIdRef.current = app.id;
                    setDraggedId(app.id);
                  }}
                  onDragEnd={() => {
                    draggedIdRef.current = null;
                    setDraggedId(null);
                    setDragOverStage(null);
                  }}
                  onMove={(next) => moveApplication(app, next)}
                  onAction={(kind) => onAction(app, kind)}
                />
              ))}
              {!columnApps.length ? (
                <div className="apps-column-empty">
                  {draggedId ? "Drop application here" : "No applications in this stage"}
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function BoardCard({
  app,
  dragging,
  updatePending,
  onDragStart,
  onDragEnd,
  onMove,
  onAction,
}: {
  app: Application;
  dragging: boolean;
  updatePending: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (next: string) => void;
  onAction: (kind: ActionKind) => void;
}) {
  const subtitle = useApplicationSubtitle(app);
  return (
    <article
      className={`apps-board-card${dragging ? " is-dragging" : ""}`}
      aria-labelledby={`application-${app.id}-title`}
    >
      <div className="apps-board-card-heading">
        <span
          className="apps-board-drag-handle"
          draggable={!updatePending}
          title={`Drag ${app.title}`}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", app.id);
            onDragStart();
          }}
          onDragEnd={onDragEnd}
        >
          <GripVertical aria-hidden="true" />
        </span>
        <div>
          <Link to={`/app/applications/${app.id}`}>
            <h3 id={`application-${app.id}-title`}>{app.title}</h3>
          </Link>
          {subtitle.name ? <p>{subtitle.name}</p> : null}
        </div>
        <RowActionMenu app={app} pending={updatePending} onAction={onAction} />
      </div>
      <div className="apps-board-card-meta">
        <DeadlineCell app={app} />
        <PriorityDot priority={app.priority} />
        <ReadinessIndicator
          appId={app.id}
          readinessPercent={app.readiness_percent}
          readinessData={app.readiness}
        />
      </div>
      {app.tags.length ? (
        <div className="apps-board-card-tags">
          {app.tags.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}
      <label className="apps-board-card-stage">
        Move to
        <select
          aria-label={`Move ${app.title}`}
          value={app.stage}
          disabled={updatePending}
          onChange={(event) => onMove(event.target.value)}
        >
          {stages.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
