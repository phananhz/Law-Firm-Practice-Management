import type {
  FolderRecord,
  MockOperationsRepository,
  OperationKind,
  OperationRecord,
} from './mock-operations.repository';

export type MaybePromise<T> = T | Promise<T>;

export type OperationsContext = {
  userId: string;
  roles: string[];
};

export type DocumentPermission =
  'VIEW' | 'DOWNLOAD' | 'UPLOAD_VERSION' | 'EDIT_METADATA' | 'MOVE' | 'DELETE' | 'SHARE';

export interface OperationsRepository {
  list(kind: OperationKind, context?: OperationsContext): MaybePromise<OperationRecord[]>;
  find(kind: OperationKind, id: string, context?: OperationsContext): MaybePromise<OperationRecord>;
  create(
    kind: OperationKind,
    payload: Record<string, unknown>,
    context?: OperationsContext,
  ): MaybePromise<OperationRecord>;
  update(
    kind: OperationKind,
    id: string,
    payload: Record<string, unknown>,
    context?: OperationsContext,
  ): MaybePromise<OperationRecord>;
  addChild(
    kind: 'matter' | 'task',
    id: string,
    childKey: string,
    payload: Record<string, unknown>,
    context?: OperationsContext,
  ): MaybePromise<OperationRecord>;
  deleteDocument(
    id: string,
    reason?: string,
    context?: OperationsContext,
  ): MaybePromise<OperationRecord>;
  assertDocumentPermission(
    id: string,
    permission: DocumentPermission,
    context?: OperationsContext,
  ): MaybePromise<void>;
  listFolders(matterId?: string, context?: OperationsContext): MaybePromise<FolderRecord[]>;
  createFolder(
    input: {
      matterId: string;
      name: string;
      parentId?: string;
    },
    context?: OperationsContext,
  ): MaybePromise<FolderRecord>;
}

export const OPERATIONS_REPOSITORY = Symbol('OPERATIONS_REPOSITORY');

// Keep this import type visible to editors that navigate the legacy contract.
export type MockOperationsContract = MockOperationsRepository;
