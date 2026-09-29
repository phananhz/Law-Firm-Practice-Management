import { MockOperationsRepository } from './mock-operations.repository';

describe('MockOperationsRepository', () => {
  it('seeds the five operational collections', () => {
    const repository = new MockOperationsRepository();
    expect(repository.list('conflict').length).toBeGreaterThan(0);
    expect(repository.list('matter').length).toBeGreaterThan(0);
    expect(repository.list('task').length).toBeGreaterThan(0);
    expect(repository.list('deadline').length).toBeGreaterThan(0);
    expect(repository.list('document').length).toBeGreaterThan(0);
  });

  it('updates status without replacing the resource identity', () => {
    const repository = new MockOperationsRepository();
    const task = repository.list('task')[0];
    const updated = repository.update('task', task.id, { status: 'COMPLETED' });
    expect(updated.id).toBe(task.id);
    expect(updated.status).toBe('COMPLETED');
  });

  it('rejects unknown resource ids instead of leaking or mutating another record', () => {
    const repository = new MockOperationsRepository();
    expect(() => repository.find('matter', 'matter-from-another-tenant')).toThrow();
    expect(() => repository.update('document', 'document-from-another-tenant', {})).toThrow();
  });

  it('keeps folders separate from document records', () => {
    const repository = new MockOperationsRepository();
    expect(repository.listFolders('mat-1')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ matterId: 'mat-1', documentCount: expect.any(Number) }),
      ]),
    );
    const created = repository.createFolder({ matterId: 'mat-1', name: '10. Archive' });
    expect(repository.listFolders('mat-1')).toContainEqual(
      expect.objectContaining({ id: created.id, name: '10. Archive' }),
    );
  });
});
