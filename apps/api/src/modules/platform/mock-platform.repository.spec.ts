import { MockPlatformRepository } from './mock-platform.repository';

describe('MockPlatformRepository', () => {
  it('supports notification read state transitions', () => {
    const repository = new MockPlatformRepository();
    expect(repository.listNotifications(true)).toHaveLength(3);
    repository.markNotificationRead('noti-1');
    expect(repository.listNotifications(true)).toHaveLength(2);
    expect(repository.markAllNotificationsRead()).toEqual({ updated: 2 });
    expect(repository.listNotifications(true)).toHaveLength(0);
  });

  it('returns typed search and report results', () => {
    const repository = new MockPlatformRepository();
    expect(repository.search('solar').results[0]).toEqual(
      expect.objectContaining({ id: 'mat-1', type: 'MATTER' }),
    );
    expect(repository.reportOverview().totals.matters).toBeGreaterThan(0);
    expect(repository.listAudit({ module: 'task' })).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: 'TASK_CREATED' })]),
    );
  });
});
