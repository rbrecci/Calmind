import { useMemo } from 'react';

// Fonte de imagem estável entre renderizações. Na web o expo-image busca de novo a cada objeto
// novo de fonte com cabeçalhos, e quem chama costuma montar os cabeçalhos a cada renderização.
export function useImageSource(uri: string | null | undefined, headers: Record<string, string> | undefined) {
  const headerKey = headers ? JSON.stringify(headers) : '';
  return useMemo(() => (uri ? { uri, headers: headerKey ? JSON.parse(headerKey) as Record<string, string> : undefined } : null), [uri, headerKey]);
}
