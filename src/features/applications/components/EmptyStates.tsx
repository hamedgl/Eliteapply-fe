import { Link } from "react-router-dom";
import { FolderPlus, SearchX } from "lucide-react";
import { EmptyState } from "../../../components/data-display/EmptyState";

export function OnboardingEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={FolderPlus}
      heading="Start your first application"
      description="Track deadlines, requirements, documents and references for every scholarship or university application in one workspace."
      primaryAction={{ label: "Add application", onClick: onCreate }}
      secondaryAction={<Link to="/app/catalogue">Explore scholarships</Link>}
    />
  );
}

export function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      variant="filtered"
      icon={SearchX}
      heading="No applications match these filters"
      primaryAction={{ label: "Clear filters", onClick: onClear }}
    />
  );
}
