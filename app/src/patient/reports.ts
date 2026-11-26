import type { PatientReport } from '../api/patient/types.ts';

export type ReportStatus = 'private' | 'shared' | 'unpublished';

// Relato retirado continua com visibilidade "shared" na API, por isso a retirada vem primeiro.
export function reportStatus(report: Pick<PatientReport, 'visibility' | 'unpublished_at'>): ReportStatus {
  if (report.unpublished_at) return 'unpublished';
  return report.visibility === 'shared' ? 'shared' : 'private';
}

export function unpublishWarning(usedInAnalysis: boolean): string {
  return usedInAnalysis
    ? 'Este relato foi usado em uma análise anterior, que não será desfeita. Retirar o compartilhamento daqui em diante?'
    : 'Retirar o compartilhamento deste relato? Ele continuará no seu histórico.';
}
