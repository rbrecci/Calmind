import assert from 'node:assert/strict';
import { test } from 'node:test';

import { confirmationVariants } from './confirmation.ts';

test('confirmação comum tem o confirmar como ação principal', () => {
  assert.deepEqual(confirmationVariants(), { confirm: 'primary', cancel: 'secondary' });
  assert.deepEqual(confirmationVariants('default'), { confirm: 'primary', cancel: 'secondary' });
});

test('confirmação de ação destrutiva pinta o confirmar como destrutivo', () => {
  assert.deepEqual(confirmationVariants('destructive'), { confirm: 'destructive', cancel: 'secondary' });
});
