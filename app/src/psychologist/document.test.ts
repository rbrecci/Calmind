import assert from 'node:assert/strict';
import { test } from 'node:test';
import { documentFromAsset } from './document.ts';

test('arquivo do seletor conserva File da web e metadados nativos', () => {
  const file = new File(['pdf'], 'registro.pdf', { type: 'application/pdf' });
  const result = documentFromAsset({ uri: 'blob:document', name: file.name, size: file.size, file });
  assert.equal(result.file, file);
  assert.equal(result.mimeType, 'application/pdf');
  assert.equal(documentFromAsset({ uri: 'content://document', name: 'registro.PNG' }).mimeType, 'image/png');
});

test('formato inesperado ou arquivo maior que 5 MB mostra erro de document', () => {
  assert.throws(() => documentFromAsset({ uri: 'file://doc', name: 'doc.exe' }), /PDF, JPG ou PNG/);
  assert.throws(() => documentFromAsset({ uri: 'file://doc', name: 'doc.pdf', size: 5 * 1024 * 1024 + 1 }), /5 MB/);
  assert.equal(documentFromAsset({ uri: 'file://doc', name: 'doc.jpg', size: 5 * 1024 * 1024 }).mimeType, 'image/jpeg');
});
