import type { Page } from '../api/psychologist/types.ts';

export type ResourceState<T> = { data: T | null; error: unknown; loading: boolean };

export function createResource<T>(notify: (state: ResourceState<T>) => void) {
  let generation = 0;
  let disposed = false;
  // O dado anterior fica na tela durante a recarga: zerar desmontaria a lista a cada foco da aba,
  // e os cartões refariam a entrada animada toda vez.
  let last: T | null = null;
  return {
    async load(loader: () => Promise<T>) {
      if (disposed) return;
      const current = ++generation;
      notify({ data: last, error: null, loading: true });
      try {
        const data = await loader();
        if (!disposed && current === generation) { last = data; notify({ data, error: null, loading: false }); }
      } catch (error) {
        if (!disposed && current === generation) { last = null; notify({ data: null, error, loading: false }); }
      }
    },
    dispose() { disposed = true; generation++; },
  };
}

export async function collectPages<T>(load: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  for (;;) {
    const result = await load(page++);
    items.push(...result.data);
    if (!result.data.length || result.meta.page * result.meta.per_page >= result.meta.total) return items;
  }
}
