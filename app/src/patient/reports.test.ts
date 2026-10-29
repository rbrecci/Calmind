import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unpublishWarning } from './reports.ts';

test('confirmação de despublicação avisa sobre análise anterior quando informada pela API', () => {
  assert.match(unpublishWarning(true), /análise anterior/);
  assert.doesNotMatch(unpublishWarning(false), /análise anterior/);
});
