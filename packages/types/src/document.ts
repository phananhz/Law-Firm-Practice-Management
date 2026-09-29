export type DocumentStatus =
  'DRAFT' | 'INTERNAL_REVIEW' | 'CLIENT_REVIEW' | 'APPROVED' | 'SIGNED' | 'FINAL' | 'ARCHIVED';

export type DocumentPermissionType =
  'VIEW' | 'DOWNLOAD' | 'UPLOAD_VERSION' | 'EDIT_METADATA' | 'MOVE' | 'DELETE' | 'SHARE';

export interface DocumentFolder {
  id: string;
  matterId: string;
  matterCode: string;
  matterTitle: string;
  name: string;
  code: string;
  order: number;
  documentCount: number;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  sha256: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  comment: string;
  isCurrent: boolean;
}

export interface DocumentItem {
  id: string;
  matterId: string;
  matterCode: string;
  matterTitle: string;
  folderId: string;
  folderName: string;
  title: string;
  description?: string;
  currentVersion: number;
  status: DocumentStatus;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
  storageKey: string;
  isSensitive: boolean;
  watermarkEnabled: boolean;
  downloadRestricted: boolean;
  partnerOnly: boolean;
  whitelistedUserIds?: string[];
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  deleteReason?: string;
  versions: DocumentVersion[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
}

export type DocumentActivityAction =
  | 'UPLOADED'
  | 'VERSION_CREATED'
  | 'RESTORED'
  | 'DOWNLOADED'
  | 'VIEWED'
  | 'STATUS_CHANGED'
  | 'PERMISSIONS_UPDATED'
  | 'SOFT_DELETED'
  | 'RECYCLED_RESTORED'
  | 'PERMANENTLY_PURGED';

export interface DocumentActivity {
  id: string;
  documentId: string;
  action: DocumentActivityAction;
  performedBy: string;
  performedByName: string;
  performedAt: string;
  details: string;
  ipAddress?: string;
}

export interface SignedUrlResponse {
  documentId: string;
  versionNumber: number;
  downloadUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
  sha256: string;
  watermarkText?: string;
  fileSize: number;
  fileName: string;
}

export interface DocumentFilterParams {
  matterId?: string;
  folderId?: string;
  status?: DocumentStatus;
  search?: string;
  isDeleted?: boolean;
  isSensitive?: boolean;
}
