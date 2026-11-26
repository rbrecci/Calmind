import type { Page, PageQuery } from '../api/patient/types.ts';

export async function loadPatientPages<T>(load: (query: PageQuery) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  for (let current = 1; ; current++) {
    const result = await load({ page: current, per_page: 50 });
    items.push(...result.data);
    if (!result.data.length || items.length >= result.meta.total) return items;
  }
}
