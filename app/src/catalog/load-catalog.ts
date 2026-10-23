import { ApiError, type Api, type CatalogPsychologist, type Modality } from '../api/types.ts';

export type CatalogState =
  | { status: 'ready'; psychologists: CatalogPsychologist[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export async function loadCatalog(api: Pick<Api, 'catalogPsychologists'>): Promise<CatalogState> {
  try {
    const { data } = await api.catalogPsychologists();
    return data.length === 0 ? { status: 'empty' } : { status: 'ready', psychologists: data };
  } catch (error) {
    // Só a mensagem da API chega à tela: ela já vem em português e sem detalhe interno (contrato 2.3).
    return {
      status: 'error',
      message: error instanceof ApiError ? error.message : 'Não foi possível carregar os profissionais. Tente novamente.',
    };
  }
}

const MODALITY_LABELS: Record<Modality, string> = {
  online: 'Online',
  presencial: 'Presencial',
  ambos: 'Online e presencial',
};

export function modalityLabel(modality: Modality | null): string | null {
  return modality === null ? null : MODALITY_LABELS[modality];
}
