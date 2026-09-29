import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RequestWithContext } from '../../common/middleware/request-context.middleware';
import { AccessGuard } from '../auth/access.guard';
import { RequireRoles, RolesGuard } from '../auth/roles.guard';
import { StorageService } from '../storage/storage.service';
import { OPERATIONS_REPOSITORY } from './operations.repository';
import type { OperationsRepository } from './operations.repository';

type BodyRecord = Record<string, unknown>;

@Controller()
@UseGuards(AccessGuard, RolesGuard)
export class OperationsController {
  constructor(
    @Inject(OPERATIONS_REPOSITORY) private readonly repository: OperationsRepository,
    private readonly storage: StorageService,
  ) {}

  @Get('conflict-checks') async conflicts(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.list('conflict', this.context(request)), request);
  }
  @Get('conflict-checks/:id') async conflict(
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.find('conflict', id, this.context(request)),
      request,
    );
  }
  @Post('conflict-checks') async createConflict(
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.create('conflict', body, this.context(request)),
      request,
    );
  }
  @Post('conflict-checks/:id/review')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER')
  async reviewConflict(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    const status =
      body.decisionType === 'REJECTED_CONFIRMED' ? 'CONFIRMED_CONFLICT' : 'NO_CONFLICT';
    return this.envelope(
      await this.repository.update(
        'conflict',
        id,
        {
          ...body,
          status,
          reviewedAt: new Date().toISOString(),
          reviewedById: this.context(request).userId,
          reviewedByName: 'Nguyễn Văn Trường',
        },
        this.context(request),
      ),
      request,
    );
  }

  @Get('matters') async matters(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.list('matter', this.context(request)), request);
  }
  @Get('matters/:id') async matter(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.find('matter', id, this.context(request)), request);
  }
  @Post('matters')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER')
  async createMatter(@Body() body: BodyRecord, @Req() request: RequestWithContext) {
    return this.envelope(
      await this.repository.create('matter', body, this.context(request)),
      request,
    );
  }
  @Patch('matters/:id')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER')
  async updateMatter(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.update('matter', id, body, this.context(request)),
      request,
    );
  }
  @Post('matters/:id/status')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER')
  async changeMatterStatus(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.update(
        'matter',
        id,
        { status: body.status, statusNote: body.notes },
        this.context(request),
      ),
      request,
    );
  }
  @Post('matters/:id/members')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER')
  async addMatterMember(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.addChild(
        'matter',
        id,
        'members',
        { ...body, matterId: id },
        this.context(request),
      ),
      request,
    );
  }
  @Delete('matters/:id/members/:memberId')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER')
  async removeMatterMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() request: RequestWithContext,
  ) {
    const matter = await this.repository.find('matter', id, this.context(request));
    const members = Array.isArray(matter.members)
      ? (matter.members as BodyRecord[]).filter((member) => member.id !== memberId)
      : [];
    return this.envelope(
      await this.repository.update('matter', id, { members }, this.context(request)),
      request,
    );
  }
  @Post('matters/:id/parties')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER')
  async addMatterParty(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.addChild(
        'matter',
        id,
        'parties',
        { ...body, matterId: id },
        this.context(request),
      ),
      request,
    );
  }
  @Post('matters/:id/notes')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async addMatterNote(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      this.repository.addChild(
        'matter',
        id,
        'notes',
        { ...body, authorName: 'Nguyễn Văn Trường' },
        this.context(request),
      ),
      request,
    );
  }

  @Get('tasks') async tasks(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.list('task', this.context(request)), request);
  }
  @Get('tasks/:id') async task(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.find('task', id, this.context(request)), request);
  }
  @Post('tasks')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async createTask(@Body() body: BodyRecord, @Req() request: RequestWithContext) {
    return this.envelope(
      await this.repository.create('task', body, this.context(request)),
      request,
    );
  }
  @Patch('tasks/:id')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async updateTask(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.update('task', id, body, this.context(request)),
      request,
    );
  }
  @Post('tasks/:id/status')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async changeTaskStatus(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.update(
        'task',
        id,
        { status: body.status, statusNotes: body.notes },
        this.context(request),
      ),
      request,
    );
  }
  @Patch('tasks/:taskId/checklists/:checklistId')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async toggleChecklist(
    @Param('taskId') taskId: string,
    @Param('checklistId') checklistId: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    const task = await this.repository.find('task', taskId, this.context(request));
    const checklists = Array.isArray(task.checklists)
      ? (task.checklists as BodyRecord[]).map((item) =>
          item.id === checklistId ? { ...item, ...body } : item,
        )
      : [];
    return this.envelope(
      await this.repository.update('task', taskId, { checklists }, this.context(request)),
      request,
    );
  }
  @Post('tasks/:taskId/comments')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async addTaskComment(
    @Param('taskId') taskId: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.addChild(
        'task',
        taskId,
        'comments',
        {
          ...body,
          authorId: this.context(request).userId,
          authorName: 'Nguyễn Văn Trường',
        },
        this.context(request),
      ),
      request,
    );
  }

  @Get('deadlines') async deadlines(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.list('deadline', this.context(request)), request);
  }
  @Get('deadlines/:id') async deadline(
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.find('deadline', id, this.context(request)),
      request,
    );
  }
  @Post('deadlines')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async createDeadline(@Body() body: BodyRecord, @Req() request: RequestWithContext) {
    return this.envelope(
      await this.repository.create('deadline', body, this.context(request)),
      request,
    );
  }
  @Patch('deadlines/:id')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async updateDeadline(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.update('deadline', id, body, this.context(request)),
      request,
    );
  }
  @Post('deadlines/:id/toggle-complete')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async toggleDeadline(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.update(
        'deadline',
        id,
        {
          isCompleted: body.isCompleted,
          completedAt: body.isCompleted ? new Date().toISOString() : undefined,
        },
        this.context(request),
      ),
      request,
    );
  }

  @Get('documents') async documents(
    @Query() query: Record<string, string>,
    @Req() request: RequestWithContext,
  ) {
    let documents = await this.repository.list('document', this.context(request));
    if (query.matterId)
      documents = documents.filter((document) => document.matterId === query.matterId);
    if (query.folderId)
      documents = documents.filter((document) => document.folderId === query.folderId);
    if (query.isDeleted !== undefined)
      documents = documents.filter((document) => String(document.isDeleted) === query.isDeleted);
    if (query.status) documents = documents.filter((document) => document.status === query.status);
    if (query.isSensitive !== undefined)
      documents = documents.filter(
        (document) => String(document.isSensitive) === query.isSensitive,
      );
    if (query.search) {
      const keyword = query.search.toLowerCase();
      documents = documents.filter((document) =>
        `${document.title} ${document.fileName} ${document.matterCode}`
          .toLowerCase()
          .includes(keyword),
      );
    }
    return this.envelope(documents, request);
  }
  @Get('documents/:id') async document(
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.find('document', id, this.context(request)),
      request,
    );
  }
  @Post('documents')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async uploadDocument(@Body() body: BodyRecord, @Req() request: RequestWithContext) {
    return this.envelope(
      await this.repository.create('document', body, this.context(request)),
      request,
    );
  }
  @Post('documents/:id/versions')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async uploadVersion(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    await this.repository.assertDocumentPermission(id, 'UPLOAD_VERSION', this.context(request));
    const document = await this.repository.find('document', id, this.context(request));
    const nextVersion = Number(document.currentVersion || 1) + 1;
    return this.envelope(
      await this.repository.update(
        'document',
        id,
        {
          ...body,
          currentVersion: nextVersion,
          versions: [
            ...(Array.isArray(document.versions) ? document.versions : []),
            {
              id: randomUUID(),
              documentId: id,
              versionNumber: nextVersion,
              ...body,
              uploadedAt: new Date().toISOString(),
            },
          ],
        },
        this.context(request),
      ),
      request,
    );
  }
  @Post('documents/:id/restore-version') async restoreVersion(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    await this.repository.assertDocumentPermission(id, 'UPLOAD_VERSION', this.context(request));
    const document = await this.repository.find('document', id, this.context(request));
    const requestedVersion = Number(body.versionNumber);
    const sourceVersion = Array.isArray(document.versions)
      ? (document.versions as BodyRecord[]).find(
          (version) => Number(version.versionNumber) === requestedVersion,
        )
      : undefined;
    const nextVersion = Number(document.currentVersion || 1) + 1;
    return this.envelope(
      await this.repository.update(
        'document',
        id,
        {
          currentVersion: nextVersion,
          versions: [
            ...(Array.isArray(document.versions) ? document.versions : []),
            {
              ...(sourceVersion ?? {}),
              id: randomUUID(),
              documentId: id,
              versionNumber: nextVersion,
              restoredFromVersion: requestedVersion,
              uploadedAt: new Date().toISOString(),
              comment: body.comment ?? `Khôi phục từ phiên bản ${requestedVersion}`,
            },
          ],
        },
        this.context(request),
      ),
      request,
    );
  }
  @Patch('documents/:id/status')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER')
  async changeDocumentStatus(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.update('document', id, { status: body.status }, this.context(request)),
      request,
    );
  }
  @Patch('documents/:id/permissions')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER')
  async updateDocumentPermissions(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    await this.repository.assertDocumentPermission(id, 'SHARE', this.context(request));
    return this.envelope(
      await this.repository.update('document', id, body, this.context(request)),
      request,
    );
  }
  @Delete('documents/:id')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER')
  async deleteDocument(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      {
        message: 'Đã chuyển tài liệu vào thùng rác.',
        document: await this.repository.deleteDocument(
          id,
          typeof body.reason === 'string' ? body.reason : undefined,
          this.context(request),
        ),
      },
      request,
    );
  }
  @Post('documents/:id/restore') async restoreDocument(
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.update(
        'document',
        id,
        { isDeleted: false, deletedAt: undefined },
        this.context(request),
      ),
      request,
    );
  }
  @Delete('documents/:id/purge')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async purgeDocument(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    await this.repository.assertDocumentPermission(id, 'DELETE', this.context(request));
    await this.repository.find('document', id, this.context(request));
    if (body.confirmationWord !== 'DELETE_FOREVER') {
      throw new BadRequestException('Cần nhập chính xác DELETE_FOREVER để xóa vĩnh viễn.');
    }
    return this.envelope(
      { message: 'Đã ghi nhận yêu cầu xóa vĩnh viễn trong hệ thống.', id },
      request,
    );
  }
  @Post('documents/:id/signed-download') async signedDownload(
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    await this.repository.assertDocumentPermission(id, 'DOWNLOAD', this.context(request));
    const document = await this.repository.find('document', id, this.context(request));
    const storageKey =
      typeof document.storageKey === 'string'
        ? document.storageKey
        : `mock/${id}/v${document.currentVersion || 1}`;
    const signed = await this.storage.createDownloadUrl(storageKey);
    return this.envelope(
      {
        documentId: id,
        versionNumber: Number(document.currentVersion || 1),
        downloadUrl: signed.url,
        expiresAt: signed.expiresAt,
        expiresInSeconds: signed.expiresInSeconds,
        storageProvider: signed.provider,
        sha256: document.sha256,
        fileSize: document.fileSize,
        fileName: document.fileName,
      },
      request,
    );
  }

  @Post('documents/:id/signed-upload')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async signedUpload(
    @Param('id') id: string,
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    await this.repository.assertDocumentPermission(id, 'UPLOAD_VERSION', this.context(request));
    const document = await this.repository.find('document', id, this.context(request));
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'application/octet-stream';
    const storageKey =
      typeof document.storageKey === 'string'
        ? document.storageKey.replace(/^s3:\/\/[^/]+\//, '')
        : `${document.matterId}/${id}/${randomUUID()}`;
    const signed = await this.storage.createUploadUrl({ key: storageKey, mimeType });
    return this.envelope(
      {
        documentId: id,
        storageKey,
        uploadUrl: signed.url,
        method: signed.method,
        requiredHeaders: signed.requiredHeaders,
        expiresAt: signed.expiresAt,
        expiresInSeconds: signed.expiresInSeconds,
        storageProvider: signed.provider,
      },
      request,
    );
  }

  @Get('documents/:id/activities') async documentActivities(
    @Param('id') id: string,
    @Req() request: RequestWithContext,
  ) {
    const document = await this.repository.find('document', id, this.context(request));
    return this.envelope(
      [
        {
          id: `activity-${id}-created`,
          documentId: id,
          action: 'UPLOADED',
          performedBy: document.createdBy ?? 'emp-1',
          performedByName: document.createdByName ?? 'Người dùng LPMS',
          performedAt: document.createdAt,
          details: `Tạo tài liệu ${document.title ?? document.fileName ?? id}.`,
        },
      ],
      request,
    );
  }

  @Get('folders')
  async folders(
    @Query('matterId') matterId: string | undefined,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.listFolders(matterId, this.context(request)),
      request,
    );
  }
  @Post('folders') async createFolder(
    @Body() body: BodyRecord,
    @Req() request: RequestWithContext,
  ) {
    if (typeof body.matterId !== 'string' || typeof body.name !== 'string') {
      throw new BadRequestException('matterId và name là bắt buộc.');
    }
    return this.envelope(
      await this.repository.createFolder(
        {
          matterId: body.matterId,
          name: body.name,
          parentId: typeof body.parentId === 'string' ? body.parentId : undefined,
        },
        this.context(request),
      ),
      request,
    );
  }

  private async envelope<T>(data: T | Promise<T>, request: RequestWithContext) {
    return {
      data: await data,
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }

  private context(request: RequestWithContext) {
    const auth = (request as RequestWithContext & { auth: { sub: string; roles: string[] } }).auth;
    return {
      userId: auth.sub,
      roles: auth.roles,
    };
  }
}
