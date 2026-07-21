import { FolderOpen, SearchX } from "lucide-react";
import { EmptyState } from "../../../components/data-display/EmptyState";

export function OnboardingEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      heading="Keep every application document in one place"
      description="Upload transcripts, certificates and supporting evidence once, then reuse them across applications."
      primaryAction={{ label: "Upload document", onClick: onUpload }}
    />
  );
}

export function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      variant="filtered"
      icon={SearchX}
      heading="No documents match these filters"
      primaryAction={{ label: "Clear filters", onClick: onClear }}
    />
  );
}
