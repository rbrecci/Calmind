// Iniciais do avatar sem foto: primeiro e último nome, como "Ana Paula Ribeiro" vira "AR".
// `Array.from` pega a letra inteira, e não meio caractere, quando ela vem decomposta.
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const first = Array.from(words[0])[0];
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : '';
  return `${first}${last}`.toUpperCase();
}
