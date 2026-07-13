export const newMutationId = () => crypto.randomUUID();

export function mutationIdFor(registry: Map<string, string>, action: string) {
  const existing = registry.get(action);
  if (existing) return existing;
  const id = newMutationId();
  registry.set(action, id);
  return id;
}
