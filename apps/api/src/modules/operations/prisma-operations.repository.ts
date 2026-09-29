import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConflictStatus,
  ConfidentialityLevel,
  DeadlineType,
  DocumentPermissionType,
  DocumentStatus,
  MatterMemberRole,
  MatterPartyType,
  MatterPriority,
  MatterStatus,
  Prisma,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { FolderRecord, OperationKind, OperationRecord } from './mock-operations.repository';
import type {
  DocumentPermission,
  OperationsContext,
  OperationsRepository,
} from './operations.repository';

const conflictInclude = {
  matter: { select: { id: true, matterCode: true, name: true } },
  client: { select: { id: true, displayName: true } },
  requestedBy: { select: { id: true, fullName: true } },
  reviewedBy: { select: { id: true, fullName: true } },
  results: true,
} as const;

const matterInclude = {
  client: { select: { id: true, displayName: true } },
  practiceArea: { select: { id: true, name: true } },
  responsiblePartner: { select: { id: true, fullName: true } },
  responsibleLawyer: { select: { id: true, fullName: true } },
  members: { include: { user: { select: { id: true, fullName: true } } } },
  parties: {
    include: {
      client: { select: { id: true, displayName: true } },
      contact: { select: { id: true, fullName: true } },
    },
  },
  tasks: {
    where: { deletedAt: null },
    select: { id: true, title: true, status: true, priority: true, dueDate: true },
  },
  deadlines: { select: { id: true, title: true, dueDate: true, isCompleted: true } },
  documents: {
    where: { deletedAt: null },
    include: {
      folder: { select: { id: true, name: true } },
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
    },
  },
  notes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
  statusHistory: { orderBy: { createdAt: 'asc' } },
} as const;

const taskInclude = {
  matter: { select: { id: true, matterCode: true, name: true } },
  assignee: { select: { id: true, fullName: true } },
  reviewer: { select: { id: true, fullName: true } },
  checklists: { orderBy: { position: 'asc' } },
  comments: {
    where: { deletedAt: null },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: 'asc' },
  },
} as const;

const deadlineInclude = {
  matter: { select: { id: true, matterCode: true, name: true } },
} as const;

const documentInclude = {
  matter: { select: { id: true, matterCode: true, name: true } },
  folder: { select: { id: true, name: true } },
  versions: { orderBy: { versionNumber: 'desc' } },
  permissions: {
    include: {
      user: { select: { id: true, fullName: true } },
      role: { select: { id: true, name: true } },
    },
  },
} as const;

type PersistedConflict = Prisma.ConflictCheckGetPayload<{ include: typeof conflictInclude }>;
type PersistedMatter = Prisma.MatterGetPayload<{ include: typeof matterInclude }>;
type PersistedTask = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
type PersistedDeadline = Prisma.DeadlineGetPayload<{ include: typeof deadlineInclude }>;
type PersistedDocument = Prisma.DocumentGetPayload<{ include: typeof documentInclude }>;

@Injectable()
export class PrismaOperationsRepository implements OperationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(kind: OperationKind, context?: OperationsContext): Promise<OperationRecord[]> {
    const auth = this.requireContext(context);
    const matterScope = this.matterScope(auth);
    switch (kind) {
      case 'conflict':
        return (
          await this.prisma.conflictCheck.findMany({
            where: {
              OR: [
                { requestedById: auth.userId },
                { reviewedById: auth.userId },
                { matter: { is: matterScope } },
              ],
            },
            include: conflictInclude,
            orderBy: { createdAt: 'desc' },
          })
        ).map((item) => this.toConflict(item));
      case 'matter':
        return (
          await this.prisma.matter.findMany({
            where: { deletedAt: null, ...matterScope },
            include: matterInclude,
            orderBy: { updatedAt: 'desc' },
          })
        ).map((item) => this.toMatter(item));
      case 'task':
        return (
          await this.prisma.task.findMany({
            where: { deletedAt: null, matter: { is: matterScope } },
            include: taskInclude,
            orderBy: { updatedAt: 'desc' },
          })
        ).map((item) => this.toTask(item));
      case 'deadline':
        return (
          await this.prisma.deadline.findMany({
            where: { matter: { is: matterScope } },
            include: deadlineInclude,
            orderBy: { dueDate: 'asc' },
          })
        ).map((item) => this.toDeadline(item));
      case 'document':
        return (
          await this.prisma.document.findMany({
            // The controller applies the optional isDeleted filter. Returning both
            // states also keeps the restore/trash views backed by the same contract.
            where: { matter: { is: matterScope } },
            include: documentInclude,
            orderBy: { updatedAt: 'desc' },
          })
        )
          .filter((item) => this.canViewDocument(item, auth))
          .map((item) => this.toDocument(item));
    }
  }

  async find(
    kind: OperationKind,
    id: string,
    context?: OperationsContext,
  ): Promise<OperationRecord> {
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy dữ liệu.');
    const record = (await this.list(kind, context)).find((item) => item.id === id);
    if (!record) throw new NotFoundException('Không tìm thấy dữ liệu.');
    return record;
  }

  async create(
    kind: OperationKind,
    payload: Record<string, unknown>,
    context?: OperationsContext,
  ): Promise<OperationRecord> {
    const auth = this.requireContext(context);
    switch (kind) {
      case 'conflict':
        return this.createConflict(payload, auth);
      case 'matter':
        return this.createMatter(payload, auth);
      case 'task':
        return this.createTask(payload, auth);
      case 'deadline':
        return this.createDeadline(payload, auth);
      case 'document':
        return this.createDocument(payload, auth);
    }
  }

  async update(
    kind: OperationKind,
    id: string,
    payload: Record<string, unknown>,
    context?: OperationsContext,
  ): Promise<OperationRecord> {
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy dữ liệu.');
    const auth = this.requireContext(context);
    switch (kind) {
      case 'conflict':
        await this.ensureConflict(id, auth);
        return this.toConflict(
          await this.prisma.conflictCheck.update({
            where: { id },
            data: {
              status: enumValue(payload.status, ConflictStatus),
              decisionNotes: stringValue(payload.decisionNotes ?? payload.notes),
              reviewedById: await this.optionalUserId(payload.reviewedById),
              reviewedAt: dateTimeValue(payload.reviewedAt),
            },
            include: conflictInclude,
          }),
        );
      case 'matter':
        return this.updateMatter(id, payload, auth);
      case 'task':
        return this.updateTask(id, payload, auth);
      case 'deadline':
        await this.ensureDeadline(id, auth);
        return this.toDeadline(
          await this.prisma.deadline.update({
            where: { id },
            data: {
              title: stringValue(payload.title),
              description: stringValue(payload.description),
              deadlineType: enumValue(payload.deadlineType ?? payload.category, DeadlineType),
              dueDate: dateOnlyValue(payload.dueDate),
              dueTime: stringValue(payload.dueTime),
              reminderDays: intArray(payload.reminderDays),
              isCompleted: booleanValue(payload.isCompleted),
              responsiblePersonId: await this.optionalUserId(payload.responsiblePersonId),
            },
            include: deadlineInclude,
          }),
        );
      case 'document':
        return this.updateDocument(id, payload, auth);
    }
  }

  async addChild(
    kind: 'matter' | 'task',
    id: string,
    childKey: string,
    payload: Record<string, unknown>,
    context?: OperationsContext,
  ): Promise<OperationRecord> {
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy dữ liệu.');
    const auth = this.requireContext(context);
    if (kind === 'matter') {
      await this.ensureMatter(id, auth);
      if (childKey === 'members') {
        const userId = await this.requiredUserId(payload.userId);
        const member = await this.prisma.matterMember.create({
          data: {
            matterId: id,
            userId,
            roleInMatter:
              enumValue(payload.roleInMatter ?? payload.role, MatterMemberRole) ??
              MatterMemberRole.MEMBER,
            canEdit: Boolean(payload.canEdit),
            addedById: await this.optionalUserId(payload.addedById),
          },
          include: { user: { select: { id: true, fullName: true } } },
        });
        return {
          id: member.id,
          matterId: id,
          userId: member.userId,
          userName: member.user.fullName,
          roleInMatter: member.roleInMatter,
          canEdit: member.canEdit,
          addedAt: member.addedAt.toISOString(),
        };
      }
      if (childKey === 'parties') {
        const party = await this.prisma.matterParty.create({
          data: {
            matterId: id,
            partyType:
              enumValue(payload.partyType, MatterPartyType) ?? MatterPartyType.RELATED_PARTY,
            name: stringValue(payload.name) ?? 'Chưa đặt tên',
            clientId: await this.optionalClientId(payload.clientId),
            contactId: await this.optionalContactId(payload.contactId),
            details: jsonValue(payload.details),
          },
          include: {
            client: { select: { id: true, displayName: true } },
            contact: { select: { id: true, fullName: true } },
          },
        });
        return {
          id: party.id,
          matterId: id,
          partyType: party.partyType,
          name: party.name,
          clientId: party.clientId,
          clientName: party.client?.displayName,
          contactId: party.contactId,
          contactName: party.contact?.fullName,
          details: party.details,
          createdAt: party.createdAt.toISOString(),
        };
      }
      if (childKey === 'notes') {
        const note = await this.prisma.note.create({
          data: {
            matterId: id,
            authorId: await this.optionalUserId(payload.authorId),
            content: stringValue(payload.content) ?? stringValue(payload.text) ?? '',
            isRestricted: Boolean(payload.isRestricted),
          },
        });
        return {
          id: note.id,
          matterId: id,
          content: note.content,
          authorId: note.authorId,
          createdAt: note.createdAt.toISOString(),
        };
      }
    }
    if (kind === 'task') {
      await this.ensureTask(id, auth);
      if (childKey === 'comments') {
        const comment = await this.prisma.taskComment.create({
          data: {
            taskId: id,
            userId: await this.requiredUserId(payload.authorId ?? payload.userId),
            content: stringValue(payload.content) ?? '',
          },
          include: { user: { select: { id: true, fullName: true } } },
        });
        return {
          id: comment.id,
          taskId: id,
          authorId: comment.userId,
          authorName: comment.user.fullName,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
        };
      }
      if (childKey === 'checklists') {
        const count = await this.prisma.taskChecklist.count({ where: { taskId: id } });
        const item = await this.prisma.taskChecklist.create({
          data: {
            taskId: id,
            title: stringValue(payload.title) ?? '',
            isCompleted: Boolean(payload.isCompleted),
            position: Number(payload.position ?? count),
          },
        });
        return {
          id: item.id,
          taskId: id,
          title: item.title,
          isCompleted: item.isCompleted,
          position: item.position,
        };
      }
    }
    throw new BadRequestException('Loại dữ liệu con không được hỗ trợ.');
  }

  async deleteDocument(
    id: string,
    reason?: string,
    context?: OperationsContext,
  ): Promise<OperationRecord> {
    void reason;
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy tài liệu.');
    const auth = this.requireContext(context);
    await this.assertDocumentPermission(id, 'DELETE', auth);
    return this.toDocument(
      (await this.prisma.document.update({
        where: { id },
        data: { deletedAt: new Date() },
        include: documentInclude,
      })) as unknown as PersistedDocument,
    );
  }

  async listFolders(matterId?: string, context?: OperationsContext): Promise<FolderRecord[]> {
    if (matterId && !isUuid(matterId)) return [];
    const auth = this.requireContext(context);
    const matterScope = this.matterScope(auth);
    if (matterId) await this.ensureMatter(matterId, auth);
    const folders = await this.prisma.folder.findMany({
      where: {
        deletedAt: null,
        matter: { is: matterScope },
        ...(matterId ? { matterId } : {}),
      },
      include: { _count: { select: { documents: true } } },
      orderBy: [{ matterId: 'asc' }, { name: 'asc' }],
    });
    return folders.map((folder) => ({
      id: folder.id,
      matterId: folder.matterId,
      name: folder.name,
      parentId: folder.parentId ?? undefined,
      documentCount: folder._count.documents,
      createdAt: folder.createdAt.toISOString(),
    }));
  }

  async createFolder(
    input: {
      matterId: string;
      name: string;
      parentId?: string;
    },
    context?: OperationsContext,
  ): Promise<FolderRecord> {
    const auth = this.requireContext(context);
    await this.ensureMatter(input.matterId, auth);
    if (input.parentId) {
      const parent = await this.prisma.folder.findFirst({
        where: { id: input.parentId, matterId: input.matterId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException('Không tìm thấy thư mục cha.');
    }
    const folder = await this.prisma.folder.create({
      data: { matterId: input.matterId, name: input.name.trim(), parentId: input.parentId },
      include: { _count: { select: { documents: true } } },
    });
    return {
      id: folder.id,
      matterId: folder.matterId,
      name: folder.name,
      parentId: folder.parentId ?? undefined,
      documentCount: folder._count.documents,
      createdAt: folder.createdAt.toISOString(),
    };
  }

  private async createConflict(
    payload: Record<string, unknown>,
    context: OperationsContext,
  ): Promise<OperationRecord> {
    const matterId = await this.optionalMatterId(payload.matterId);
    if (matterId) await this.ensureMatter(matterId, context);
    const item = await this.prisma.conflictCheck.create({
      data: {
        matterId,
        clientId: await this.optionalClientId(payload.clientId),
        requestedById: await this.requiredUserId(context.userId),
        searchTerms: stringArray(payload.searchTerms),
        status: enumValue(payload.status, ConflictStatus) ?? ConflictStatus.NO_CONFLICT,
      },
      include: conflictInclude,
    });
    return this.toConflict(item);
  }

  private async createMatter(
    payload: Record<string, unknown>,
    context: OperationsContext,
  ): Promise<OperationRecord> {
    const clientId = await this.requiredClientId(payload.clientId);
    const matterCode = await this.nextCode('matter', 'MAT');
    const item = await this.prisma.matter.create({
      data: {
        matterCode: stringValue(payload.matterCode) ?? matterCode,
        name: stringValue(payload.name) ?? 'Chưa đặt tên vụ việc',
        description: stringValue(payload.description),
        clientId,
        practiceAreaId: await this.optionalPracticeAreaId(payload.practiceAreaId),
        responsiblePartnerId: await this.optionalUserId(payload.responsiblePartnerId),
        responsibleLawyerId: await this.optionalUserId(payload.responsibleLawyerId),
        matterType: stringValue(payload.matterType),
        status: enumValue(payload.status, MatterStatus) ?? MatterStatus.INTAKE,
        priority: enumValue(payload.priority, MatterPriority) ?? MatterPriority.NORMAL,
        confidentialityLevel:
          enumValue(payload.confidentialityLevel, ConfidentialityLevel) ??
          ConfidentialityLevel.NORMAL,
        openDate: dateOnlyValue(payload.openDate),
        expectedCloseDate: dateOnlyValue(payload.expectedCloseDate),
        createdById: await this.optionalUserId(context.userId),
      },
      include: matterInclude,
    });
    const creatorId = await this.optionalUserId(context.userId);
    if (creatorId) {
      await this.prisma.matterMember.create({
        data: {
          matterId: item.id,
          userId: creatorId,
          roleInMatter: this.memberRoleFor(context),
          canEdit: true,
          addedById: creatorId,
        },
      });
    }
    return this.toMatter(
      await this.prisma.matter.findUniqueOrThrow({
        where: { id: item.id },
        include: matterInclude,
      }),
    );
  }

  private async createTask(
    payload: Record<string, unknown>,
    context: OperationsContext,
  ): Promise<OperationRecord> {
    const matterId = await this.requiredMatterId(payload.matterId);
    await this.ensureMatter(matterId, context);
    const item = await this.prisma.task.create({
      data: {
        matterId,
        title: stringValue(payload.title) ?? 'Công việc mới',
        description: stringValue(payload.description),
        assigneeId: await this.optionalUserId(payload.assigneeId),
        reviewerId: await this.optionalUserId(payload.reviewerId),
        status: enumValue(payload.status, TaskStatus) ?? TaskStatus.TODO,
        priority: enumValue(payload.priority, TaskPriority) ?? TaskPriority.NORMAL,
        startDate: dateOnlyValue(payload.startDate),
        dueDate: dateOnlyValue(payload.dueDate),
        estimatedMinutes: numberValue(payload.estimatedMinutes),
        createdById: await this.optionalUserId(context.userId),
      },
      include: taskInclude,
    });
    return this.toTask(item);
  }

  private async createDeadline(
    payload: Record<string, unknown>,
    context: OperationsContext,
  ): Promise<OperationRecord> {
    const matterId = await this.requiredMatterId(payload.matterId);
    await this.ensureMatter(matterId, context);
    const item = await this.prisma.deadline.create({
      data: {
        matterId,
        title: stringValue(payload.title) ?? 'Hạn công việc',
        description: stringValue(payload.description),
        deadlineType:
          enumValue(payload.deadlineType ?? payload.category, DeadlineType) ??
          DeadlineType.INTERNAL,
        dueDate: dateOnlyValue(payload.dueDate) ?? new Date(),
        dueTime: stringValue(payload.dueTime),
        reminderDays: intArray(payload.reminderDays) ?? [7, 3, 1],
        responsiblePersonId: await this.optionalUserId(payload.responsiblePersonId),
        createdById: await this.optionalUserId(context.userId),
      },
      include: deadlineInclude,
    });
    return this.toDeadline(item);
  }

  private async createDocument(
    payload: Record<string, unknown>,
    context: OperationsContext,
  ): Promise<OperationRecord> {
    const matterId = await this.requiredMatterId(payload.matterId);
    await this.ensureMatter(matterId, context);
    let folderId =
      typeof payload.folderId === 'string' && isUuid(payload.folderId)
        ? payload.folderId
        : undefined;
    if (folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: folderId, matterId, deletedAt: null },
        select: { id: true },
      });
      if (!folder) throw new NotFoundException('Không tìm thấy thư mục tài liệu.');
    } else {
      const folder = await this.prisma.folder.findFirst({
        where: { matterId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (!folder) {
        const created = await this.prisma.folder.create({
          data: { matterId, name: 'Tài liệu chung' },
          select: { id: true },
        });
        folderId = created.id;
      } else folderId = folder.id;
    }
    const item = await this.prisma.document.create({
      data: {
        matterId,
        folderId,
        title: stringValue(payload.title) ?? stringValue(payload.fileName) ?? 'Tài liệu mới',
        documentType: stringValue(payload.documentType),
        status: enumValue(payload.status, DocumentStatus) ?? DocumentStatus.DRAFT,
        isRestricted: Boolean(payload.isRestricted),
        isSensitive: Boolean(payload.isSensitive),
        watermarkEnabled: Boolean(payload.watermarkEnabled),
        downloadRestricted: Boolean(payload.downloadRestricted),
        createdById: await this.optionalUserId(context.userId),
      },
      include: documentInclude,
    });
    if (payload.storageKey || payload.fileName || payload.originalFileName) {
      const userId = await this.requiredUserId(payload.uploadedById ?? payload.createdById);
      await this.prisma.documentVersion.create({
        data: {
          documentId: item.id,
          versionNumber: 1,
          storageKey: stringValue(payload.storageKey) ?? `documents/${item.id}/v1`,
          fileSize: BigInt(numberValue(payload.fileSize) ?? 0),
          mimeType: stringValue(payload.mimeType) ?? 'application/octet-stream',
          fileHash: stringValue(payload.sha256 ?? payload.fileHash) ?? '',
          originalFileName: stringValue(payload.fileName ?? payload.originalFileName) ?? item.title,
          comment: stringValue(payload.comment),
          uploadedById: userId,
        },
      });
    }
    return this.toDocument(
      await this.prisma.document.findUniqueOrThrow({
        where: { id: item.id },
        include: documentInclude,
      }),
    );
  }

  private async updateMatter(
    id: string,
    payload: Record<string, unknown>,
    context: OperationsContext,
  ): Promise<OperationRecord> {
    await this.ensureMatter(id, context);
    const existing = await this.prisma.matter.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy vụ việc.');
    const nextStatus = enumValue(payload.status, MatterStatus);
    const item = await this.prisma.$transaction(async (transaction) => {
      if (nextStatus && nextStatus !== existing.status) {
        await transaction.matterStatusHistory.create({
          data: {
            matterId: id,
            fromStatus: existing.status,
            toStatus: nextStatus,
            reason: stringValue(payload.statusNote ?? payload.notes),
            changedById: await this.optionalUserId(payload.updatedById),
          },
        });
      }
      if (Array.isArray(payload.members)) {
        await transaction.matterMember.deleteMany({ where: { matterId: id } });
        for (const entry of payload.members) {
          const member = asRecord(entry);
          const userId = await this.optionalUserId(member.userId);
          if (!userId) continue;
          await transaction.matterMember.create({
            data: {
              matterId: id,
              userId,
              roleInMatter:
                enumValue(member.roleInMatter ?? member.role, MatterMemberRole) ??
                MatterMemberRole.MEMBER,
              canEdit: Boolean(member.canEdit),
            },
          });
        }
      }
      return transaction.matter.update({
        where: { id },
        data: {
          name: stringValue(payload.name),
          description: stringValue(payload.description),
          clientId: payload.clientId ? await this.requiredClientId(payload.clientId) : undefined,
          practiceAreaId: payload.practiceAreaId
            ? await this.optionalPracticeAreaId(payload.practiceAreaId)
            : undefined,
          responsiblePartnerId: payload.responsiblePartnerId
            ? await this.optionalUserId(payload.responsiblePartnerId)
            : undefined,
          responsibleLawyerId: payload.responsibleLawyerId
            ? await this.optionalUserId(payload.responsibleLawyerId)
            : undefined,
          matterType: stringValue(payload.matterType),
          status: nextStatus,
          priority: enumValue(payload.priority, MatterPriority),
          confidentialityLevel: enumValue(payload.confidentialityLevel, ConfidentialityLevel),
          openDate: dateOnlyValue(payload.openDate),
          expectedCloseDate: dateOnlyValue(payload.expectedCloseDate),
          closeDate: dateOnlyValue(payload.closeDate),
          updatedById: await this.optionalUserId(payload.updatedById),
        },
        include: matterInclude,
      });
    });
    return this.toMatter(item);
  }

  private async updateTask(
    id: string,
    payload: Record<string, unknown>,
    context: OperationsContext,
  ): Promise<OperationRecord> {
    await this.ensureTask(id, context);
    const checklists = Array.isArray(payload.checklists) ? payload.checklists : undefined;
    const item = await this.prisma.$transaction(async (transaction) => {
      if (checklists) {
        await transaction.taskChecklist.deleteMany({ where: { taskId: id } });
        if (checklists.length) {
          await transaction.taskChecklist.createMany({
            data: checklists.map((entry, position) => {
              const value = asRecord(entry);
              return {
                taskId: id,
                title: stringValue(value.title) ?? '',
                isCompleted: Boolean(value.isCompleted),
                position,
              };
            }),
          });
        }
      }
      return transaction.task.update({
        where: { id },
        data: {
          title: stringValue(payload.title),
          description: stringValue(payload.description),
          assigneeId: payload.assigneeId
            ? await this.optionalUserId(payload.assigneeId)
            : undefined,
          reviewerId: payload.reviewerId
            ? await this.optionalUserId(payload.reviewerId)
            : undefined,
          status: enumValue(payload.status, TaskStatus),
          priority: enumValue(payload.priority, TaskPriority),
          startDate: dateOnlyValue(payload.startDate),
          dueDate: dateOnlyValue(payload.dueDate),
          estimatedMinutes: numberValue(payload.estimatedMinutes),
          actualMinutes: numberValue(payload.actualMinutes),
          completedAt:
            payload.status === TaskStatus.COMPLETED
              ? new Date()
              : dateTimeValue(payload.completedAt),
          completedById: await this.optionalUserId(payload.completedById),
          updatedById: await this.optionalUserId(payload.updatedById),
        },
        include: taskInclude,
      });
    });
    return this.toTask(item);
  }

  private async updateDocument(
    id: string,
    payload: Record<string, unknown>,
    context: OperationsContext,
  ): Promise<OperationRecord> {
    await this.assertDocumentPermission(
      id,
      Array.isArray(payload.permissions)
        ? 'SHARE'
        : Array.isArray(payload.versions)
          ? 'UPLOAD_VERSION'
          : 'EDIT_METADATA',
      context,
    );
    const permissions = Array.isArray(payload.permissions) ? payload.permissions : undefined;
    const versions = Array.isArray(payload.versions) ? payload.versions : undefined;
    const item = await this.prisma.$transaction(async (transaction) => {
      if (permissions) {
        await transaction.documentPermission.deleteMany({ where: { documentId: id } });
        for (const entry of permissions) {
          const value = asRecord(entry);
          const permission = enumValue(value.permission, DocumentPermissionType);
          if (!permission) continue;
          await transaction.documentPermission.create({
            data: {
              documentId: id,
              permission,
              userId: await this.optionalUserId(value.userId),
              roleId: await this.optionalRoleId(value.roleId),
            },
          });
        }
      }
      const current = await transaction.document.findUnique({
        where: { id },
        select: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });
      const maxVersion = current?.versions[0]?.versionNumber ?? 0;
      const requestedVersions =
        versions?.map(asRecord).filter((value) => Number(value.versionNumber) > maxVersion) ?? [];
      for (const value of requestedVersions) {
        await transaction.documentVersion.create({
          data: {
            documentId: id,
            versionNumber: Number(value.versionNumber),
            storageKey:
              stringValue(value.storageKey) ?? `documents/${id}/v${Number(value.versionNumber)}`,
            fileSize: BigInt(numberValue(value.fileSize) ?? 0),
            mimeType: stringValue(value.mimeType) ?? 'application/octet-stream',
            fileHash: stringValue(value.sha256 ?? value.fileHash) ?? '',
            originalFileName: stringValue(value.fileName ?? value.originalFileName) ?? 'document',
            comment: stringValue(value.comment),
            uploadedById: await this.requiredUserId(value.uploadedById),
          },
        });
      }
      return transaction.document.update({
        where: { id },
        data: {
          title: stringValue(payload.title),
          documentType: stringValue(payload.documentType),
          status: enumValue(payload.status, DocumentStatus),
          isRestricted: booleanValue(payload.isRestricted),
          isSensitive: booleanValue(payload.isSensitive),
          watermarkEnabled: booleanValue(payload.watermarkEnabled),
          downloadRestricted: booleanValue(payload.downloadRestricted),
          deletedAt:
            payload.isDeleted === false
              ? null
              : payload.deletedAt !== undefined
                ? dateTimeValue(payload.deletedAt)
                : undefined,
          folderId: payload.folderId ? await this.requiredFolderId(payload.folderId) : undefined,
          updatedById: await this.optionalUserId(payload.updatedById),
        },
        include: documentInclude,
      });
    });
    return this.toDocument(item as unknown as PersistedDocument);
  }

  private toConflict(item: PersistedConflict): OperationRecord {
    const year = item.createdAt.getUTCFullYear();
    return {
      id: item.id,
      code: `CC-${year}-${item.id.slice(0, 8).toUpperCase()}`,
      matterId: item.matterId,
      matterCode: item.matter?.matterCode,
      matterName: item.matter?.name,
      clientId: item.clientId,
      clientName: item.client?.displayName,
      searchTerms: item.searchTerms,
      status: item.status,
      requestedById: item.requestedById,
      requestedByName: item.requestedBy.fullName,
      requestedAt: item.createdAt.toISOString(),
      decisionNotes: item.decisionNotes,
      reviewedById: item.reviewedById,
      reviewedByName: item.reviewedBy?.fullName,
      reviewedAt: item.reviewedAt?.toISOString(),
      results: item.results.map((result) => ({
        ...result,
        similarityScore: result.similarityScore ? Number(result.similarityScore) : undefined,
      })),
    };
  }

  private toMatter(item: PersistedMatter): OperationRecord {
    return {
      id: item.id,
      matterCode: item.matterCode,
      name: item.name,
      description: item.description,
      clientId: item.clientId,
      clientName: item.client.displayName,
      practiceAreaId: item.practiceAreaId,
      practiceArea: item.practiceArea?.name,
      matterType: item.matterType,
      responsiblePartnerId: item.responsiblePartnerId,
      responsiblePartnerName: item.responsiblePartner?.fullName,
      responsibleLawyerId: item.responsibleLawyerId,
      responsibleLawyerName: item.responsibleLawyer?.fullName,
      status: item.status,
      priority: item.priority,
      confidentialityLevel: item.confidentialityLevel,
      openDate: dateOnlyString(item.openDate),
      expectedCloseDate: dateOnlyString(item.expectedCloseDate),
      closeDate: dateOnlyString(item.closeDate),
      members: item.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        userName: member.user.fullName,
        roleInMatter: member.roleInMatter,
        canEdit: member.canEdit,
        addedAt: member.addedAt.toISOString(),
      })),
      parties: item.parties.map((party) => ({
        id: party.id,
        partyType: party.partyType,
        name: party.name,
        clientId: party.clientId,
        clientName: party.client?.displayName,
        contactId: party.contactId,
        contactName: party.contact?.fullName,
        details: party.details,
        createdAt: party.createdAt.toISOString(),
      })),
      tasks: item.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: dateOnlyString(task.dueDate),
      })),
      deadlines: item.deadlines.map((deadline) => ({
        id: deadline.id,
        title: deadline.title,
        dueDate: dateOnlyString(deadline.dueDate),
        isCompleted: deadline.isCompleted,
      })),
      documents: item.documents.map((document) => this.toDocument(document as PersistedDocument)),
      notes: item.notes.map((note) => ({
        id: note.id,
        content: note.content,
        authorId: note.authorId,
        isRestricted: note.isRestricted,
        createdAt: note.createdAt.toISOString(),
      })),
      timeline: item.statusHistory.map((entry) => ({
        id: entry.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        reason: entry.reason,
        createdAt: entry.createdAt.toISOString(),
      })),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toTask(item: PersistedTask): OperationRecord {
    return {
      id: item.id,
      code: `TSK-${item.createdAt.getUTCFullYear()}-${item.id.slice(0, 8).toUpperCase()}`,
      title: item.title,
      description: item.description,
      matterId: item.matterId,
      matterCode: item.matter.matterCode,
      matterName: item.matter.name,
      assigneeId: item.assigneeId,
      assigneeName: item.assignee?.fullName,
      reviewerId: item.reviewerId,
      reviewerName: item.reviewer?.fullName,
      priority: item.priority,
      status: item.status,
      startDate: dateOnlyString(item.startDate),
      dueDate: dateOnlyString(item.dueDate),
      estimatedMinutes: item.estimatedMinutes,
      actualMinutes: item.actualMinutes,
      isOverdue: Boolean(
        item.dueDate &&
        item.dueDate < new Date() &&
        !['COMPLETED', 'CANCELLED'].includes(item.status),
      ),
      checklists: item.checklists.map((entry) => ({
        id: entry.id,
        taskId: entry.taskId,
        title: entry.title,
        isCompleted: entry.isCompleted,
        position: entry.position,
      })),
      comments: item.comments.map((comment) => ({
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.userId,
        authorName: comment.user.fullName,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      })),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toDeadline(item: PersistedDeadline): OperationRecord {
    return {
      id: item.id,
      code: `DL-${item.createdAt.getUTCFullYear()}-${item.id.slice(0, 8).toUpperCase()}`,
      title: item.title,
      description: item.description,
      matterId: item.matterId,
      matterCode: item.matter.matterCode,
      matterName: item.matter.name,
      category: item.deadlineType,
      deadlineType: item.deadlineType,
      dueDate: dateOnlyString(item.dueDate),
      dueTime: item.dueTime,
      reminderDays: item.reminderDays,
      isCompleted: item.isCompleted,
      isOverdue: Boolean(!item.isCompleted && item.dueDate < startOfToday()),
      responsiblePersonId: item.responsiblePersonId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private toDocument(item: PersistedDocument): OperationRecord {
    const latest = item.versions[0];
    return {
      id: item.id,
      code: `DOC-${item.createdAt.getUTCFullYear()}-${item.id.slice(0, 8).toUpperCase()}`,
      title: item.title,
      matterId: item.matterId,
      matterCode: item.matter.matterCode,
      matterName: item.matter.name,
      folderId: item.folderId,
      folderName: item.folder.name,
      documentType: item.documentType,
      status: item.status,
      isRestricted: item.isRestricted,
      isSensitive: item.isSensitive,
      watermarkEnabled: item.watermarkEnabled,
      downloadRestricted: item.downloadRestricted,
      isDeleted: Boolean(item.deletedAt),
      deletedAt: item.deletedAt?.toISOString(),
      currentVersion: latest?.versionNumber ?? 0,
      storageKey: latest?.storageKey,
      fileName: latest?.originalFileName,
      originalFileName: latest?.originalFileName,
      mimeType: latest?.mimeType,
      fileSize: latest ? Number(latest.fileSize) : undefined,
      sha256: latest?.fileHash,
      versions: item.versions.map((version) => ({
        id: version.id,
        documentId: version.documentId,
        versionNumber: version.versionNumber,
        storageKey: version.storageKey,
        fileSize: Number(version.fileSize),
        mimeType: version.mimeType,
        fileName: version.originalFileName,
        originalFileName: version.originalFileName,
        sha256: version.fileHash,
        comment: version.comment,
        uploadedById: version.uploadedById,
        uploadedAt: version.createdAt.toISOString(),
      })),
      permissions: item.permissions.map((permission) => ({
        id: permission.id,
        userId: permission.userId,
        userName: permission.user?.fullName,
        roleId: permission.roleId,
        roleName: permission.role?.name,
        permission: permission.permission,
      })),
      createdBy: item.createdById,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private async nextCode(kind: 'matter', prefix: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    const last = await this.prisma.matter.findFirst({
      where: { matterCode: { startsWith: `${prefix}-${year}-` } },
      orderBy: { matterCode: 'desc' },
      select: { matterCode: true },
    });
    const sequence = Number(last?.matterCode.slice(`${prefix}-${year}-`.length)) || 0;
    return `${prefix}-${year}-${String(sequence + 1).padStart(6, '0')}`;
  }

  private async requiredUserId(value: unknown): Promise<string> {
    const preferred = await this.optionalUserId(value);
    if (preferred) return preferred;
    const first = await this.prisma.user.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!first) throw new BadRequestException('Chưa có người dùng để gắn dữ liệu.');
    return first.id;
  }

  private async optionalUserId(value: unknown): Promise<string | undefined> {
    if (typeof value !== 'string' || !isUuid(value)) return undefined;
    const user = await this.prisma.user.findFirst({
      where: { id: value, deletedAt: null },
      select: { id: true },
    });
    return user?.id;
  }

  private async requiredClientId(value: unknown): Promise<string> {
    const id = await this.optionalClientId(value);
    if (!id) throw new BadRequestException('clientId là bắt buộc và phải tồn tại.');
    return id;
  }

  private async optionalClientId(value: unknown): Promise<string | undefined> {
    if (typeof value !== 'string' || !isUuid(value)) return undefined;
    const client = await this.prisma.client.findFirst({
      where: { id: value, deletedAt: null },
      select: { id: true },
    });
    return client?.id;
  }

  private async requiredMatterId(value: unknown): Promise<string> {
    const id = await this.optionalMatterId(value);
    if (!id) throw new BadRequestException('matterId là bắt buộc và phải tồn tại.');
    return id;
  }

  private async optionalMatterId(value: unknown): Promise<string | undefined> {
    if (typeof value !== 'string' || !isUuid(value)) return undefined;
    const matter = await this.prisma.matter.findFirst({
      where: { id: value, deletedAt: null },
      select: { id: true },
    });
    return matter?.id;
  }

  private async optionalPracticeAreaId(value: unknown): Promise<string | undefined> {
    if (typeof value !== 'string' || !isUuid(value)) return undefined;
    const item = await this.prisma.practiceArea.findFirst({
      where: { id: value, isActive: true },
      select: { id: true },
    });
    return item?.id;
  }

  private async optionalContactId(value: unknown): Promise<string | undefined> {
    if (typeof value !== 'string' || !isUuid(value)) return undefined;
    const item = await this.prisma.contact.findFirst({
      where: { id: value, deletedAt: null },
      select: { id: true },
    });
    return item?.id;
  }

  private async optionalRoleId(value: unknown): Promise<string | undefined> {
    if (typeof value !== 'string' || !isUuid(value)) return undefined;
    const item = await this.prisma.role.findUnique({ where: { id: value }, select: { id: true } });
    return item?.id;
  }

  private async requiredFolderId(value: unknown): Promise<string> {
    if (typeof value !== 'string' || !isUuid(value))
      throw new BadRequestException('folderId không hợp lệ.');
    const item = await this.prisma.folder.findFirst({
      where: { id: value, deletedAt: null },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy thư mục.');
    return item.id;
  }

  private requireContext(context?: OperationsContext): OperationsContext {
    if (!context?.userId || !isUuid(context.userId))
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    return context;
  }

  private matterScope(context: OperationsContext): Prisma.MatterWhereInput {
    const memberScope: Prisma.MatterWhereInput = {
      OR: [
        { createdById: context.userId },
        { responsiblePartnerId: context.userId },
        { responsibleLawyerId: context.userId },
        { members: { some: { userId: context.userId } } },
      ],
    };
    const hasGlobalNonRestrictedAccess = context.roles.some((role) =>
      ['SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER'].includes(role),
    );
    return hasGlobalNonRestrictedAccess
      ? {
          OR: [{ confidentialityLevel: { not: ConfidentialityLevel.RESTRICTED } }, memberScope],
        }
      : memberScope;
  }

  private memberRoleFor(context: OperationsContext): MatterMemberRole {
    if (
      context.roles.some((role) => ['SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER'].includes(role))
    )
      return MatterMemberRole.RESPONSIBLE_PARTNER;
    if (context.roles.includes('LAWYER')) return MatterMemberRole.RESPONSIBLE_LAWYER;
    return MatterMemberRole.PARALEGAL_ASSISTANT;
  }

  private canViewDocument(item: PersistedDocument, context: OperationsContext): boolean {
    if (!item.isRestricted && !item.isSensitive) return true;
    return this.hasDocumentPermission(item.permissions, 'VIEW', context);
  }

  private hasDocumentPermission(
    permissions: Array<{
      permission: DocumentPermissionType;
      userId: string | null;
      role: { name: string } | null;
    }>,
    required: DocumentPermission,
    context: OperationsContext,
  ): boolean {
    return permissions.some(
      (entry) =>
        entry.permission === required &&
        (entry.userId === context.userId ||
          (entry.role?.name !== undefined && context.roles.includes(entry.role.name))),
    );
  }

  async assertDocumentPermission(
    id: string,
    permission: DocumentPermission,
    context?: OperationsContext,
  ): Promise<void> {
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy tài liệu.');
    const auth = this.requireContext(context);
    const document = await this.prisma.document.findFirst({
      where: { id, matter: { is: this.matterScope(auth) } },
      select: {
        isRestricted: true,
        isSensitive: true,
        downloadRestricted: true,
        permissions: {
          select: {
            permission: true,
            userId: true,
            role: { select: { name: true } },
          },
        },
      },
    });
    if (!document) throw new NotFoundException('Không tìm thấy tài liệu.');

    const explicit = this.hasDocumentPermission(document.permissions, permission, auth);
    const requiresExplicit =
      permission === 'VIEW'
        ? document.isRestricted || document.isSensitive
        : permission === 'DOWNLOAD'
          ? document.isRestricted || document.isSensitive || document.downloadRestricted
          : document.isRestricted ||
            document.permissions.some((entry) => entry.permission === permission);
    if (requiresExplicit && !explicit)
      throw new ForbiddenException('Bạn không có quyền với tài liệu này.');
  }

  private async ensureConflict(id: string, context: OperationsContext) {
    const item = await this.prisma.conflictCheck.findFirst({
      where: {
        id,
        OR: [
          { requestedById: context.userId },
          { reviewedById: context.userId },
          { matter: { is: this.matterScope(context) } },
        ],
      },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy kiểm tra xung đột.');
  }

  private async ensureMatter(id: string, context: OperationsContext) {
    const item = await this.prisma.matter.findFirst({
      where: { id, deletedAt: null, ...this.matterScope(context) },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy vụ việc.');
  }

  private async ensureTask(id: string, context: OperationsContext) {
    const item = await this.prisma.task.findFirst({
      where: { id, deletedAt: null, matter: { is: this.matterScope(context) } },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy công việc.');
  }

  private async ensureDeadline(id: string, context: OperationsContext) {
    const item = await this.prisma.deadline.findFirst({
      where: { id, matter: { is: this.matterScope(context) } },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Không tìm thấy hạn công việc.');
  }
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function numberValue(value: unknown): number | undefined {
  const number =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
}

function intArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => Number(item)).filter((item) => Number.isInteger(item));
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function dateOnlyValue(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dateTimeValue(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dateOnlyString(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function enumValue<T extends string>(value: unknown, enumObject: Record<string, T>): T | undefined {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(enumObject, value)
    ? enumObject[value]
    : undefined;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  try {
    JSON.stringify(value);
    return value as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}
