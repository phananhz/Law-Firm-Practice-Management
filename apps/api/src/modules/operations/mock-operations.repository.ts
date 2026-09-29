import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  DocumentPermission,
  OperationsContext,
  OperationsRepository,
} from './operations.repository';

export type OperationKind = 'conflict' | 'matter' | 'task' | 'deadline' | 'document';
export type OperationRecord = { id: string; [key: string]: unknown };
export type FolderRecord = {
  id: string;
  matterId: string;
  name: string;
  parentId?: string;
  documentCount: number;
  createdAt: string;
};

function iso(daysFromNow = 0) {
  const value = new Date();
  value.setDate(value.getDate() + daysFromNow);
  return value.toISOString();
}

@Injectable()
export class MockOperationsRepository implements OperationsRepository {
  private folders: FolderRecord[] = [
    {
      id: 'folder-1',
      matterId: 'mat-1',
      name: '01. Hợp đồng',
      documentCount: 4,
      createdAt: iso(-20),
    },
    {
      id: 'folder-2',
      matterId: 'mat-2',
      name: '02. Tố tụng',
      documentCount: 2,
      createdAt: iso(-12),
    },
    {
      id: 'folder-3',
      matterId: 'mat-1',
      name: '03. Bản nháp',
      documentCount: 7,
      createdAt: iso(-10),
    },
  ];
  private readonly records: Record<OperationKind, OperationRecord[]> = {
    conflict: [
      {
        id: 'cc-1',
        code: 'CC-2026-000001',
        clientId: 'cli-1',
        clientName: 'Công ty Cổ phần Năng lượng Mặt Trời Việt Nam',
        matterName: 'Tư vấn dự án điện mặt trời',
        searchTerms: ['Solar Việt Nam', 'Nguyễn Minh Khang'],
        status: 'NO_CONFLICT',
        requestedById: 'emp-3',
        requestedByName: 'Lê Hoàng Nam',
        requestedAt: iso(-6),
        results: [],
      },
      {
        id: 'cc-2',
        code: 'CC-2026-000002',
        clientName: 'Lê Hoàng Minh',
        matterName: 'Tư vấn đầu tư cá nhân',
        searchTerms: ['Lê Hoàng Minh', 'Minh Investment'],
        status: 'POTENTIAL_CONFLICT',
        requestedById: 'emp-4',
        requestedByName: 'Trần Thị Bích',
        requestedAt: iso(-2),
        results: [
          {
            id: 'result-1',
            matchedEntityType: 'PREVIOUS_CLIENT',
            matchedName: 'Minh Investment',
            similarityScore: 83,
            reason: 'Tên thương mại tương đồng',
            matterCode: 'MAT-2025-0007',
          },
        ],
      },
    ],
    matter: [
      {
        id: 'mat-1',
        matterCode: 'MAT-2026-0001',
        name: 'Tư vấn dự án Solar Việt Nam',
        description: 'Tư vấn pháp lý dự án năng lượng tái tạo.',
        clientId: 'cli-1',
        clientName: 'Công ty Cổ phần Năng lượng Mặt Trời Việt Nam',
        practiceArea: 'Doanh nghiệp & đầu tư',
        matterType: 'TRANSACTION',
        responsiblePartnerId: 'emp-2',
        responsiblePartnerName: 'Trần Thị Bích',
        responsibleLawyerId: 'emp-3',
        responsibleLawyerName: 'Lê Hoàng Nam',
        status: 'ACTIVE',
        priority: 'HIGH',
        confidentialityLevel: 'CONFIDENTIAL',
        openDate: '2026-01-15',
        expectedCloseDate: '2026-12-30',
        estimatedHours: 240,
        billingMethod: 'HOURLY',
        members: [],
        parties: [],
        tasks: [],
        deadlines: [],
        documents: [],
        notes: [],
        timeline: [],
        createdAt: iso(-20),
        updatedAt: iso(-1),
      },
      {
        id: 'mat-2',
        matterCode: 'MAT-2026-0002',
        name: 'Tranh chấp hợp đồng xây dựng',
        description: 'Đại diện khách hàng trong tranh chấp thương mại.',
        clientId: 'cli-2',
        clientName: 'Lê Hoàng Minh',
        practiceArea: 'Tranh tụng',
        matterType: 'LITIGATION',
        responsiblePartnerId: 'emp-2',
        responsiblePartnerName: 'Trần Thị Bích',
        responsibleLawyerId: 'emp-4',
        responsibleLawyerName: 'Nguyễn Văn An',
        status: 'CONFLICT_CHECK',
        priority: 'URGENT',
        confidentialityLevel: 'HIGHLY_CONFIDENTIAL',
        openDate: '2026-02-20',
        members: [],
        parties: [],
        tasks: [],
        deadlines: [],
        documents: [],
        notes: [],
        timeline: [],
        createdAt: iso(-10),
        updatedAt: iso(-2),
      },
    ],
    task: [
      {
        id: 'tsk-1',
        code: 'TSK-2026-0001',
        title: 'Rà soát điều khoản bảo lãnh',
        description: 'Kiểm tra bản dự thảo hợp đồng.',
        matterId: 'mat-1',
        matterCode: 'MAT-2026-0001',
        matterName: 'Tư vấn dự án Solar Việt Nam',
        assigneeId: 'emp-3',
        assigneeName: 'Lê Hoàng Nam',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        startDate: iso(-2),
        dueDate: iso(2),
        estimatedMinutes: 180,
        isOverdue: false,
        checklists: [
          { id: 'chk-1', title: 'Đọc bản dự thảo mới nhất', isCompleted: true },
          { id: 'chk-2', title: 'Ghi chú rủi ro pháp lý', isCompleted: false },
        ],
        comments: [],
        createdAt: iso(-3),
        updatedAt: iso(-1),
      },
      {
        id: 'tsk-2',
        code: 'TSK-2026-0002',
        title: 'Chuẩn bị hồ sơ họp khách hàng',
        description: 'Tổng hợp câu hỏi và tài liệu cần trao đổi.',
        matterId: 'mat-2',
        matterCode: 'MAT-2026-0002',
        matterName: 'Tranh chấp hợp đồng xây dựng',
        assigneeId: 'emp-4',
        assigneeName: 'Nguyễn Văn An',
        priority: 'NORMAL',
        status: 'TODO',
        dueDate: iso(4),
        estimatedMinutes: 90,
        isOverdue: false,
        checklists: [],
        comments: [],
        createdAt: iso(-1),
        updatedAt: iso(-1),
      },
      {
        id: 'tsk-3',
        code: 'TSK-2026-0003',
        title: 'Gửi bản ghi nhớ cho Partner',
        description: 'Hoàn thiện và gửi bản memo nội bộ.',
        matterId: 'mat-1',
        matterCode: 'MAT-2026-0001',
        matterName: 'Tư vấn dự án Solar Việt Nam',
        assigneeId: 'emp-3',
        assigneeName: 'Lê Hoàng Nam',
        priority: 'URGENT',
        status: 'TODO',
        dueDate: iso(-1),
        isOverdue: true,
        checklists: [],
        comments: [],
        createdAt: iso(-3),
        updatedAt: iso(-2),
      },
    ],
    deadline: [
      {
        id: 'dl-1',
        code: 'DL-2026-0001',
        title: 'Nộp bản giải trình cho Tòa án',
        description: 'Hạn nộp hồ sơ theo thông báo của Tòa.',
        matterId: 'mat-2',
        matterCode: 'MAT-2026-0002',
        matterName: 'Tranh chấp hợp đồng xây dựng',
        category: 'COURT',
        dueDate: iso(3),
        dueTime: '17:00',
        reminderDays: [7, 3, 1],
        isCompleted: false,
        isOverdue: false,
        responsiblePersonId: 'emp-4',
        responsiblePersonName: 'Nguyễn Văn An',
        courtName: 'TAND TP. Hồ Chí Minh',
        caseNumber: '12/2026/TLST-KDTM',
        createdAt: iso(-4),
        updatedAt: iso(-2),
      },
      {
        id: 'dl-2',
        code: 'DL-2026-0002',
        title: 'Phản hồi câu hỏi khách hàng',
        description: 'Gửi phản hồi chính thức cho khách hàng.',
        matterId: 'mat-1',
        matterCode: 'MAT-2026-0001',
        matterName: 'Tư vấn dự án Solar Việt Nam',
        category: 'CLIENT',
        dueDate: iso(1),
        dueTime: '12:00',
        reminderDays: [3, 1],
        isCompleted: false,
        isOverdue: false,
        responsiblePersonId: 'emp-3',
        responsiblePersonName: 'Lê Hoàng Nam',
        createdAt: iso(-2),
        updatedAt: iso(-1),
      },
      {
        id: 'dl-3',
        code: 'DL-2026-0003',
        title: 'Gia hạn giấy phép dự án',
        description: 'Mốc nội bộ để chuẩn bị hồ sơ gia hạn.',
        matterId: 'mat-1',
        matterCode: 'MAT-2026-0001',
        matterName: 'Tư vấn dự án Solar Việt Nam',
        category: 'LICENSE_EXPIRY',
        dueDate: iso(-2),
        reminderDays: [30, 15, 7],
        isCompleted: false,
        isOverdue: true,
        responsiblePersonId: 'emp-3',
        responsiblePersonName: 'Lê Hoàng Nam',
        createdAt: iso(-20),
        updatedAt: iso(-3),
      },
    ],
    document: [
      {
        id: 'doc-1',
        matterId: 'mat-1',
        matterCode: 'MAT-2026-0001',
        matterTitle: 'Tư vấn dự án Solar Việt Nam',
        folderId: 'folder-1',
        folderName: '01. Hợp đồng',
        title: 'Dự thảo hợp đồng tư vấn pháp lý',
        description: 'Bản dự thảo mới nhất.',
        currentVersion: 2,
        status: 'INTERNAL_REVIEW',
        fileName: 'hop-dong-tu-van-v2.docx',
        fileType: 'docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 245760,
        sha256: 'mock-sha256-doc-1',
        storageKey: 'mock/doc-1/v2',
        isSensitive: false,
        watermarkEnabled: false,
        downloadRestricted: false,
        partnerOnly: false,
        isDeleted: false,
        versions: [],
        createdAt: iso(-5),
        updatedAt: iso(-1),
        createdBy: 'emp-3',
        createdByName: 'Lê Hoàng Nam',
      },
      {
        id: 'doc-2',
        matterId: 'mat-2',
        matterCode: 'MAT-2026-0002',
        matterTitle: 'Tranh chấp hợp đồng xây dựng',
        folderId: 'folder-2',
        folderName: '02. Tố tụng',
        title: 'Thông báo thụ lý vụ án',
        description: 'Tài liệu do Tòa án phát hành.',
        currentVersion: 1,
        status: 'FINAL',
        fileName: 'thong-bao-thu-ly.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileSize: 1048576,
        sha256: 'mock-sha256-doc-2',
        storageKey: 'mock/doc-2/v1',
        isSensitive: true,
        watermarkEnabled: true,
        downloadRestricted: true,
        partnerOnly: true,
        isDeleted: false,
        versions: [],
        createdAt: iso(-12),
        updatedAt: iso(-4),
        createdBy: 'emp-4',
        createdByName: 'Nguyễn Văn An',
      },
    ],
  };

  list(kind: OperationKind, _context?: OperationsContext) {
    void _context;
    return this.records[kind].map((record) => this.clone(record));
  }

  listFolders(matterId?: string, _context?: OperationsContext) {
    void _context;
    return this.folders
      .filter((folder) => !matterId || folder.matterId === matterId)
      .map((folder) => ({ ...folder }));
  }

  createFolder(
    input: { matterId: string; name: string; parentId?: string },
    _context?: OperationsContext,
  ) {
    void _context;
    const folder: FolderRecord = {
      id: randomUUID(),
      matterId: input.matterId,
      name: input.name.trim(),
      parentId: input.parentId,
      documentCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.folders.push(folder);
    return { ...folder };
  }

  find(kind: OperationKind, id: string, _context?: OperationsContext) {
    void _context;
    const record = this.records[kind].find((item) => item.id === id);
    if (!record) throw new NotFoundException('Không tìm thấy dữ liệu.');
    return this.clone(record);
  }

  create(kind: OperationKind, payload: Record<string, unknown>, _context?: OperationsContext) {
    void _context;
    const index = this.records[kind].length + 1;
    const now = new Date().toISOString();
    const prefix = { conflict: 'CC', matter: 'MAT', task: 'TSK', deadline: 'DL', document: 'DOC' }[
      kind
    ];
    const record: OperationRecord = {
      id: randomUUID(),
      ...payload,
      code: payload.code || `${prefix}-2026-${String(index).padStart(6, '0')}`,
      createdAt: now,
      updatedAt: now,
      ...(kind === 'conflict'
        ? {
            status: 'NO_CONFLICT',
            results: [],
            requestedAt: now,
            requestedById: 'emp-1',
            requestedByName: 'Nguyễn Văn Trường',
          }
        : {}),
      ...(kind === 'matter'
        ? {
            matterCode: payload.matterCode || `MAT-2026-${String(index).padStart(6, '0')}`,
            status: 'INTAKE',
            members: [],
            parties: [],
            tasks: [],
            deadlines: [],
            documents: [],
            notes: [],
            timeline: [],
          }
        : {}),
      ...(kind === 'task'
        ? { status: 'TODO', checklists: [], comments: [], isOverdue: false }
        : {}),
      ...(kind === 'deadline'
        ? { isCompleted: false, isOverdue: false, reminderDays: payload.reminderDays || [7, 3, 1] }
        : {}),
      ...(kind === 'document'
        ? { currentVersion: 1, status: 'DRAFT', isDeleted: false, versions: [] }
        : {}),
    };
    this.records[kind].unshift(record);
    return this.clone(record);
  }

  update(
    kind: OperationKind,
    id: string,
    payload: Record<string, unknown>,
    _context?: OperationsContext,
  ) {
    void _context;
    const index = this.records[kind].findIndex((record) => record.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy dữ liệu.');
    this.records[kind][index] = {
      ...this.records[kind][index],
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    return this.clone(this.records[kind][index]);
  }

  addChild(
    kind: 'matter' | 'task',
    id: string,
    childKey: string,
    payload: Record<string, unknown>,
    _context?: OperationsContext,
  ) {
    void _context;
    const index = this.records[kind].findIndex((record) => record.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy dữ liệu.');
    const child = { id: randomUUID(), ...payload, createdAt: new Date().toISOString() };
    const children = Array.isArray(this.records[kind][index][childKey])
      ? [...(this.records[kind][index][childKey] as unknown[]), child]
      : [child];
    this.records[kind][index][childKey] = children;
    this.records[kind][index].updatedAt = new Date().toISOString();
    return this.clone(child);
  }

  deleteDocument(id: string, reason?: string, _context?: OperationsContext) {
    void _context;
    return this.update('document', id, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deleteReason: reason || 'Đã chuyển vào thùng rác.',
    });
  }

  assertDocumentPermission(
    _id: string,
    _permission: DocumentPermission,
    _context?: OperationsContext,
  ) {
    void _id;
    void _permission;
    void _context;
    return undefined;
  }

  private clone<T extends OperationRecord>(record: T): T {
    return JSON.parse(JSON.stringify(record)) as T;
  }
}
