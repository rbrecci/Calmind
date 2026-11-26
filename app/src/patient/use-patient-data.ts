import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { errorMessage } from './presentation';

export function usePatientData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lifecycle = useRef({ active: false, sequence: 0 });
  const reload = useCallback(async () => {
    const scope = lifecycle.current;
    const sequence = ++scope.sequence;
    setLoading(true); setError(null);
    try {
      const result = await load();
      if (scope.active && scope.sequence === sequence) setData(result);
    } catch (e) {
      if (scope.active && scope.sequence === sequence) setError(errorMessage(e));
    } finally {
      if (scope.active && scope.sequence === sequence) setLoading(false);
    }
  }, [load]);
  useFocusEffect(useCallback(() => {
    const scope = lifecycle.current;
    scope.active = true;
    void reload();
    return () => { scope.active = false; scope.sequence++; };
  }, [reload]));
  return { data, loading, error, reload };
}
