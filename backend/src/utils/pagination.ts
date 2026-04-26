export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function buildPage<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Page<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function getSkipLimit(
  page = 1,
  pageSize = 10,
): { skip: number; limit: number; page: number; pageSize: number } {
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  return {
    skip: (safePage - 1) * safeSize,
    limit: safeSize,
    page: safePage,
    pageSize: safeSize,
  };
}
