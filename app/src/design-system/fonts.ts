import { Quicksand_400Regular } from '@expo-google-fonts/quicksand/400Regular';
import { Quicksand_600SemiBold } from '@expo-google-fonts/quicksand/600SemiBold';
import { Quicksand_700Bold } from '@expo-google-fonts/quicksand/700Bold';
import { useFonts } from 'expo-font';

import { FontFamily } from './typography';

// Importa só o peso que a identidade usa: o caminho do peso evita empacotar a família inteira.
// As fontes entram no app, não são baixadas da rede.
const fontAssets = {
  [FontFamily.heading]: Quicksand_600SemiBold,
  [FontFamily.body]: Quicksand_400Regular,
  [FontFamily.bold]: Quicksand_700Bold,
};

// true quando as fontes terminaram de carregar. Se o carregamento falhar também devolve true:
// o app abre com a fonte do sistema em vez de ficar preso na splash.
export function useDesignSystemFonts(): boolean {
  const [loaded, error] = useFonts(fontAssets);
  return loaded || error !== null;
}
