import * as ImagePicker from 'expo-image-picker';

import type { ImageKind } from '@/api';
import type { PickedImage } from './profile-image';

// Foto quadrada, capa 16:9. Qualidade 0,7 comprime o JPEG para caber nos 2 MB do servidor; o
// tamanho que passar ainda é barrado antes do envio, em profile-image.ts.
const ASPECT: Record<ImageKind, [number, number]> = { avatar: [1, 1], cover: [16, 9] };

// Só a galeria: a câmera ficou fora do app.json (cameraPermission: false). No Android o seletor
// de fotos do sistema dispensa permissão; na web, `allowsEditing` não recorta.
export async function pickImage(kind: ImageKind): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: ASPECT[kind],
    quality: 0.7,
  });
  if (result.canceled || !result.assets.length) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = mimeType.split('/')[1] ?? 'jpg';
  return {
    uri: asset.uri,
    name: asset.fileName ?? `${kind}.${extension}`,
    mimeType,
    size: asset.fileSize ?? asset.file?.size,
    file: asset.file,
  };
}
