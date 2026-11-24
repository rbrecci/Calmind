import type { CatalogFilters } from '../api/patient/types.ts';

const TEXT_FILTERS = ['approach', 'specialty', 'region'] as const;

export function catalogQuery(filters: CatalogFilters): CatalogFilters {
  const query: CatalogFilters = {};
  for (const key of TEXT_FILTERS) {
    const value = filters[key]?.trim();
    if (value) query[key] = value;
  }
  if (filters.modality) query.modality = filters.modality;
  return query;
}

export function countCatalogFilters(filters: CatalogFilters): number {
  return Object.keys(catalogQuery(filters)).length;
}

export function hasCatalogFilters(filters: CatalogFilters): boolean {
  return Object.keys(catalogQuery(filters)).length > 0;
}
