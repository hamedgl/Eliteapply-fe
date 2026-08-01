import { GeneratedPageSkeleton } from "../../../components/page/PageSkeleton";

export function ApplicationsSkeleton({ view = "board" }: { view?: "board" | "list" }) {
  return <GeneratedPageSkeleton page={view === "board" ? "applicationsBoard" : "applicationsList"} />;
}
