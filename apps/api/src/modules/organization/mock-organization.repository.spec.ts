import { MockOrganizationRepository } from './mock-organization.repository';

describe('MockOrganizationRepository', () => {
  it('returns a coherent organization overview', () => {
    const repository = new MockOrganizationRepository();
    const overview = repository.overview();

    expect(overview.director.name).toBe('Nguyễn Văn Trường');
    expect(overview.departments.length).toBeGreaterThan(0);
    expect(overview.branches.length).toBe(3);
    expect(overview.totalEmployees).toBe(overview.activeEmployees);
  });

  it('creates a department and keeps it in subsequent reads', () => {
    const repository = new MockOrganizationRepository();
    const department = repository.createDepartment({
      code: 'IP',
      name: 'Phòng Sở hữu trí tuệ',
      description: 'Sáng chế, nhãn hiệu và bản quyền.',
    });

    expect(repository.listDepartments()).toContainEqual(
      expect.objectContaining({ id: department.id, code: 'IP' }),
    );
    expect(repository.overview().departments).toHaveLength(5);
  });
});
