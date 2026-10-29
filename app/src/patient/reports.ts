export function unpublishWarning(usedInAnalysis: boolean): string {
  return usedInAnalysis
    ? 'Este relato foi usado em uma análise anterior, que não será desfeita. Retirar o compartilhamento daqui em diante?'
    : 'Retirar o compartilhamento deste relato? Ele continuará no seu histórico.';
}
