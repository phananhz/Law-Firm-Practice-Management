import { MockCalendarRepository } from './mock-calendar.repository';

describe('MockCalendarRepository', () => {
  it('supports calendar CRUD and filtering', () => {
    const repository = new MockCalendarRepository();
    expect(repository.list().length).toBeGreaterThan(0);
    const created = repository.create({
      title: 'Review',
      eventType: 'MEETING',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
    });
    expect(repository.find(created.id)).toEqual(expect.objectContaining({ title: 'Review' }));
    expect(repository.update(created.id, { title: 'Review updated' }).title).toBe('Review updated');
    expect(repository.remove(created.id)).toEqual({ id: created.id });
    expect(() => repository.find(created.id)).toThrow();
  });
});
