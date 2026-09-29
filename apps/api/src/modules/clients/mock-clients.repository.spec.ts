import { MockClientsRepository } from './mock-clients.repository';

describe('MockClientsRepository', () => {
  it('lists seeded clients and returns independent copies', () => {
    const repository = new MockClientsRepository();
    const first = repository.list();
    first[0].displayName = 'Changed locally';
    expect(repository.find(first[0].id).displayName).not.toBe('Changed locally');
  });

  it('creates a new client with an intake status', () => {
    const repository = new MockClientsRepository();
    const client = repository.create({
      type: 'INDIVIDUAL',
      displayName: 'Phạm Minh Châu',
      email: 'chau@example.vn',
      phone: '0909000003',
      address: 'Đà Nẵng',
    });
    expect(client.status).toBe('NEW');
    expect(client.clientCode).toMatch(/^CLI-2026-/);
  });
});
