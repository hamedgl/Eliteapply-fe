export type CursorPage<T> = {
  items: T[];
  next_cursor?: string | null;
  has_more: boolean;
  total?: number | null;
};

