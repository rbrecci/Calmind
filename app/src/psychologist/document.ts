import { ApiError } from '../api/types.ts';
import type { DocumentUpload } from '../api/psychologist/types.ts';

export function documentFromAsset(asset: DocumentUpload): DocumentUpload {
  const extension = asset.name.split('.').at(-1)?.toLowerCase();
  const mimeType = asset.mimeType || asset.file?.type || ({ pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' } as Record<string, string>)[extension ?? ''];
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType ?? '')) {
    throw new ApiError(422, 'Selecione um documento em PDF, JPG ou PNG.', { document: ['Selecione um documento em PDF, JPG ou PNG.'] });
  }
  if ((asset.size ?? asset.file?.size ?? 0) > 5 * 1024 * 1024) {
    throw new ApiError(422, 'O documento deve ter até 5 MB.', { document: ['O documento deve ter até 5 MB.'] });
  }
  return { ...asset, mimeType };
}
