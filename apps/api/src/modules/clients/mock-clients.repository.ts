import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  ClientCreateInput,
  ClientRecord,
  ClientStatus,
  ContactCreateInput,
  ContactRecord,
} from './clients.repository';

@Injectable()
export class MockClientsRepository {
  private sequence = 3;
  private readonly clients: ClientRecord[] = [
    {
      id: 'cli-1',
      clientCode: 'CLI-2026-000001',
      type: 'ORGANIZATION',
      status: 'ACTIVE',
      displayName: 'Công ty Cổ phần Năng lượng Mặt Trời Việt Nam',
      email: 'contact@solar.vn',
      phone: '02838221234',
      address: 'Quận 1, TP. Hồ Chí Minh',
      notes: 'Khách hàng doanh nghiệp trọng điểm.',
      createdAt: '2026-01-12T00:00:00.000Z',
      taxCode: '0312345678',
      enterpriseNumber: '0312345678',
      legalRepresentative: 'Nguyễn Minh Khang',
      website: 'https://solar.vn',
      industry: 'Năng lượng tái tạo',
      mattersCount: 3,
      contactsCount: 1,
      contacts: [
        {
          id: 'contact-1',
          clientId: 'cli-1',
          fullName: 'Nguyễn Minh Khang',
          email: 'khang@solar.vn',
          phone: '0909000001',
          position: 'Tổng giám đốc',
          isPrimary: true,
          createdAt: '2026-01-12T00:00:00.000Z',
        },
      ],
      relations: [],
    },
    {
      id: 'cli-2',
      clientCode: 'CLI-2026-000002',
      type: 'INDIVIDUAL',
      status: 'IN_REVIEW',
      displayName: 'Lê Hoàng Minh',
      email: 'minh.le@example.vn',
      phone: '0909000002',
      address: 'Ba Đình, Hà Nội',
      createdAt: '2026-02-20T00:00:00.000Z',
      nationality: 'Việt Nam',
      idNumber: '001203000222',
      occupation: 'Nhà đầu tư',
      mattersCount: 0,
      contactsCount: 0,
      contacts: [],
      relations: [],
    },
  ];

  list() {
    return this.clients.map((client) => this.clone(client));
  }

  find(id: string) {
    const client = this.clients.find((item) => item.id === id);
    if (!client) throw new NotFoundException('Không tìm thấy khách hàng.');
    return this.clone(client);
  }

  create(input: ClientCreateInput) {
    const client: ClientRecord = {
      id: randomUUID(),
      clientCode: `CLI-2026-${String(this.sequence++).padStart(6, '0')}`,
      type: input.type,
      status: 'NEW',
      displayName: input.displayName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      address: input.address,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      taxCode: input.taxCode,
      enterpriseNumber: input.enterpriseNumber,
      legalRepresentative: input.legalRepresentative,
      website: input.website,
      industry: input.industry,
      nationality: input.nationality,
      idNumber: input.idNumber,
      occupation: input.occupation,
      mattersCount: 0,
      contactsCount: 0,
      contacts: [],
      relations: [],
    };
    this.clients.unshift(client);
    return this.clone(client);
  }

  update(id: string, input: Partial<ClientRecord>) {
    const index = this.clients.findIndex((client) => client.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy khách hàng.');
    this.clients[index] = {
      ...this.clients[index],
      ...input,
      id,
      clientCode: this.clients[index].clientCode,
    };
    return this.clone(this.clients[index]);
  }

  changeStatus(id: string, status: ClientStatus) {
    return this.update(id, { status });
  }

  contacts(id: string) {
    return this.find(id).contacts;
  }

  addContact(id: string, input: ContactCreateInput) {
    const index = this.clients.findIndex((client) => client.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy khách hàng.');
    const contact: ContactRecord = {
      ...input,
      id: randomUUID(),
      clientId: id,
      createdAt: new Date().toISOString(),
    };
    this.clients[index].contacts.push(contact);
    this.clients[index].contactsCount = this.clients[index].contacts.length;
    return { ...contact };
  }

  relations(id: string) {
    return this.find(id).relations;
  }

  private clone(client: ClientRecord): ClientRecord {
    return {
      ...client,
      contacts: client.contacts.map((contact) => ({ ...contact })),
      relations: client.relations.map((relation) => ({ ...relation })),
    };
  }
}
