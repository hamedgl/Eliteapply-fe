export function ConflictNotice({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="conflict-notice" role="alert">
      <div>
        <strong>This item changed in another session.</strong>
        <p>Your attempted change was not applied. Refresh the latest version before trying again.</p>
      </div>
      <button type="button" onClick={onRefresh}>Refresh latest</button>
    </div>
  );
}
