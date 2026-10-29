import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { ApiError } from '../api/types.ts';
import type { Message, Notification, Page, PatientSummary, PsychologistApi } from '../api/psychologist/types.ts';
import { notificationTarget } from './notification-target.ts';

const notification: Notification = {
  id: 5, type: 'message.received', resource_id: 140,
  created_at: '2026-10-29T08:15:00-03:00', read_at: null,
};

function patient(id: number, bondId: number, status: 'active' | 'ended' = 'active'): PatientSummary {
  return {
    bond_id: bondId, status, since: '2026-10-20T10:00:00-03:00', ended_at: null,
    patient: { id, name: `Pessoa fictícia ${id}` }, unread_messages: 0, overdue_tasks: 0, next_appointment_at: null,
  };
}

function message(id: number, bondId: number): Message {
  return {
    id, bond_id: bondId, sender_user_id: 21, mine: false, body: 'Mensagem fictícia.',
    sent_at: '2026-10-29T08:15:00-03:00', read_at: null,
  };
}

function page<T>(data: T[], total = data.length, current = 1, perPage = 50): Page<T> {
  return { data, meta: { total, page: current, per_page: perPage } };
}

type TargetApi = Pick<PsychologistApi, 'patients' | 'messages'>;

describe('notificationTarget', () => {
  test('solicitação leva à lista sem buscar pacientes ou mensagens', async () => {
    const api: TargetApi = {
      patients: async () => { throw new Error('Consulta desnecessária.'); },
      messages: async () => { throw new Error('Consulta desnecessária.'); },
    };
    assert.deepEqual(await notificationTarget({ ...notification, type: 'bond.requested' }, api), { kind: 'requests' });
    assert.equal(await notificationTarget({ ...notification, type: 'tipo.novo' }, api), null);
  });

  test('identificador da notificação é da mensagem e o destino usa users.id', async () => {
    const queriedBonds: number[] = [];
    const api: TargetApi = {
      patients: async (params) => page(params?.status === 'active' ? [patient(21, 8)] : []),
      messages: async (bondId) => {
        queriedBonds.push(bondId);
        return page([message(140, bondId)], 1, 1, 100);
      },
    };
    assert.deepEqual(await notificationTarget(notification, api), { kind: 'chat', patientId: 21 });
    assert.deepEqual(queriedBonds, [8]);
    assert.equal(queriedBonds.includes(notification.resource_id), false);
  });

  test('percorre páginas de pacientes e encontra mensagem em vínculo encerrado', async () => {
    const patientCalls: { status?: string; page?: number }[] = [];
    const cursors: number[] = [];
    const api: TargetApi = {
      patients: async (params) => {
        patientCalls.push({ status: params?.status, page: params?.page });
        if (params?.status === 'active') return page([]);
        if (params?.page === 1) return page([patient(24, 11, 'ended')], 2, 1, 1);
        return page([patient(25, 12, 'ended')], 2, 2, 1);
      },
      messages: async (bondId, params) => {
        if (bondId === 11) return page([]);
        cursors.push(params?.after_id ?? -1);
        assert.equal(params?.page, 1);
        if (!params?.after_id) return page([message(30, 12), message(60, 12)], 3, 1, 2);
        return page([message(140, 12)], 1, 1, 2);
      },
    };
    assert.deepEqual(await notificationTarget(notification, api), { kind: 'chat', patientId: 25 });
    assert.deepEqual(patientCalls, [
      { status: 'active', page: 1 }, { status: 'ended', page: 1 }, { status: 'ended', page: 2 },
    ]);
    assert.deepEqual(cursors, [0, 60]);
  });

  test('recurso indisponível não inventa destino e não fica preso no cursor', async () => {
    let calls = 0;
    const api: TargetApi = {
      patients: async (params) => page(params?.status === 'active' ? [patient(21, 8)] : []),
      messages: async () => {
        calls++;
        return page([message(141, 8)], 500, 1, 100);
      },
    };
    assert.equal(await notificationTarget(notification, api), null);
    assert.equal(calls, 1);
  });

  test('erro de consulta é propagado para permitir nova tentativa na tela', async () => {
    const error = new ApiError(0, 'Sem conexão com o servidor.');
    const api: TargetApi = {
      patients: async (params) => page(params?.status === 'active' ? [patient(21, 8)] : []),
      messages: async () => { throw error; },
    };
    await assert.rejects(() => notificationTarget(notification, api), (caught) => caught === error);
  });
});
