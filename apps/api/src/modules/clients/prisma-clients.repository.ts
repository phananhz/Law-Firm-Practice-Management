import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ClientStatus as PrismaClientStatus,
  ClientType as PrismaClientType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type {
  ClientCreateInput,
  ClientRecord,
  ClientStatus,
  ClientUpdateInput,
  ContactCreateInput,
  ContactRecord,
  RelationRecord,
} from './clients.repository';
import type { ClientsRepository } from './clients.repository';

const clientInclude = {
  contacts: { include: { contact: true } },
  relationsFrom: { include: { targetClient: true } },
  matters: { select: { id: true } },
} as const;

type ClientWithRelations = Prisma.ClientGetPayload<{ include: typeof clientInclude }>;

@Injectable()
export class PrismaClientsRepository implements ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ClientRecord[]> {
    const clients = await this.prisma.client.findMany({
      where: { deletedAt: null },
      include: clientInclude,
      orderBy: { createdAt: 'desc' },
    });
    return clients.map((client) => this.toRecord(client));
  }

  async find(id: string): Promise<ClientRecord> {
    const client = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: clientInclude,
    });
    if (!client) throw new NotFoundException('Không tìm thấy khách hàng.');
    return this.toRecord(client);
  }

  async create(input: ClientCreateInput): Promise<ClientRecord> {
    const year = new Date().getUTCFullYear();
    const prefix = `CLI-${year}-`;
    const last = await this.prisma.client.findFirst({
      where: { clientCode: { startsWith: prefix } },
      orderBy: { clientCode: 'desc' },
      select: { clientCode: true },
    });
    const lastSequence = Number(last?.clientCode.slice(prefix.length)) || 0;
    const client = await this.prisma.client.create({
      data: {
        clientCode: `${prefix}${String(lastSequence + 1).padStart(6, '0')}`,
        type: input.type as PrismaClientType,
        status: PrismaClientStatus.NEW,
        displayName: input.displayName.trim(),
        email: input.email.toLowerCase(),
        phone: input.phone,
        address: input.address,
        notes: input.notes,
        nationality: input.nationality,
        idNumber: input.idNumber,
        occupation: input.occupation,
        taxCode: input.taxCode,
        enterpriseNumber: input.enterpriseNumber,
        legalRepresentative: input.legalRepresentative,
        website: input.website,
        industry: input.industry,
      },
      include: clientInclude,
    });
    return this.toRecord(client);
  }

  async update(id: string, input: ClientUpdateInput): Promise<ClientRecord> {
    await this.ensureExists(id);
    const client = await this.prisma.client.update({
      where: { id },
      data: {
        displayName: input.displayName,
        email: input.email?.toLowerCase(),
        phone: input.phone,
        address: input.address,
        notes: input.notes,
        legalRepresentative: input.legalRepresentative,
        website: input.website,
        industry: input.industry,
      },
      include: clientInclude,
    });
    return this.toRecord(client);
  }

  async changeStatus(id: string, status: ClientStatus): Promise<ClientRecord> {
    await this.ensureExists(id);
    await this.prisma.client.update({
      where: { id },
      data: { status: status as PrismaClientStatus },
    });
    return this.find(id);
  }

  async contacts(id: string): Promise<ContactRecord[]> {
    return (await this.find(id)).contacts;
  }

  async addContact(id: string, input: ContactCreateInput): Promise<ContactRecord> {
    await this.ensureExists(id);
    const contact = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.contact.create({
        data: {
          fullName: input.fullName.trim(),
          email: input.email.toLowerCase(),
          phone: input.phone,
          position: input.position.trim(),
          idNumber: input.idNumber,
          notes: input.notes,
        },
      });
      await transaction.clientContact.create({
        data: {
          clientId: id,
          contactId: created.id,
          isPrimary: input.isPrimary ?? false,
          relationship: input.position,
        },
      });
      return created;
    });
    return {
      id: contact.id,
      clientId: id,
      fullName: contact.fullName,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      position: contact.position ?? '',
      idNumber: contact.idNumber ?? undefined,
      notes: contact.notes ?? undefined,
      createdAt: contact.createdAt.toISOString(),
    };
  }

  async relations(id: string): Promise<RelationRecord[]> {
    return (await this.find(id)).relations;
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Không tìm thấy khách hàng.');
  }

  private toRecord(client: ClientWithRelations): ClientRecord {
    const contacts = client.contacts.map(({ contact, isPrimary }) => ({
      id: contact.id,
      clientId: client.id,
      fullName: contact.fullName,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      position: contact.position ?? '',
      idNumber: contact.idNumber ?? undefined,
      isPrimary,
      notes: contact.notes ?? undefined,
      createdAt: contact.createdAt.toISOString(),
    }));
    const relations = client.relationsFrom.map((relation) => ({
      id: relation.id,
      sourceClientId: relation.sourceClientId,
      targetClientId: relation.targetClientId ?? undefined,
      targetName: relation.targetName ?? relation.targetClient?.displayName ?? '',
      relationType: relation.relationType,
      notes: relation.notes ?? undefined,
      createdAt: relation.createdAt.toISOString(),
    }));
    return {
      id: client.id,
      clientCode: client.clientCode,
      type: client.type as ClientRecord['type'],
      status: client.status as ClientRecord['status'],
      displayName: client.displayName,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
      notes: client.notes ?? undefined,
      createdAt: client.createdAt.toISOString(),
      taxCode: client.taxCode ?? undefined,
      enterpriseNumber: client.enterpriseNumber ?? undefined,
      legalRepresentative: client.legalRepresentative ?? undefined,
      website: client.website ?? undefined,
      industry: client.industry ?? undefined,
      nationality: client.nationality ?? undefined,
      idNumber: client.idNumber ?? undefined,
      occupation: client.occupation ?? undefined,
      mattersCount: client.matters.length,
      contactsCount: contacts.length,
      contacts,
      relations,
    };
  }
}
