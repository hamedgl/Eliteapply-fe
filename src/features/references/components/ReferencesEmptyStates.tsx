import { UserPlus, SearchX } from "lucide-react";
import { EmptyState } from "../../../components/data-display/EmptyState";

export function OnboardingEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={UserPlus}
      heading="Request your first academic reference"
      description="Invite a professor, supervisor or employer and track the request securely from invitation to verification."
      primaryAction={{ label: "Request reference", onClick: onCreate }}
    />
  );
}

export function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      variant="filtered"
      icon={SearchX}
      heading="No references match these filters"
      primaryAction={{ label: "Clear filters", onClick: onClear }}
    />
  );
}
