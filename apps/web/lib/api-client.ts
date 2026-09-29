import type {
  ActiveSession,
  ApiResponse,
  Department,
  OrganizationOverview,
  Employee,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResult,
  PermissionDefinition,
  Position,
  ResetPasswordPayload,
  RoleDefinition,
  UserSummary,
  VerifyMfaPayload,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  Client,
  Contact,
  ClientRelation,
  CreateClientPayload,
  UpdateClientPayload,
  ChangeClientStatusPayload,
  ClientStatus,
  ConflictCheck,
  ConflictResultItem,
  ConflictStatus,
  CreateConflictCheckPayload,
  ReviewConflictCheckPayload,
  Matter,
  MatterStatus,
  MatterMember,
  MatterParty,
  MatterTimelineEvent,
  MatterTaskSummary,
  MatterDeadlineSummary,
  MatterDocumentSummary,
  MatterNote,
  CreateMatterPayload,
  UpdateMatterPayload,
  ChangeMatterStatusPayload,
  AddMatterMemberPayload,
  AddMatterPartyPayload,
  ConfidentialityLevel,
  MatterPriority,
  MatterType,
  Task,
  TaskStatus,
  TaskPriority,
  TaskChecklistItem,
  TaskComment,
  CreateTaskPayload,
  UpdateTaskPayload,
  ChangeTaskStatusPayload,
  Deadline,
  DeadlineCategory,
  CreateDeadlinePayload,
  UpdateDeadlinePayload,
  DocumentStatus,
  DocumentPermissionType,
  DocumentFolder,
  DocumentVersion,
  DocumentItem,
  DocumentActivity,
  SignedUrlResponse,
  DocumentFilterParams,
  NotificationItem,
  SearchResultSet,
  ReportOverview,
  AuditEntry,
} from '@lpms/types';

export class ApiError extends Error {
  code: string;
  details?: Array<{ field?: string; message: string }>;
  status: number;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    status: number = 400,
    details?: Array<{ field?: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || 'mock';
const configuredMockDelay = Number(process.env.NEXT_PUBLIC_MOCK_API_DELAY_MS ?? '0');
const MOCK_API_DELAY_MS = Number.isFinite(configuredMockDelay)
  ? Math.max(0, configuredMockDelay)
  : 0;

// Mock identities keep the three UI workspaces testable before the API is connected.
// They deliberately retain the underlying RBAC roles used by the real backend.
const MOCK_USERS: Record<string, UserSummary> = {
  'admin@lpms.vn': {
    id: 'usr-admin-0001',
    email: 'admin@lpms.vn',
    fullName: 'Nguyễn Minh Khôi',
    roles: ['SYSTEM_ADMIN'],
    status: 'ACTIVE',
    department: 'Vận hành hệ thống',
    position: 'Quản trị hệ thống',
    mfaEnabled: false,
  },
  'director@lpms.vn': {
    id: 'usr-director-0001',
    email: 'director@lpms.vn',
    fullName: 'Nguyễn Văn An',
    roles: ['MANAGING_PARTNER'],
    status: 'ACTIVE',
    department: 'Ban điều hành',
    position: 'Giám đốc',
    mfaEnabled: false,
  },
  'lawyer@lpms.vn': {
    id: 'usr-lawyer-0001',
    email: 'lawyer@lpms.vn',
    fullName: 'Lê Hoàng Nam',
    roles: ['LAWYER'],
    status: 'ACTIVE',
    department: 'Tranh tụng & Trọng tài',
    position: 'Luật sư cấp cao',
    mfaEnabled: false,
  },
  'paralegal@lpms.vn': {
    id: 'usr-paralegal-0001',
    email: 'paralegal@lpms.vn',
    fullName: 'Phạm Thu Trang',
    roles: ['PARALEGAL'],
    status: 'ACTIVE',
    department: 'Doanh nghiệp & Đầu tư M&A',
    position: 'Trợ lý pháp lý',
    mfaEnabled: false,
  },
  'mfa.partner@lpms.vn': {
    id: 'usr-partner-0001',
    email: 'mfa.partner@lpms.vn',
    fullName: 'Trần Thị Bích',
    roles: ['PARTNER', 'LAWYER'],
    status: 'ACTIVE',
    department: 'Doanh nghiệp & Đầu tư M&A',
    position: 'Partner',
    mfaEnabled: true,
  },
};

let mockSessions: ActiveSession[] = [
  {
    id: 'ses-1',
    isCurrent: true,
    ipAddress: '113.161.45.12 (Hà Nội, VN)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
    browser: 'Chrome 128 (Windows)',
    os: 'Windows 11',
    deviceType: 'desktop',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'ses-2',
    isCurrent: false,
    ipAddress: '14.232.180.99 (TP. Hồ Chí Minh, VN)',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) Safari/604.1',
    browser: 'Safari (iOS Mobile)',
    os: 'iOS 17.6',
    deviceType: 'mobile',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ses-3',
    isCurrent: false,
    ipAddress: '42.114.77.20 (Đà Nẵng, VN)',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Firefox/129.0',
    browser: 'Firefox 129 (Mac)',
    os: 'macOS Sonoma',
    deviceType: 'desktop',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
];

let mockAuthenticated = false;
let mockCurrentUser: UserSummary | null = null;
let mockPendingUser: UserSummary | null = null;
const MOCK_SESSION_STORAGE_KEY = 'lpms.mock.session.user';

function getMockUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const knownUser = MOCK_USERS[normalizedEmail];
  if (knownUser) return { ...knownUser };

  // Keep the mock useful for ad-hoc form testing without granting an elevated role.
  return { ...MOCK_USERS['lawyer@lpms.vn'], email: normalizedEmail };
}

function persistMockUser(user: UserSummary | null) {
  if (typeof window === 'undefined') return;
  if (user) window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
}

function restoreMockUser() {
  if (mockCurrentUser || typeof window === 'undefined') return mockCurrentUser;
  try {
    const stored = window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as UserSummary;
    if (!parsed?.id || !parsed?.email || !Array.isArray(parsed.roles)) return null;
    mockCurrentUser = parsed;
    mockAuthenticated = true;
  } catch {
    window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
  }
  return mockCurrentUser;
}

let mockNotifications: NotificationItem[] = [
  {
    id: 'noti-1',
    title: 'Nhiệm vụ mới được giao',
    message: 'Bạn được giao rà soát hồ sơ MAT-2026-0001.',
    tone: 'INFO',
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    href: '/tasks/tsk-1',
    actorName: 'Trần Thị Bích',
  },
  {
    id: 'noti-2',
    title: 'Thời hạn sắp đến',
    message: 'Hạn phản hồi tài liệu của khách hàng còn 2 ngày.',
    tone: 'WARNING',
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    href: '/deadlines/dl-2',
  },
  {
    id: 'noti-3',
    title: 'Tài liệu mới trong hồ sơ',
    message: 'Một bản dự thảo hợp đồng vừa được tải lên MAT-2026-0001.',
    tone: 'SUCCESS',
    readAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    href: '/documents/doc-1',
    actorName: 'Lê Hoàng Nam',
  },
  {
    id: 'noti-4',
    title: 'Yêu cầu xem xét xung đột',
    message: 'Có một phiếu kiểm tra đang chờ quyết định.',
    tone: 'SECURITY',
    createdAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(),
    href: '/conflict-checks/cc-2',
  },
];

const mockAuditEntries: AuditEntry[] = [
  {
    id: 'audit-1',
    action: 'MATTER_STATUS_CHANGED',
    module: 'matter',
    entityType: 'Matter',
    entityId: 'mat-1',
    actorId: 'emp-1',
    actorName: 'Nguyễn Văn Trường',
    outcome: 'SUCCESS',
    details: 'Chuyển hồ sơ sang trạng thái đang hoạt động.',
    createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: 'audit-2',
    action: 'TASK_CREATED',
    module: 'task',
    entityType: 'Task',
    entityId: 'tsk-1',
    actorId: 'emp-2',
    actorName: 'Trần Thị Bích',
    outcome: 'SUCCESS',
    details: 'Giao nhiệm vụ cho Lê Hoàng Nam.',
    createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
  {
    id: 'audit-3',
    action: 'DOCUMENT_UPLOADED',
    module: 'document',
    entityType: 'Document',
    entityId: 'doc-1',
    actorId: 'emp-3',
    actorName: 'Lê Hoàng Nam',
    outcome: 'SUCCESS',
    details: 'Tải lên phiên bản 2 của tài liệu.',
    createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
  },
];

let mockDepartments: Department[] = [
  {
    id: 'dep-1',
    code: 'LIT',
    name: 'Tranh tụng & Trọng tài',
    description: 'Xử lý các vụ việc tố tụng tòa án, trọng tài thương mại và giải quyết tranh chấp.',
    managerName: 'Luật sư Nguyễn Văn An',
    employeeCount: 8,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'dep-2',
    code: 'CORP',
    name: 'Doanh nghiệp & Đầu tư M&A',
    description:
      'Tư vấn pháp lý doanh nghiệp, đầu tư nước ngoài FDI, sáp nhập và mua bán doanh nghiệp.',
    managerName: 'Luật sư Trần Thị Bích',
    employeeCount: 12,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'dep-3',
    code: 'IP',
    name: 'Sở hữu trí tuệ & Công nghệ',
    description:
      'Đăng ký nhãn hiệu, sáng chế, bản quyền, tranh chấp IP và bảo vệ bí mật kinh doanh.',
    managerName: 'Luật sư Hoàng Minh Tuấn',
    employeeCount: 5,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'dep-4',
    code: 'TAX',
    name: 'Thuế, Tài chính & Lao động',
    description: 'Tư vấn cơ cấu thuế, quan hệ lao động, tái cấu trúc và thỏa ước lao động tập thể.',
    managerName: 'Luật sư Vũ Phương Anh',
    employeeCount: 6,
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'dep-5',
    code: 'ADMIN',
    name: 'Hành chính, Kế toán & Vận hành',
    description: 'Bộ máy hỗ trợ hành chính, thanh toán, hóa đơn và lưu trữ tài liệu chung.',
    managerName: 'Nguyễn Thị Thu Hà',
    employeeCount: 4,
    createdAt: '2026-01-15T00:00:00Z',
  },
];

let mockPositions: Position[] = [
  {
    id: 'pos-1',
    code: 'MP',
    title: 'Managing Partner',
    level: 1,
    createdAt: '2026-01-15T00:00:00Z',
  },
  { id: 'pos-2', code: 'SP', title: 'Senior Partner', level: 2, createdAt: '2026-01-15T00:00:00Z' },
  { id: 'pos-3', code: 'PART', title: 'Partner', level: 3, createdAt: '2026-01-15T00:00:00Z' },
  {
    id: 'pos-4',
    code: 'SA',
    title: 'Senior Associate (Luật sư cấp cao)',
    level: 4,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pos-5',
    code: 'JA',
    title: 'Junior Associate (Luật sư)',
    level: 5,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pos-6',
    code: 'PARA',
    title: 'Paralegal (Trợ lý pháp lý)',
    level: 6,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pos-7',
    code: 'INT',
    title: 'Legal Intern (Thực tập sinh)',
    level: 7,
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pos-8',
    code: 'ACC',
    title: 'Chief Accountant',
    level: 5,
    createdAt: '2026-01-15T00:00:00Z',
  },
];

let mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'EMP-001',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@lpms.vn',
    phone: '0903123456',
    departmentId: 'dep-1',
    departmentName: 'Tranh tụng & Trọng tài',
    positionId: 'pos-1',
    positionTitle: 'Managing Partner',
    roles: ['MANAGING_PARTNER', 'PARTNER'],
    status: 'ACTIVE',
    startDate: '2020-01-01',
    activeSessionsCount: 3,
    mfaEnabled: true,
    createdAt: '2020-01-01T00:00:00Z',
  },
  {
    id: 'emp-2',
    employeeCode: 'EMP-002',
    fullName: 'Trần Thị Bích',
    email: 'bich.tran@lpms.vn',
    phone: '0918987654',
    departmentId: 'dep-2',
    departmentName: 'Doanh nghiệp & Đầu tư M&A',
    positionId: 'pos-3',
    positionTitle: 'Partner',
    roles: ['PARTNER', 'LAWYER'],
    status: 'ACTIVE',
    startDate: '2021-03-15',
    activeSessionsCount: 1,
    mfaEnabled: true,
    createdAt: '2021-03-15T00:00:00Z',
  },
  {
    id: 'emp-3',
    employeeCode: 'EMP-003',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@lpms.vn',
    phone: '0982345678',
    departmentId: 'dep-1',
    departmentName: 'Tranh tụng & Trọng tài',
    positionId: 'pos-4',
    positionTitle: 'Senior Associate (Luật sư cấp cao)',
    roles: ['LAWYER'],
    status: 'ACTIVE',
    startDate: '2022-06-01',
    activeSessionsCount: 2,
    mfaEnabled: false,
    createdAt: '2022-06-01T00:00:00Z',
  },
  {
    id: 'emp-4',
    employeeCode: 'EMP-004',
    fullName: 'Phạm Thu Trang',
    email: 'trang.pham@lpms.vn',
    phone: '0971239876',
    departmentId: 'dep-2',
    departmentName: 'Doanh nghiệp & Đầu tư M&A',
    positionId: 'pos-6',
    positionTitle: 'Paralegal (Trợ lý pháp lý)',
    roles: ['PARALEGAL'],
    status: 'ACTIVE',
    startDate: '2023-09-01',
    activeSessionsCount: 1,
    mfaEnabled: false,
    createdAt: '2023-09-01T00:00:00Z',
  },
  {
    id: 'emp-5',
    employeeCode: 'EMP-005',
    fullName: 'Đỗ Minh Đức',
    email: 'duc.do@lpms.vn',
    phone: '0934567890',
    departmentId: 'dep-1',
    departmentName: 'Tranh tụng & Trọng tài',
    positionId: 'pos-5',
    positionTitle: 'Junior Associate (Luật sư)',
    roles: ['LAWYER'],
    status: 'SUSPENDED',
    startDate: '2024-01-10',
    activeSessionsCount: 0,
    mfaEnabled: false,
    createdAt: '2024-01-10T00:00:00Z',
  },
];

const mockPermissions: PermissionDefinition[] = [
  {
    id: 'p1',
    code: 'matter.read',
    name: 'Xem vụ việc được giao',
    module: 'matter',
    description: 'Được phân quyền xem chi tiết vụ việc tham gia',
  },
  {
    id: 'p2',
    code: 'matter.read_all',
    name: 'Xem tất cả vụ việc',
    module: 'matter',
    description: 'Đặc quyền xem mọi vụ việc trong toàn công ty (trừ RESTRICTED)',
    isSensitive: true,
  },
  {
    id: 'p3',
    code: 'matter.create',
    name: 'Khởi tạo vụ việc',
    module: 'matter',
    description: 'Tạo mới hồ sơ vụ việc pháp lý',
  },
  {
    id: 'p4',
    code: 'matter.update',
    name: 'Chỉnh sửa vụ việc',
    module: 'matter',
    description: 'Cập nhật tiến độ, thông tin hồ sơ',
  },
  {
    id: 'p5',
    code: 'matter.manage_members',
    name: 'Quản lý thành viên vụ việc',
    module: 'matter',
    description: 'Gán và thu hồi nhân sự phụ trách vụ việc',
  },
  {
    id: 'p6',
    code: 'matter.archive',
    name: 'Đóng và lưu trữ vụ việc',
    module: 'matter',
    description: 'Đánh dấu hoàn thành và chuyển kho lưu trữ',
  },

  {
    id: 'p7',
    code: 'client.read',
    name: 'Xem thông tin khách hàng',
    module: 'client',
    description: 'Tra cứu danh bạ khách hàng cá nhân và doanh nghiệp',
  },
  {
    id: 'p8',
    code: 'client.create',
    name: 'Tiếp nhận khách hàng (Intake)',
    module: 'client',
    description: 'Thêm mới khách hàng vào quy trình thẩm định',
  },
  {
    id: 'p9',
    code: 'client.update',
    name: 'Cập nhật hồ sơ khách hàng',
    module: 'client',
    description: 'Sửa thông tin pháp nhân/cá nhân của thân chủ',
  },

  {
    id: 'p10',
    code: 'conflict.check',
    name: 'Khởi tạo Conflict Check',
    module: 'client',
    description: 'Tra cứu trùng lặp và xung đột lợi ích đương sự',
  },
  {
    id: 'p11',
    code: 'conflict.review',
    name: 'Phê duyệt Conflict Check',
    module: 'client',
    description: 'Quyết định cho phép hoặc từ chối thụ lý hồ sơ',
    isSensitive: true,
  },

  {
    id: 'p12',
    code: 'document.read',
    name: 'Xem danh mục tài liệu',
    module: 'document',
    description: 'Xem cây thư mục và danh sách file trong Matter',
  },
  {
    id: 'p13',
    code: 'document.download',
    name: 'Tải tài liệu đính kèm',
    module: 'document',
    description: 'Sinh signed URL để tải file tài liệu về máy',
  },
  {
    id: 'p14',
    code: 'document.upload',
    name: 'Tải lên tài liệu / Version mới',
    module: 'document',
    description: 'Đăng tải bản thảo, hợp đồng, chứng cứ',
  },
  {
    id: 'p15',
    code: 'document.delete',
    name: 'Xóa tài liệu (Soft delete)',
    module: 'document',
    description: 'Chuyển tài liệu vào thùng rác',
  },
  {
    id: 'p16',
    code: 'document.purge',
    name: 'Xóa vĩnh viễn tài liệu',
    module: 'document',
    description: 'Thanh lý hoàn toàn file khỏi lưu trữ',
    isSensitive: true,
  },

  {
    id: 'p17',
    code: 'task.create',
    name: 'Giao việc (Tạo task)',
    module: 'task',
    description: 'Tạo công việc và deadline trong vụ việc',
  },
  {
    id: 'p18',
    code: 'task.update',
    name: 'Cập nhật tiến độ task',
    module: 'task',
    description: 'Đổi trạng thái, tích checklist công việc',
  },

  {
    id: 'p19',
    code: 'user.manage',
    name: 'Quản trị nhân sự & tài khoản',
    module: 'user',
    description: 'Thêm, sửa, đình chỉ tài khoản nhân viên',
    isSensitive: true,
  },
  {
    id: 'p20',
    code: 'role.manage',
    name: 'Cấu hình phân quyền vai trò',
    module: 'system',
    description: 'Sửa đổi ma trận quyền của từng Role',
    isSensitive: true,
  },
  {
    id: 'p21',
    code: 'audit.read',
    name: 'Tra cứu nhật ký kiểm toán',
    module: 'audit',
    description: 'Xem lịch sử toàn bộ các hành động trong hệ thống',
    isSensitive: true,
  },
];

let mockRoles: RoleDefinition[] = [
  {
    id: 'r-1',
    name: 'SYSTEM_ADMIN',
    displayName: 'Quản trị viên Hệ thống (System Admin)',
    description: 'Toàn quyền kỹ thuật, quản lý tài khoản, cấu hình và xem audit trail.',
    isSystem: true,
    userCount: 1,
    permissions: ['user.manage', 'role.manage', 'audit.read', 'client.read', 'document.purge'],
  },
  {
    id: 'r-2',
    name: 'MANAGING_PARTNER',
    displayName: 'Luật sư Điều hành (Managing Partner)',
    description: 'Lãnh đạo cao nhất của công ty luật, phê duyệt vụ việc, phân bổ đối tác.',
    isSystem: true,
    userCount: 1,
    permissions: mockPermissions.map((p) => p.code),
  },
  {
    id: 'r-3',
    name: 'PARTNER',
    displayName: 'Luật sư Thành viên (Partner)',
    description: 'Chịu trách nhiệm chính các vụ việc được giao, phân công luật sư cộng sự.',
    isSystem: true,
    userCount: 2,
    permissions: [
      'matter.read',
      'matter.create',
      'matter.update',
      'matter.manage_members',
      'matter.archive',
      'client.read',
      'client.create',
      'client.update',
      'conflict.check',
      'conflict.review',
      'document.read',
      'document.download',
      'document.upload',
      'document.delete',
      'task.create',
      'task.update',
    ],
  },
  {
    id: 'r-4',
    name: 'LAWYER',
    displayName: 'Luật sư (Associate Lawyer)',
    description: 'Trực tiếp nghiên cứu, soạn thảo hồ sơ và xử lý vụ việc được phân công.',
    isSystem: true,
    userCount: 4,
    permissions: [
      'matter.read',
      'matter.update',
      'client.read',
      'conflict.check',
      'document.read',
      'document.download',
      'document.upload',
      'task.create',
      'task.update',
    ],
  },
  {
    id: 'r-5',
    name: 'PARALEGAL',
    displayName: 'Trợ lý Pháp lý (Paralegal)',
    description:
      'Hỗ trợ luật sư thu thập tài liệu, quản lý deadline và nộp hồ sơ cơ quan nhà nước.',
    isSystem: true,
    userCount: 3,
    permissions: [
      'matter.read',
      'client.read',
      'conflict.check',
      'document.read',
      'document.download',
      'document.upload',
      'task.update',
    ],
  },
  {
    id: 'r-6',
    name: 'INTERN',
    displayName: 'Thực tập sinh (Intern)',
    description: 'Quyền xem giới hạn, hỗ trợ tra cứu án lệ và rà soát tài liệu cơ bản.',
    isSystem: true,
    userCount: 2,
    permissions: ['matter.read', 'document.read'],
  },
  {
    id: 'r-7',
    name: 'ACCOUNTANT',
    displayName: 'Kế toán (Accountant)',
    description: 'Quản lý thu chi, chi phí vụ việc và phát hành thông báo thanh toán.',
    isSystem: true,
    userCount: 1,
    permissions: ['client.read'],
  },
  {
    id: 'r-8',
    name: 'ADMIN_STAFF',
    displayName: 'Nhân viên Hành chính (Admin Staff)',
    description: 'Tiếp nhận công văn, hồ sơ giấy và hỗ trợ thủ tục văn phòng.',
    isSystem: true,
    userCount: 2,
    permissions: ['client.read', 'client.create'],
  },
  {
    id: 'r-9',
    name: 'RECEPTIONIST',
    displayName: 'Lễ tân (Receptionist)',
    description: 'Tiếp đón khách hàng ban đầu và nhập thông tin liên hệ cơ bản.',
    isSystem: true,
    userCount: 1,
    permissions: ['client.read', 'client.create'],
  },
  {
    id: 'r-10',
    name: 'EXTERNAL_COLLABORATOR',
    displayName: 'Cộng tác viên Bên ngoài',
    description: 'Chỉ được xem vụ việc cụ thể được chỉ định bằng văn bản.',
    isSystem: true,
    userCount: 0,
    permissions: ['matter.read', 'document.read'],
  },
];

let mockClients: Client[] = [
  {
    id: 'cli-1',
    clientCode: 'CLI-2026-000001',
    type: 'ORGANIZATION',
    status: 'ACTIVE',
    displayName: 'Công ty Cổ phần Năng lượng Tái tạo Mekong',
    vietnameseName: 'Công ty Cổ phần Năng lượng Tái tạo Mekong',
    englishName: 'Mekong Renewable Energy Joint Stock Company',
    shortName: 'Mekong Energy',
    taxCode: '0312456789',
    enterpriseNumber: '0312456789',
    country: 'Việt Nam',
    legalRepresentative: 'Trần Đình Long',
    industry: 'Năng lượng & Điện mặt trời',
    email: 'contact@mekongenergy.vn',
    phone: '02838991234',
    address: 'Tòa nhà Mekong Tower, 120 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh',
    website: 'https://mekongenergy.vn',
    notes:
      'Khách hàng chiến lược mảng năng lượng tái tạo, tư vấn dự án điện mặt trời 50MW Bến Tre.',
    contactsCount: 2,
    mattersCount: 3,
    createdAt: '2026-01-10T08:30:00Z',
  },
  {
    id: 'cli-2',
    clientCode: 'CLI-2026-000002',
    type: 'ORGANIZATION',
    status: 'CONFLICT_CHECK',
    displayName: 'Tập đoàn Công nghệ Viễn thông Apex',
    vietnameseName: 'Công ty Cổ phần Công nghệ Viễn thông Apex',
    englishName: 'Apex Telecommunications Technology Corporation',
    shortName: 'Apex Telecom',
    taxCode: '0109876543',
    enterpriseNumber: '0109876543',
    country: 'Việt Nam',
    legalRepresentative: 'Vũ Hoàng Yến',
    industry: 'Viễn thông, Điện toán đám mây & Dữ liệu số',
    email: 'legal@apextelecom.vn',
    phone: '02437668899',
    address: 'Tầng 18, Apex Cyber Center, Đường Duy Tân, Quận Cầu Giấy, Hà Nội',
    website: 'https://apextelecom.vn',
    notes:
      'Đang thẩm định xung đột lợi ích đối với thương vụ phát hành cổ phần riêng lẻ cho đối tác Singapore.',
    contactsCount: 1,
    mattersCount: 0,
    createdAt: '2026-02-14T14:15:00Z',
  },
  {
    id: 'cli-3',
    clientCode: 'CLI-2026-000003',
    type: 'INDIVIDUAL',
    status: 'IN_REVIEW',
    displayName: 'Ông David Harrison',
    nationality: 'Hoa Kỳ (USA)',
    idNumber: 'P98765432 (Hộ chiếu Mỹ)',
    occupation: 'Nhà đầu tư thiên thần / Angel Investor',
    companyName: 'Harrison Capital Global LLC',
    email: 'david.harrison@harrisoncap.com',
    phone: '+1 415 890 1234',
    address: 'Villa 15, Khu đô thị An Phú, Thành phố Thủ Đức, TP. Hồ Chí Minh',
    notes:
      'Thẩm định tư cách pháp lý cho dự án góp vốn thành lập công ty phần mềm AI tại Việt Nam.',
    contactsCount: 1,
    mattersCount: 0,
    createdAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 'cli-4',
    clientCode: 'CLI-2026-000004',
    type: 'INDIVIDUAL',
    status: 'ACTIVE',
    displayName: 'Bà Nguyễn Thị Hương Lan',
    nationality: 'Việt Nam',
    idNumber: '001190012345 (CCCD)',
    occupation: 'Chủ tịch HĐQT / Cổ đông sáng lập',
    companyName: 'Lan Huong Food JSC',
    email: 'huonglan@lanhuongfood.vn',
    phone: '0908123999',
    address: '28 Biệt thự Thảo Điền, Quận 2, TP. Hồ Chí Minh',
    notes: 'Tư vấn thừa kế, quản trị tài sản gia đình và chuyển giao cổ phần thế hệ kế cận.',
    contactsCount: 1,
    mattersCount: 2,
    createdAt: '2026-01-25T11:20:00Z',
  },
  {
    id: 'cli-5',
    clientCode: 'CLI-2026-000005',
    type: 'ORGANIZATION',
    status: 'NEW',
    displayName: 'Công ty TNHH Đầu tư & Phát triển Đô thị Đại Nam',
    vietnameseName: 'Công ty TNHH Đầu tư & Phát triển Đô thị Đại Nam',
    englishName: 'Dai Nam Urban Investment & Development Co., Ltd',
    shortName: 'Đại Nam Urban',
    taxCode: '0309988776',
    enterpriseNumber: '0309988776',
    country: 'Việt Nam',
    legalRepresentative: 'Lê Thanh Hải',
    industry: 'Bất động sản & Xây dựng hạ tầng',
    email: 'contact@dainamurban.vn',
    phone: '02839112233',
    address: '45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    notes:
      'Hồ sơ tiếp nhận mới từ phòng Tranh tụng, cần kiểm tra conflict check trước khi nhận hồ sơ.',
    contactsCount: 1,
    mattersCount: 0,
    createdAt: '2026-03-01T16:45:00Z',
  },
];

let mockContacts: Contact[] = [
  {
    id: 'con-1',
    clientId: 'cli-1',
    fullName: 'Đặng Hoàng Giang',
    email: 'giang.dang@mekongenergy.vn',
    phone: '0913556677',
    position: 'Giám đốc Ban Pháp chế & Đối ngoại',
    idNumber: '079085001234',
    isPrimary: true,
    notes: 'Đầu mối trực tiếp nhận dự thảo hợp đồng EPC và phụ lục bảo lãnh.',
    createdAt: '2026-01-10T08:35:00Z',
  },
  {
    id: 'con-2',
    clientId: 'cli-1',
    fullName: 'Nguyễn Thị Mai',
    email: 'mai.nguyen@mekongenergy.vn',
    phone: '0988223344',
    position: 'Thư ký Hội đồng Quản trị',
    idNumber: '079192004567',
    isPrimary: false,
    notes: 'Hỗ trợ thu thập biên bản họp ĐHĐCĐ và nghị quyết HĐQT.',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'con-3',
    clientId: 'cli-2',
    fullName: 'Hoàng Quốc Việt',
    email: 'viet.hoang@apextelecom.vn',
    phone: '0977665544',
    position: 'Phó Tổng Giám đốc Kế hoạch & Đầu tư',
    isPrimary: true,
    createdAt: '2026-02-14T14:20:00Z',
  },
  {
    id: 'con-4',
    clientId: 'cli-3',
    fullName: 'David Harrison',
    email: 'david.harrison@harrisoncap.com',
    phone: '+1 415 890 1234',
    position: 'Nhà đầu tư cá nhân',
    isPrimary: true,
    createdAt: '2026-02-20T09:05:00Z',
  },
  {
    id: 'con-5',
    clientId: 'cli-4',
    fullName: 'Nguyễn Thị Hương Lan',
    email: 'huonglan@lanhuongfood.vn',
    phone: '0908123999',
    position: 'Chủ sở hữu / Thân chủ',
    isPrimary: true,
    createdAt: '2026-01-25T11:25:00Z',
  },
  {
    id: 'con-6',
    clientId: 'cli-5',
    fullName: 'Lê Thanh Hải',
    email: 'hai.le@dainamurban.vn',
    phone: '0909887766',
    position: 'Tổng Giám đốc / Đại diện pháp luật',
    isPrimary: true,
    createdAt: '2026-03-01T16:50:00Z',
  },
];

let mockRelations: ClientRelation[] = [
  {
    id: 'rel-1',
    sourceClientId: 'cli-1',
    targetName: 'Tập đoàn Mekong Holdings',
    relationType: 'PARENT_COMPANY',
    ownershipPercentage: 65,
    notes: 'Công ty mẹ nắm quyền chi phối chiến lược.',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'rel-2',
    sourceClientId: 'cli-1',
    targetName: 'Công ty TNHH Điện mặt trời Mekong Solar 1',
    relationType: 'SUBSIDIARY',
    ownershipPercentage: 100,
    notes: 'Doanh nghiệp dự án (SPV) thực hiện dự án điện mặt trời.',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'rel-3',
    sourceClientId: 'cli-1',
    targetName: 'Trần Đình Long',
    relationType: 'LEGAL_REPRESENTATIVE',
    notes: 'Người đại diện theo pháp luật kiêm Chủ tịch HĐQT.',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'rel-4',
    sourceClientId: 'cli-2',
    targetName: 'Quỹ Đầu tư Apex Singapore Pte Ltd',
    relationType: 'SHAREHOLDER',
    ownershipPercentage: 35,
    notes: 'Cổ đông ngoại lớn đang xem xét tăng vốn điều lệ.',
    createdAt: '2026-02-14T14:30:00Z',
  },
];

let mockConflictChecks: ConflictCheck[] = [
  {
    id: 'cc-1',
    code: 'CC-2026-000001',
    clientId: 'cli-2',
    clientName: 'Tập đoàn Công nghệ Viễn thông Apex',
    matterName: 'Tư vấn mua lại cổ phần công ty viễn thông đối thủ',
    searchTerms: ['Apex Telecom', 'Vũ Hoàng Yến', 'Phương Nam Telecom', 'Singapore Telecom'],
    status: 'POTENTIAL_CONFLICT',
    requestedById: 'emp-3',
    requestedByName: 'Lê Hoàng Nam (Senior Associate)',
    requestedAt: '2026-02-14T14:30:00Z',
    notes: 'Khách hàng có kế hoạch thâu tóm công ty đối thủ trong lĩnh vực trung tâm dữ liệu.',
    results: [
      {
        id: 'cr-1',
        matchedEntityType: 'DIRECTOR',
        matchedName: 'Vũ Hoàng Yến',
        matchedRole: 'Người đại diện theo pháp luật',
        similarityScore: 100,
        reason: 'Trùng khớp 100% với Người đại diện theo pháp luật của khách hàng Apex',
        notes: 'Đã được phân bổ trong hồ sơ khách hàng hiện hữu CLI-2026-000002',
      },
      {
        id: 'cr-2',
        matchedEntityType: 'PREVIOUS_CLIENT',
        matchedName: 'Công ty Cổ phần Viễn thông Phương Nam',
        matchedRole: 'Khách hàng cũ trong quá khứ',
        matterCode: 'MAT-2023-000012',
        matterName: 'Tư vấn thỏa ước lao động tập thể',
        similarityScore: 92,
        reason: 'Trùng khớp tên thương mại với đối tượng dự kiến bị thâu tóm',
        notes:
          'Công ty luật từng đại diện cho Phương Nam Telecom cách đây 3 năm. Cần lập Ethical Wall nếu nhận hồ sơ.',
      },
    ],
  },
  {
    id: 'cc-2',
    code: 'CC-2026-000002',
    clientId: 'cli-5',
    clientName: 'Công ty TNHH Đầu tư & Phát triển Đô thị Đại Nam',
    matterName: 'Tranh chấp quyền sử dụng đất khu phức hợp Quận 1',
    searchTerms: ['Đại Nam Urban', 'Lê Thanh Hải', 'Bất động sản Thịnh Vượng'],
    status: 'CONFIRMED_CONFLICT',
    requestedById: 'emp-5',
    requestedByName: 'Đỗ Minh Đức (Junior Associate)',
    requestedAt: '2026-03-01T17:00:00Z',
    reviewedById: 'emp-1',
    reviewedByName: 'Nguyễn Văn An (Managing Partner)',
    reviewedAt: '2026-03-02T09:15:00Z',
    decisionType: 'REJECTED_CONFIRMED',
    decisionNotes:
      'Xác nhận xung đột lợi ích trực tiếp không thể khắc phục. Công ty luật đang là đại diện tố tụng bảo vệ cho bên Bất động sản Thịnh Vượng trong vụ án liên quan tại Tòa án cấp cao. Từ chối nhận hồ sơ theo Quy tắc đạo đức nghề luật sư.',
    notes: 'Tranh chấp hợp đồng liên doanh xây dựng.',
    results: [
      {
        id: 'cr-3',
        matchedEntityType: 'OPPOSING_PARTY',
        matchedName: 'Công ty Cổ phần Bất động sản Thịnh Vượng',
        matchedRole: 'Đương sự đối kháng trong vụ án đang thụ lý',
        matterCode: 'MAT-2025-000045',
        matterName: 'Tranh chấp ranh giới đất & hợp đồng hợp tác',
        similarityScore: 98,
        reason:
          'Đối tác được đề cập trong vụ việc hiện đang là bên đối nghịch trực tiếp trong hồ sơ tố tụng do Partner Nguyễn Văn An phụ trách.',
      },
    ],
  },
  {
    id: 'cc-3',
    code: 'CC-2026-000003',
    clientId: 'cli-3',
    clientName: 'Ông David Harrison',
    matterName: 'Thành lập doanh nghiệp FDI công nghệ AI tại Việt Nam',
    searchTerms: ['David Harrison', 'Harrison Capital Global', 'AI Tech Vietnam'],
    status: 'NO_CONFLICT',
    requestedById: 'emp-2',
    requestedByName: 'Trần Thị Bích (Partner)',
    requestedAt: '2026-02-20T09:30:00Z',
    reviewedById: 'emp-2',
    reviewedByName: 'Trần Thị Bích (Partner)',
    reviewedAt: '2026-02-20T10:00:00Z',
    decisionType: 'APPROVED_NO_CONFLICT',
    decisionNotes:
      'Đã đối soát toàn bộ kho dữ liệu đương sự, khách hàng và cổ đông. Không phát hiện bất kỳ trùng lặp hoặc xung đột lợi ích nào. Cho phép phê duyệt tiếp nhận và mở Matter.',
    results: [],
  },
];

let mockMatters: Matter[] = [
  {
    id: 'mat-1',
    matterCode: 'MAT-2026-000001',
    name: 'Tư vấn Hợp đồng EPC & Tài trợ vốn Dự án Điện mặt trời Bến Tre 50MW',
    description:
      'Tư vấn pháp lý toàn diện cho chủ đầu tư Mekong Energy trong đàm phán hợp đồng tổng thầu EPC quốc tế, thẩm định quy hoạch lưới điện và thu xếp khoản vay hợp vốn 1.200 tỷ VND.',
    clientId: 'cli-1',
    clientName: 'Công ty Cổ phần Năng lượng Tái tạo Mekong',
    conflictCheckId: 'cc-3',
    practiceArea: 'Năng lượng & Cơ sở hạ tầng',
    matterType: 'TRANSACTION',
    responsiblePartnerId: 'emp-1',
    responsiblePartnerName: 'Nguyễn Văn An (Managing Partner)',
    responsibleLawyerId: 'emp-3',
    responsibleLawyerName: 'Lê Hoàng Nam (Senior Associate)',
    status: 'ACTIVE',
    priority: 'HIGH',
    confidentialityLevel: 'CONFIDENTIAL',
    openDate: '2026-01-15',
    expectedCloseDate: '2026-11-30',
    estimatedHours: 180,
    billingMethod: 'HOURLY',
    members: [
      {
        id: 'mm-1',
        matterId: 'mat-1',
        userId: 'emp-1',
        userName: 'Nguyễn Văn An',
        userEmail: 'an.nguyen@lpms-law.vn',
        role: 'RESPONSIBLE_PARTNER',
        canEdit: true,
        joinedAt: '2026-01-15T08:00:00Z',
      },
      {
        id: 'mm-2',
        matterId: 'mat-1',
        userId: 'emp-3',
        userName: 'Lê Hoàng Nam',
        userEmail: 'nam.le@lpms-law.vn',
        role: 'RESPONSIBLE_LAWYER',
        canEdit: true,
        joinedAt: '2026-01-15T08:30:00Z',
      },
      {
        id: 'mm-3',
        matterId: 'mat-1',
        userId: 'emp-5',
        userName: 'Đỗ Minh Đức',
        userEmail: 'duc.do@lpms-law.vn',
        role: 'MEMBER',
        canEdit: false,
        joinedAt: '2026-01-20T09:00:00Z',
      },
    ],
    parties: [
      {
        id: 'mp-1',
        matterId: 'mat-1',
        name: 'Công ty Cổ phần Năng lượng Tái tạo Mekong',
        role: 'CLIENT',
        representativeName: 'Trần Đình Long (Chủ tịch HĐQT)',
        contactInfo: 'contact@mekongenergy.vn - 02838991234',
        notes: 'Chủ đầu tư dự án (Thân chủ chính thức).',
      },
      {
        id: 'mp-2',
        matterId: 'mat-1',
        name: 'Hyundai E&C Consortium (Hàn Quốc)',
        role: 'RELATED_PARTY',
        representativeName: 'Kim Sung-hoon (Project Director)',
        contactInfo: 'sh.kim@hyundai-enc.com',
        notes: 'Đối tác Tổng thầu trúng thầu gói EPC.',
      },
      {
        id: 'mp-3',
        matterId: 'mat-1',
        name: 'Tập đoàn Điện lực Việt Nam (EVN)',
        role: 'AUTHORITY',
        representativeName: 'Ban Mua bán Điện (EPTC)',
        contactInfo: 'eptc@evn.com.vn',
        notes: 'Cơ quan ký thỏa thuận đấu nối lưới điện và hợp đồng mua bán điện PPA.',
      },
    ],
    tasks: [
      {
        id: 'tsk-1',
        title:
          'Rà soát và đưa ra ý kiến pháp lý về điều khoản phạt vi phạm chậm tiến độ hợp đồng EPC',
        assigneeName: 'Lê Hoàng Nam',
        dueDate: '2026-04-10',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      },
      {
        id: 'tsk-2',
        title: 'Hoàn thiện thư tư vấn về cấu trúc bảo lãnh thực hiện hợp đồng ngân hàng BIDV',
        assigneeName: 'Đỗ Minh Đức',
        dueDate: '2026-04-15',
        status: 'TODO',
        priority: 'MEDIUM',
      },
      {
        id: 'tsk-3',
        title: 'Soát xét tính hợp lệ của Quyết định chủ trương đầu tư tỉnh Bến Tre',
        assigneeName: 'Đỗ Minh Đức',
        dueDate: '2026-03-25',
        status: 'DONE',
        priority: 'HIGH',
      },
    ],
    deadlines: [
      {
        id: 'dl-1',
        title: 'Hạn chót gửi văn bản giải trình ý kiến thẩm định cho Bộ Công Thương',
        dueDate: '2026-04-20',
        reminderDays: 3,
        isOverdue: false,
        category: 'SUBMISSION',
      },
      {
        id: 'dl-2',
        title: 'Phiên họp đàm phán hợp đồng PPA sửa đổi với Ban Mua bán Điện EVN',
        dueDate: '2026-04-25',
        reminderDays: 5,
        isOverdue: false,
        category: 'CLIENT_FEEDBACK',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'Du_thao_Hop_dong_EPC_v3.2_final_clean.pdf',
        category: 'Hợp đồng EPC',
        size: '4.8 MB',
        version: 'v3.2',
        uploadedBy: 'Lê Hoàng Nam',
        uploadedAt: '2026-03-20T14:30:00Z',
      },
      {
        id: 'doc-2',
        name: 'Bao_cao_Tham_dinh_Phap_ly_Due_Diligence.pdf',
        category: 'Legal Due Diligence',
        size: '12.5 MB',
        version: 'v1.0',
        uploadedBy: 'Đỗ Minh Đức',
        uploadedAt: '2026-02-15T11:00:00Z',
      },
      {
        id: 'doc-3',
        name: 'Nghi_quyet_HDQT_Phe_duyet_Bao_lanh_Tin_dung.pdf',
        category: 'Nghị quyết HĐQT',
        size: '1.2 MB',
        version: 'v1.0',
        uploadedBy: 'Đỗ Minh Đức',
        uploadedAt: '2026-03-01T09:15:00Z',
      },
    ],
    notes: [
      {
        id: 'not-1',
        authorName: 'Lê Hoàng Nam (Senior Associate)',
        content:
          'Đã hoàn tất phiên đàm phán trực tuyến lần 2 với luật sư của Hyundai E&C. Phía nhà thầu đồng ý giới hạn trách nhiệm bồi thường ở mức 100% giá trị hợp đồng và nâng mức bảo lãnh tạm ứng lên 15%.',
        createdAt: '2026-03-22T16:45:00Z',
        isConfidential: false,
      },
      {
        id: 'not-2',
        authorName: 'Nguyễn Văn An (Managing Partner)',
        content:
          'Thân chủ yêu cầu chốt văn bản trước ngày 15/04 để kịp nộp hồ sơ xin giải ngân hạn mức tín dụng xanh từ ngân hàng tài trợ ADB.',
        createdAt: '2026-03-24T10:00:00Z',
        isConfidential: true,
      },
    ],
    timeline: [
      {
        id: 'tl-1',
        matterId: 'mat-1',
        type: 'STATUS_CHANGE',
        actorName: 'Nguyễn Văn An (Managing Partner)',
        actorRole: 'Partner phụ trách',
        timestamp: '2026-01-15T08:00:00Z',
        description:
          'Khởi tạo hồ sơ vụ việc mới sau khi hoàn thành Conflict Check an toàn (CC-2026-000003)',
      },
      {
        id: 'tl-2',
        matterId: 'mat-1',
        type: 'MEMBER_ADDED',
        actorName: 'Nguyễn Văn An (Managing Partner)',
        timestamp: '2026-01-15T08:30:00Z',
        description:
          'Chỉ định Luật sư Lê Hoàng Nam làm Luật sư chịu trách nhiệm chính (Responsible Lawyer)',
      },
      {
        id: 'tl-3',
        matterId: 'mat-1',
        type: 'STATUS_CHANGE',
        actorName: 'Lê Hoàng Nam (Senior Associate)',
        timestamp: '2026-01-20T10:00:00Z',
        description:
          'Chuyển trạng thái vụ việc sang ACTIVE sau khi ký Hợp đồng dịch vụ pháp lý số 01/2026/HĐDV-LPMS',
      },
    ],
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
  },
  {
    id: 'mat-2',
    matterCode: 'MAT-2026-000002',
    name: 'Tư vấn Tái cấu trúc Sở hữu Doanh nghiệp & Hoạch định Di sản Thừa kế',
    description:
      'Tư vấn chuyển nhượng cổ phần nội bộ, thiết lập quỹ tín thác gia đình và lập di chúc phân định tài sản cho người thừa kế thế hệ thứ hai.',
    clientId: 'cli-4',
    clientName: 'Bà Nguyễn Thị Hương Lan',
    practiceArea: 'Gia đình & Quản trị tài sản (Private Wealth)',
    matterType: 'ADVISORY',
    responsiblePartnerId: 'emp-2',
    responsiblePartnerName: 'Trần Thị Bích (Partner)',
    responsibleLawyerId: 'emp-4',
    responsibleLawyerName: 'Phạm Quốc Bảo (Associate)',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    confidentialityLevel: 'HIGHLY_CONFIDENTIAL',
    openDate: '2026-01-28',
    expectedCloseDate: '2026-06-30',
    estimatedHours: 80,
    billingMethod: 'FIXED_FEE',
    members: [
      {
        id: 'mm-4',
        matterId: 'mat-2',
        userId: 'emp-2',
        userName: 'Trần Thị Bích',
        userEmail: 'bich.tran@lpms-law.vn',
        role: 'RESPONSIBLE_PARTNER',
        canEdit: true,
        joinedAt: '2026-01-28T10:00:00Z',
      },
      {
        id: 'mm-5',
        matterId: 'mat-2',
        userId: 'emp-4',
        userName: 'Phạm Quốc Bảo',
        userEmail: 'bao.pham@lpms-law.vn',
        role: 'RESPONSIBLE_LAWYER',
        canEdit: true,
        joinedAt: '2026-01-28T10:30:00Z',
      },
    ],
    parties: [
      {
        id: 'mp-4',
        matterId: 'mat-2',
        name: 'Bà Nguyễn Thị Hương Lan',
        role: 'CLIENT',
        representativeName: 'Chủ sở hữu',
        contactInfo: 'huonglan@lanhuongfood.vn',
      },
    ],
    tasks: [
      {
        id: 'tsk-4',
        title: 'Soạn thảo dự thảo thỏa thuận phân chia tài sản thành viên gia đình',
        assigneeName: 'Phạm Quốc Bảo',
        dueDate: '2026-04-18',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      },
    ],
    deadlines: [
      {
        id: 'dl-3',
        title: 'Họp tham vấn trực tiếp với thân chủ tại văn phòng LPMS',
        dueDate: '2026-04-12',
        reminderDays: 2,
        isOverdue: false,
        category: 'CLIENT_FEEDBACK',
      },
    ],
    documents: [
      {
        id: 'doc-4',
        name: 'Ke_hoach_Phan_bo_Co_phan_Gia_dinh_Private.pdf',
        category: 'Kế hoạch Phân bổ',
        size: '2.1 MB',
        version: 'v2.0',
        uploadedBy: 'Phạm Quốc Bảo',
        uploadedAt: '2026-03-10T15:00:00Z',
      },
    ],
    notes: [
      {
        id: 'not-3',
        authorName: 'Trần Thị Bích (Partner)',
        content: 'Hồ sơ mang tính bảo mật cá nhân cao, tuân thủ cấp độ HIGHLY_CONFIDENTIAL.',
        createdAt: '2026-01-28T11:00:00Z',
        isConfidential: true,
      },
    ],
    timeline: [
      {
        id: 'tl-4',
        matterId: 'mat-2',
        type: 'STATUS_CHANGE',
        actorName: 'Trần Thị Bích (Partner)',
        timestamp: '2026-01-28T10:00:00Z',
        description: 'Tiếp nhận hồ sơ tư vấn quản trị tài sản gia đình',
      },
    ],
    createdAt: '2026-01-28T10:00:00Z',
    updatedAt: '2026-03-10T15:00:00Z',
  },
  {
    id: 'mat-3',
    matterCode: 'MAT-2026-000003',
    name: 'Tranh chấp Hợp đồng Liên doanh Phát triển Khu đô thị Trung tâm Quận 1',
    description:
      'Đại diện tố tụng tại Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) giải quyết tranh chấp vi phạm nghĩa vụ góp vốn và phân chia lợi nhuận dự án phức hợp thương mại dịch vụ.',
    clientId: 'cli-5',
    clientName: 'Công ty TNHH Đầu tư & Phát triển Đô thị Đại Nam',
    conflictCheckId: 'cc-2',
    practiceArea: 'Tranh tụng Trọng tài & Bất động sản',
    matterType: 'LITIGATION',
    responsiblePartnerId: 'emp-1',
    responsiblePartnerName: 'Nguyễn Văn An (Managing Partner)',
    responsibleLawyerId: 'emp-3',
    responsibleLawyerName: 'Lê Hoàng Nam (Senior Associate)',
    status: 'ON_HOLD',
    priority: 'URGENT',
    confidentialityLevel: 'RESTRICTED',
    openDate: '2026-03-02',
    expectedCloseDate: '2027-03-31',
    estimatedHours: 250,
    billingMethod: 'CONTINGENCY',
    members: [
      {
        id: 'mm-6',
        matterId: 'mat-3',
        userId: 'emp-1',
        userName: 'Nguyễn Văn An',
        userEmail: 'an.nguyen@lpms-law.vn',
        role: 'RESPONSIBLE_PARTNER',
        canEdit: true,
        joinedAt: '2026-03-02T08:00:00Z',
      },
      {
        id: 'mm-7',
        matterId: 'mat-3',
        userId: 'emp-3',
        userName: 'Lê Hoàng Nam',
        userEmail: 'nam.le@lpms-law.vn',
        role: 'RESPONSIBLE_LAWYER',
        canEdit: true,
        joinedAt: '2026-03-02T08:30:00Z',
      },
    ],
    parties: [
      {
        id: 'mp-5',
        matterId: 'mat-3',
        name: 'Công ty TNHH Đầu tư & Phát triển Đô thị Đại Nam',
        role: 'CLIENT',
        representativeName: 'Lê Thanh Hải (Tổng Giám đốc)',
        contactInfo: 'contact@dainamurban.vn',
      },
      {
        id: 'mp-6',
        matterId: 'mat-3',
        name: 'Công ty Cổ phần Bất động sản Thịnh Vượng',
        role: 'OPPOSING_PARTY',
        representativeName: 'Nguyễn Tiến Minh (Chủ tịch HĐQT)',
        contactInfo: 'Phía bị đơn đối kháng',
        notes: 'Bên tranh chấp trực tiếp.',
      },
      {
        id: 'mp-7',
        matterId: 'mat-3',
        name: 'Trung tâm Trọng tài Quốc tế Việt Nam (VIAC)',
        role: 'ARBITRATOR',
        contactInfo: 'Hội đồng Trọng tài vụ kiện số 45/2026/VIAC',
      },
    ],
    tasks: [
      {
        id: 'tsk-5',
        title: 'Nghiên cứu hồ sơ khởi kiện bổ sung và rà soát tài liệu chứng cứ tài chính',
        assigneeName: 'Lê Hoàng Nam',
        dueDate: '2026-04-05',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
      },
    ],
    deadlines: [
      {
        id: 'dl-4',
        title: 'Nộp bản tự khai và chứng cứ gốc tới Ban Thư ký VIAC',
        dueDate: '2026-04-15',
        reminderDays: 7,
        isOverdue: false,
        category: 'COURT_HEARING',
      },
    ],
    documents: [
      {
        id: 'doc-5',
        name: 'Don_khoi_kien_Tranh_chap_Hop_dong_Lien_doanh.pdf',
        category: 'Đơn khởi kiện VIAC',
        size: '6.4 MB',
        version: 'v1.0',
        uploadedBy: 'Lê Hoàng Nam',
        uploadedAt: '2026-03-05T09:00:00Z',
      },
    ],
    notes: [
      {
        id: 'not-4',
        authorName: 'Nguyễn Văn An (Managing Partner)',
        content:
          'Hồ sơ RESTRICTED: Yêu cầu áp dụng Whitelist nghiêm ngặt. Chỉ những nhân sự được nêu tên trong Matter Members mới có quyền xem nội dung tài liệu và nhật ký vụ việc.',
        createdAt: '2026-03-02T09:00:00Z',
        isConfidential: true,
      },
    ],
    timeline: [
      {
        id: 'tl-5',
        matterId: 'mat-3',
        type: 'STATUS_CHANGE',
        actorName: 'Nguyễn Văn An (Managing Partner)',
        timestamp: '2026-03-02T08:00:00Z',
        description:
          'Tạm dừng xử lý (ON_HOLD) để rà soát xung đột lợi ích phát sinh đối với bên Thịnh Vượng',
      },
    ],
    createdAt: '2026-03-02T08:00:00Z',
    updatedAt: '2026-03-05T09:00:00Z',
  },
  {
    id: 'mat-4',
    matterCode: 'MAT-2026-000004',
    name: 'Tư vấn Thành lập Doanh nghiệp FDI & Giấy phép Chuyển giao Công nghệ AI',
    description:
      'Thủ tục cấp Giấy chứng nhận đăng ký đầu tư (IRC) và Giấy chứng nhận đăng ký doanh nghiệp (ERC) cho quỹ đầu tư Hoa Kỳ thành lập công ty con tại Khu Công nghệ cao TP.HCM.',
    clientId: 'cli-3',
    clientName: 'Ông David Harrison',
    practiceArea: 'Đầu tư Nước ngoài (FDI)',
    matterType: 'COMPLIANCE',
    responsiblePartnerId: 'emp-2',
    responsiblePartnerName: 'Trần Thị Bích (Partner)',
    responsibleLawyerId: 'emp-4',
    responsibleLawyerName: 'Phạm Quốc Bảo (Associate)',
    status: 'INTAKE',
    priority: 'MEDIUM',
    confidentialityLevel: 'NORMAL',
    openDate: '2026-03-10',
    expectedCloseDate: '2026-05-30',
    estimatedHours: 60,
    billingMethod: 'FIXED_FEE',
    members: [
      {
        id: 'mm-8',
        matterId: 'mat-4',
        userId: 'emp-2',
        userName: 'Trần Thị Bích',
        userEmail: 'bich.tran@lpms-law.vn',
        role: 'RESPONSIBLE_PARTNER',
        canEdit: true,
        joinedAt: '2026-03-10T09:00:00Z',
      },
      {
        id: 'mm-9',
        matterId: 'mat-4',
        userId: 'emp-4',
        userName: 'Phạm Quốc Bảo',
        userEmail: 'bao.pham@lpms-law.vn',
        role: 'RESPONSIBLE_LAWYER',
        canEdit: true,
        joinedAt: '2026-03-10T09:30:00Z',
      },
    ],
    parties: [
      {
        id: 'mp-8',
        matterId: 'mat-4',
        name: 'Ông David Harrison',
        role: 'CLIENT',
        representativeName: 'Nhà đầu tư nước ngoài',
        contactInfo: 'david.harrison@harrisoncap.com',
      },
      {
        id: 'mp-9',
        matterId: 'mat-4',
        name: 'Ban Quản lý Khu Công nghệ cao TP.HCM (SHTP)',
        role: 'AUTHORITY',
        contactInfo: 'Cơ quan cấp phép đầu tư',
      },
    ],
    tasks: [
      {
        id: 'tsk-6',
        title: 'Hợp pháp hóa lãnh sự bản sao hộ chiếu và báo cáo tài chính nhà đầu tư',
        assigneeName: 'Phạm Quốc Bảo',
        dueDate: '2026-04-10',
        status: 'TODO',
        priority: 'MEDIUM',
      },
    ],
    deadlines: [
      {
        id: 'dl-5',
        title: 'Hạn chót tiếp nhận hồ sơ hợp lệ đợt 1 tại Ban Quản lý SHTP',
        dueDate: '2026-04-22',
        reminderDays: 5,
        isOverdue: false,
        category: 'SUBMISSION',
      },
    ],
    documents: [
      {
        id: 'doc-6',
        name: 'Bao_cao_Giai_trinh_Kinh_te_Ky_thuat_AI_Platform.pdf',
        category: 'Hồ sơ IRC',
        size: '5.2 MB',
        version: 'v1.0',
        uploadedBy: 'Phạm Quốc Bảo',
        uploadedAt: '2026-03-15T14:00:00Z',
      },
    ],
    notes: [
      {
        id: 'not-5',
        authorName: 'Phạm Quốc Bảo (Associate)',
        content: 'Nhà đầu tư đang hoàn thiện bản dịch công chứng hộ chiếu tại Đại sứ quán Hoa Kỳ.',
        createdAt: '2026-03-12T16:00:00Z',
      },
    ],
    timeline: [
      {
        id: 'tl-6',
        matterId: 'mat-4',
        type: 'STATUS_CHANGE',
        actorName: 'Trần Thị Bích (Partner)',
        timestamp: '2026-03-10T09:00:00Z',
        description: 'Tiếp nhận yêu cầu tư vấn thành lập doanh nghiệp FDI tại TP.HCM',
      },
    ],
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-03-15T14:00:00Z',
  },
];

let mockTasks: Task[] = [
  {
    id: 'tsk-1',
    code: 'TSK-2026-000001',
    title: 'Rà soát và dự thảo điều khoản phạt vi phạm chậm tiến độ hợp đồng EPC',
    description:
      'Phân tích rủi ro bồi thường thiệt hại và mức phạt tối đa 8% theo Luật Xây dựng Việt Nam so với tiêu chuẩn mẫu Silver Book FIDIC.',
    matterId: 'mat-1',
    matterCode: 'MAT-2026-000001',
    matterName: 'Tư vấn Hợp đồng EPC Nhà máy Điện mặt trời Bến Tre 50MW',
    assigneeId: 'emp-3',
    assigneeName: 'Lê Hoàng Nam (Senior Associate)',
    reviewerId: 'emp-1',
    reviewerName: 'Nguyễn Văn An (Managing Partner)',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    startDate: '2026-03-20',
    dueDate: '2026-04-10',
    estimatedMinutes: 240,
    actualMinutes: 120,
    isOverdue: false,
    checklists: [
      {
        id: 'chk-1',
        title: 'So sánh điều khoản với mẫu Silver Book FIDIC 2017',
        isCompleted: true,
        completedAt: '2026-03-22T10:00:00Z',
      },
      {
        id: 'chk-2',
        title: 'Dự thảo câu chữ bảo vệ quyền từ chối nghiệm thu khi công suất dưới 90%',
        isCompleted: true,
        completedAt: '2026-03-24T15:30:00Z',
      },
      {
        id: 'chk-3',
        title: 'Gửi bản so vết (Redline) kèm giải trình cho Partner phê duyệt',
        isCompleted: false,
      },
    ],
    comments: [
      {
        id: 'com-1',
        authorId: 'emp-3',
        authorName: 'Lê Hoàng Nam',
        content: 'Đã hoàn thành vòng đối soát 1 với phía luật sư Hyundai E&C.',
        createdAt: '2026-03-24T16:00:00Z',
      },
    ],
    createdAt: '2026-03-20T08:00:00Z',
    updatedAt: '2026-03-24T16:00:00Z',
  },
  {
    id: 'tsk-2',
    code: 'TSK-2026-000002',
    title: 'Nghiên cứu hồ sơ khởi kiện bổ sung và rà soát tài liệu chứng cứ tài chính',
    description:
      'Thẩm tra 14 chứng từ chuyển tiền phong tỏa và biên bản đối chiếu công nợ giữa Đại Nam và Thịnh Vượng.',
    matterId: 'mat-3',
    matterCode: 'MAT-2026-000003',
    matterName: 'Tranh chấp Hợp đồng Liên doanh Phát triển Khu đô thị Trung tâm Quận 1',
    assigneeId: 'emp-3',
    assigneeName: 'Lê Hoàng Nam (Senior Associate)',
    reviewerId: 'emp-1',
    reviewerName: 'Nguyễn Văn An (Managing Partner)',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    startDate: '2026-03-15',
    dueDate: '2026-04-05',
    estimatedMinutes: 360,
    actualMinutes: 180,
    isOverdue: false,
    checklists: [
      {
        id: 'chk-4',
        title: 'Kiểm tra tính pháp lý chữ ký trên 5 phụ lục thỏa thuận',
        isCompleted: true,
      },
      {
        id: 'chk-5',
        title: 'Đối chiếu sao kê tài khoản ngân hàng BIDV',
        isCompleted: true,
      },
      {
        id: 'chk-6',
        title: 'Lập Bảng kê chứng cứ đính kèm Bản tự khai số 2 nộp Ban Thư ký VIAC',
        isCompleted: false,
      },
    ],
    comments: [],
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-03-20T11:00:00Z',
  },
  {
    id: 'tsk-3',
    code: 'TSK-2026-000003',
    title: 'Soạn thảo thỏa thuận phân chia tài sản thành viên gia đình và di chúc mẫu',
    description:
      'Dự thảo văn bản pháp lý phân định quyền thừa kế đối với 65% cổ phần Lan Huong Food JSC.',
    matterId: 'mat-2',
    matterCode: 'MAT-2026-000002',
    matterName: 'Tư vấn Tái cấu trúc Sở hữu Doanh nghiệp & Hoạch định Di sản Thừa kế',
    assigneeId: 'emp-4',
    assigneeName: 'Phạm Quốc Bảo (Associate)',
    reviewerId: 'emp-2',
    reviewerName: 'Trần Thị Bích (Partner)',
    priority: 'NORMAL',
    status: 'REVIEW',
    startDate: '2026-03-10',
    dueDate: '2026-04-18',
    estimatedMinutes: 180,
    actualMinutes: 160,
    isOverdue: false,
    checklists: [
      {
        id: 'chk-7',
        title: 'Liệt kê danh mục cổ phần và bất động sản kèm giấy tờ chứng minh',
        isCompleted: true,
      },
      {
        id: 'chk-8',
        title: 'Tham vấn sơ bộ ý kiến thân chủ qua cuộc họp trực tiếp',
        isCompleted: true,
      },
      {
        id: 'chk-9',
        title: 'Chuyển Partner duyệt văn bản dự thảo',
        isCompleted: true,
      },
    ],
    comments: [],
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-25T14:00:00Z',
  },
  {
    id: 'tsk-4',
    code: 'TSK-2026-000004',
    title: 'Báo cáo thẩm định tính pháp lý của Quyết định chủ trương đầu tư Bến Tre',
    description:
      'Đánh giá sự phù hợp của dự án với Quy hoạch phát triển điện lực quốc gia (Quy hoạch Điện VIII).',
    matterId: 'mat-1',
    matterCode: 'MAT-2026-000001',
    matterName: 'Tư vấn Hợp đồng EPC Nhà máy Điện mặt trời Bến Tre 50MW',
    assigneeId: 'emp-5',
    assigneeName: 'Đỗ Minh Đức (Junior Associate)',
    reviewerId: 'emp-3',
    reviewerName: 'Lê Hoàng Nam (Senior Associate)',
    priority: 'HIGH',
    status: 'COMPLETED',
    startDate: '2026-03-15',
    dueDate: '2026-03-25',
    estimatedMinutes: 300,
    actualMinutes: 280,
    isOverdue: false,
    completedAt: '2026-03-24T17:00:00Z',
    completedBy: 'Đỗ Minh Đức',
    checklists: [
      {
        id: 'chk-10',
        title: 'Soát xét Quyết định phê duyệt chủ trương của UBND tỉnh Bến Tre',
        isCompleted: true,
      },
      {
        id: 'chk-11',
        title: 'Phát hành báo cáo pháp lý chính thức',
        isCompleted: true,
      },
    ],
    comments: [],
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-03-24T17:00:00Z',
  },
  {
    id: 'tsk-5',
    code: 'TSK-2026-000005',
    title: 'Hợp pháp hóa lãnh sự bản sao hộ chiếu và báo cáo tài chính nhà đầu tư FDI',
    description:
      'Hỗ trợ ông David Harrison hoàn tất thủ tục chứng thực tại Tổng Lãnh sự quán Hoa Kỳ tại TP.HCM.',
    matterId: 'mat-4',
    matterCode: 'MAT-2026-000004',
    matterName: 'Tư vấn Thành lập Doanh nghiệp FDI & Giấy phép Chuyển giao Công nghệ AI',
    assigneeId: 'emp-4',
    assigneeName: 'Phạm Quốc Bảo (Associate)',
    reviewerId: 'emp-2',
    reviewerName: 'Trần Thị Bích (Partner)',
    priority: 'NORMAL',
    status: 'TODO',
    startDate: '2026-03-12',
    dueDate: '2026-03-26', // Overdue
    estimatedMinutes: 120,
    isOverdue: true,
    checklists: [
      {
        id: 'chk-12',
        title: 'Nhận bản gốc hộ chiếu và giấy chứng nhận cổ phần Harrison Capital',
        isCompleted: false,
      },
      {
        id: 'chk-13',
        title: 'Đặt lịch hẹn công chứng tại Lãnh sự quán',
        isCompleted: false,
      },
    ],
    comments: [
      {
        id: 'com-2',
        authorId: 'emp-4',
        authorName: 'Phạm Quốc Bảo',
        content: 'Thân chủ bị trễ chuyến bay nên dời lịch sang đầu tuần tới.',
        createdAt: '2026-03-26T09:00:00Z',
      },
    ],
    createdAt: '2026-03-12T09:00:00Z',
    updatedAt: '2026-03-26T09:00:00Z',
  },
];

let mockDeadlines: Deadline[] = [
  {
    id: 'dl-1',
    code: 'DL-2026-000001',
    title: 'Nộp bản tự khai và toàn bộ chứng cứ gốc tới Ban Thư ký VIAC',
    description:
      'Hạn chót theo thông báo số 12/VIAC-TB của Hội đồng Trọng tài vụ kiện tranh chấp liên doanh Quận 1.',
    category: 'COURT',
    matterId: 'mat-3',
    matterCode: 'MAT-2026-000003',
    matterName: 'Tranh chấp Hợp đồng Liên doanh Phát triển Khu đô thị Trung tâm Quận 1',
    dueDate: '2026-04-15',
    dueTime: '16:30',
    reminderDays: [15, 7, 3, 1],
    isCompleted: false,
    isOverdue: false,
    responsiblePersonId: 'emp-3',
    responsiblePersonName: 'Lê Hoàng Nam (Senior Associate)',
    courtName: 'Trung tâm Trọng tài Quốc tế Việt Nam (VIAC)',
    caseNumber: 'Vụ kiện số 45/2026/VIAC',
    notes: 'Quy tắc trọng tài VIAC: quá hạn sẽ mất quyền cung cấp chứng cứ bổ sung.',
    createdAt: '2026-03-02T09:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'dl-2',
    code: 'DL-2026-000002',
    title: 'Hạn chót gửi văn bản giải trình ý kiến thẩm định cho Bộ Công Thương',
    description:
      'Giải trình về phương án đấu nối lưới điện 110kV và điều kiện bảo đảm môi trường của dự án năng lượng.',
    category: 'GOVERNMENT',
    matterId: 'mat-1',
    matterCode: 'MAT-2026-000001',
    matterName: 'Tư vấn Hợp đồng EPC Nhà máy Điện mặt trời Bến Tre 50MW',
    dueDate: '2026-04-20',
    dueTime: '17:00',
    reminderDays: [7, 3, 1],
    isCompleted: false,
    isOverdue: false,
    responsiblePersonId: 'emp-3',
    responsiblePersonName: 'Lê Hoàng Nam (Senior Associate)',
    authorityName: 'Bộ Công Thương - Cục Điện lực & Năng lượng Tái tạo',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: 'dl-3',
    code: 'DL-2026-000003',
    title: 'Hạn nộp hồ sơ xin cấp Giấy chứng nhận Đăng ký Đầu tư (IRC) tại SHTP',
    description:
      'Nộp hồ sơ trực tuyến qua Cổng thông tin quốc gia về đầu tư nước ngoài và nộp bản giấy tại SHTP.',
    category: 'FILING',
    matterId: 'mat-4',
    matterCode: 'MAT-2026-000004',
    matterName: 'Tư vấn Thành lập Doanh nghiệp FDI & Giấy phép Chuyển giao Công nghệ AI',
    dueDate: '2026-04-22',
    dueTime: '11:30',
    reminderDays: [7, 3],
    isCompleted: false,
    isOverdue: false,
    responsiblePersonId: 'emp-4',
    responsiblePersonName: 'Phạm Quốc Bảo (Associate)',
    authorityName: 'Ban Quản lý Khu Công nghệ cao TP.HCM (SHTP)',
    createdAt: '2026-03-12T11:00:00Z',
    updatedAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 'dl-4',
    code: 'DL-2026-000004',
    title: 'Hạn chót khiếu nại quyết định hành chính thuế đối với khoản phạt VAT vật tư nhập khẩu',
    description:
      'Thời hiệu khiếu nại lần đầu 90 ngày theo Luật Khiếu nại đối với Quyết định xử phạt vi phạm hành chính thuế.',
    category: 'GOVERNMENT',
    matterId: 'mat-1',
    matterCode: 'MAT-2026-000001',
    matterName: 'Tư vấn Hợp đồng EPC Nhà máy Điện mặt trời Bến Tre 50MW',
    dueDate: '2026-03-26', // Overdue
    dueTime: '17:00',
    reminderDays: [30, 15, 7, 3, 1],
    isCompleted: false,
    isOverdue: true,
    responsiblePersonId: 'emp-3',
    responsiblePersonName: 'Lê Hoàng Nam (Senior Associate)',
    authorityName: 'Cục Thuế tỉnh Bến Tre',
    notes: 'ĐÃ QUÁ HẠN: Cần hoàn thiện đơn xin gia hạn thời hiệu có lý do bất khả kháng!',
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-03-27T08:00:00Z',
  },
  {
    id: 'dl-5',
    code: 'DL-2026-000005',
    title: 'Hết hạn hiệu lực Thỏa thuận bảo mật thông tin (NDA) song phương với Quỹ đầu tư',
    description:
      'Cần rà soát gia hạn hoặc ký thỏa thuận nguyên tắc chuyển nhượng cổ phần trước ngày hết hạn bảo mật.',
    category: 'CONTRACT_EXPIRY',
    matterId: 'mat-2',
    matterCode: 'MAT-2026-000002',
    matterName: 'Tư vấn Tái cấu trúc Sở hữu Doanh nghiệp & Hoạch định Di sản Thừa kế',
    dueDate: '2026-05-15',
    reminderDays: [30, 7],
    isCompleted: false,
    isOverdue: false,
    responsiblePersonId: 'emp-2',
    responsiblePersonName: 'Trần Thị Bích (Partner)',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
];

export interface UploadDocumentPayload {
  matterId: string;
  folderId: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  comment?: string;
  isSensitive?: boolean;
  watermarkEnabled?: boolean;
  downloadRestricted?: boolean;
  partnerOnly?: boolean;
  status?: DocumentStatus;
}

export interface UploadNewVersionPayload {
  fileName: string;
  fileSize: number;
  mimeType: string;
  comment: string;
}

export interface UpdateDocumentPermissionsPayload {
  isSensitive?: boolean;
  watermarkEnabled?: boolean;
  downloadRestricted?: boolean;
  partnerOnly?: boolean;
}

const defaultMatterFoldersList = [
  '01 Client Documents',
  '02 Legal Research',
  '03 Drafts',
  '04 Internal Review',
  '05 Client Review',
  '06 Signed Documents',
  '07 Submission',
  '08 Authority Response',
  '09 Final',
];

const mockMattersForFolders = [
  {
    id: 'mat-1',
    code: 'MAT-2026-000001',
    title: 'Tư vấn M&A Thâu tóm Chuỗi Bán lẻ Dược phẩm An Tâm',
  },
  {
    id: 'mat-2',
    code: 'MAT-2026-000002',
    title: 'Tư vấn Tái cấu trúc Sở hữu Doanh nghiệp & Hoạch định Di sản Thừa kế',
  },
  {
    id: 'mat-3',
    code: 'MAT-2026-000003',
    title: 'Tranh tụng Hợp đồng Tổng thầu EPC Dự án Điện gió Biển Bạc Liêu',
  },
  {
    id: 'mat-4',
    code: 'MAT-2026-000004',
    title: 'Cấp phép Dự án Nhà máy Sản xuất Chip Bán dẫn Cao cấp',
  },
];

let mockFolders: DocumentFolder[] = mockMattersForFolders.flatMap((m) =>
  defaultMatterFoldersList.map((name, index) => ({
    id: `fld-${m.id}-${index + 1}`,
    matterId: m.id,
    matterCode: m.code,
    matterTitle: m.title,
    name,
    code: `FLD-${m.code.split('-')[2]}-${String(index + 1).padStart(2, '0')}`,
    order: index + 1,
    documentCount:
      m.id === 'mat-1' && (index === 2 || index === 4)
        ? 1
        : m.id === 'mat-3' && index === 6
          ? 1
          : m.id === 'mat-4' && (index === 0 || index === 7)
            ? 1
            : m.id === 'mat-2' && index === 2
              ? 1
              : 0,
    createdAt: '2026-01-15T08:00:00Z',
  })),
);

let mockDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    matterId: 'mat-1',
    matterCode: 'MAT-2026-000001',
    matterTitle: 'Tư vấn M&A Thâu tóm Chuỗi Bán lẻ Dược phẩm An Tâm',
    folderId: 'fld-mat-1-3',
    folderName: '03 Drafts',
    title: 'Thỏa thuận sáp nhập và mua lại cổ phần (Share Purchase Agreement - Draft v3)',
    description:
      'Bản dự thảo cập nhật các cam kết bảo đảm thuế và giới hạn trách nhiệm bồi thường 15% giá trị giao dịch.',
    currentVersion: 3,
    status: 'INTERNAL_REVIEW',
    fileName: 'SPA_AnTam_Pharma_v3_clean.docx',
    fileType: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1488976,
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    storageKey: 's3://lpms-vault-prod/mat-1/spa_antam_v3_9f86d08.docx',
    isSensitive: true,
    watermarkEnabled: true,
    downloadRestricted: false,
    partnerOnly: false,
    isDeleted: false,
    versions: [
      {
        id: 'ver-1-1',
        documentId: 'doc-1',
        versionNumber: 1,
        fileKey: 's3://lpms-vault-prod/mat-1/spa_antam_v1_1a2b3c4.docx',
        fileName: 'SPA_AnTam_Pharma_v1_draft.docx',
        fileSize: 1250400,
        fileType: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sha256: '1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809',
        uploadedBy: 'emp-4',
        uploadedByName: 'Phạm Hải Đăng (Associate)',
        uploadedAt: '2026-01-20T10:00:00Z',
        comment: 'Khởi tạo bản nháp ban đầu từ mẫu tiêu chuẩn M&A của công ty',
        isCurrent: false,
      },
      {
        id: 'ver-1-2',
        documentId: 'doc-1',
        versionNumber: 2,
        fileKey: 's3://lpms-vault-prod/mat-1/spa_antam_v2_2b3c4d5.docx',
        fileName: 'SPA_AnTam_Pharma_v2_tax_warranty.docx',
        fileSize: 1390120,
        fileType: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sha256: '2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a',
        uploadedBy: 'emp-2',
        uploadedByName: 'Trần Thị Bích (Partner)',
        uploadedAt: '2026-02-02T14:30:00Z',
        comment:
          'Cập nhật điều khoản cam kết nghĩa vụ thuế truy thu và xử lý vi phạm tồn kho thuốc',
        isCurrent: false,
      },
      {
        id: 'ver-1-3',
        documentId: 'doc-1',
        versionNumber: 3,
        fileKey: 's3://lpms-vault-prod/mat-1/spa_antam_v3_9f86d08.docx',
        fileName: 'SPA_AnTam_Pharma_v3_clean.docx',
        fileSize: 1488976,
        fileType: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        uploadedBy: 'emp-1',
        uploadedByName: 'Luật sư Trần Tuấn Vũ (Managing Partner)',
        uploadedAt: '2026-02-15T16:30:00Z',
        comment: 'Chốt trần bồi thường tối đa 15% theo yêu cầu bên Mua và chuẩn bị gửi khách hàng',
        isCurrent: true,
      },
    ],
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-15T16:30:00Z',
    createdBy: 'emp-4',
    createdByName: 'Phạm Hải Đăng (Associate)',
  },
  {
    id: 'doc-2',
    matterId: 'mat-3',
    matterCode: 'MAT-2026-000003',
    matterTitle: 'Tranh tụng Hợp đồng Tổng thầu EPC Dự án Điện gió Biển Bạc Liêu',
    folderId: 'fld-mat-3-7',
    folderName: '07 Submission',
    title: 'Đơn khởi kiện trọng tài và Bản giải trình chứng cứ gửi Hội đồng Trọng tài VIAC',
    description:
      'Bản nộp chính thức có chữ ký số đại diện nguyên đơn kèm phụ lục đối chiếu 38 ngày chậm tiến độ bàn giao turbine.',
    currentVersion: 2,
    status: 'FINAL',
    fileName: 'VIAC_Arbitration_Claim_Signed_Final.pdf',
    fileType: '.pdf',
    mimeType: 'application/pdf',
    fileSize: 5085560,
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    storageKey: 's3://lpms-vault-prod/mat-3/viac_claim_final_5e88489.pdf',
    isSensitive: false,
    watermarkEnabled: true,
    downloadRestricted: false,
    partnerOnly: false,
    isDeleted: false,
    versions: [
      {
        id: 'ver-2-1',
        documentId: 'doc-2',
        versionNumber: 1,
        fileKey: 's3://lpms-vault-prod/mat-3/viac_claim_draft_v1.pdf',
        fileName: 'VIAC_Arbitration_Claim_v1_Draft.pdf',
        fileSize: 4210000,
        fileType: '.pdf',
        mimeType: 'application/pdf',
        sha256: '4210000da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        uploadedBy: 'emp-3',
        uploadedByName: 'Luật sư Lê Hoàng Nam (Senior Associate)',
        uploadedAt: '2026-02-10T09:00:00Z',
        comment: 'Dự thảo đơn kiện lần 1 gửi Trưởng phòng Tranh tụng thẩm duyệt',
        isCurrent: false,
      },
      {
        id: 'ver-2-2',
        documentId: 'doc-2',
        versionNumber: 2,
        fileKey: 's3://lpms-vault-prod/mat-3/viac_claim_final_5e88489.pdf',
        fileName: 'VIAC_Arbitration_Claim_Signed_Final.pdf',
        fileSize: 5085560,
        fileType: '.pdf',
        mimeType: 'application/pdf',
        sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        uploadedBy: 'emp-1',
        uploadedByName: 'Luật sư Trần Tuấn Vũ (Managing Partner)',
        uploadedAt: '2026-03-01T14:15:00Z',
        comment: 'Bản ký số chính thức đã hoàn tất nộp VIAC Trung tâm Trọng tài Quốc tế Việt Nam',
        isCurrent: true,
      },
    ],
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-03-01T14:15:00Z',
    createdBy: 'emp-3',
    createdByName: 'Luật sư Lê Hoàng Nam (Senior Associate)',
  },
  {
    id: 'doc-3',
    matterId: 'mat-1',
    matterCode: 'MAT-2026-000001',
    matterTitle: 'Tư vấn M&A Thâu tóm Chuỗi Bán lẻ Dược phẩm An Tâm',
    folderId: 'fld-mat-1-5',
    folderName: '05 Client Review',
    title: 'Báo cáo Thẩm định Pháp lý Toàn diện Doanh nghiệp (Legal Due Diligence - Final)',
    description:
      'Báo cáo LDD chi tiết rà soát 45 điểm bán lẻ GPP, giấy phép con và tranh chấp lao động tiềm ẩn.',
    currentVersion: 4,
    status: 'CLIENT_REVIEW',
    fileName: 'LDD_Report_AnTam_Pharma_v4_ExecutiveSummary.pdf',
    fileType: '.pdf',
    mimeType: 'application/pdf',
    fileSize: 13212057,
    sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    storageKey: 's3://lpms-vault-prod/mat-1/ldd_report_v4_4b22777.pdf',
    isSensitive: false,
    watermarkEnabled: true,
    downloadRestricted: false,
    partnerOnly: false,
    isDeleted: false,
    versions: [
      {
        id: 'ver-3-1',
        documentId: 'doc-3',
        versionNumber: 1,
        fileKey: 's3://lpms-vault-prod/mat-1/ldd_v1.pdf',
        fileName: 'LDD_Report_AnTam_v1.pdf',
        fileSize: 8400000,
        fileType: '.pdf',
        mimeType: 'application/pdf',
        sha256: '11111111d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        uploadedBy: 'emp-4',
        uploadedByName: 'Phạm Hải Đăng',
        uploadedAt: '2026-01-25T11:00:00Z',
        comment: 'Dự thảo báo cáo LDD phần doanh nghiệp và giấy phép',
        isCurrent: false,
      },
      {
        id: 'ver-3-2',
        documentId: 'doc-3',
        versionNumber: 2,
        fileKey: 's3://lpms-vault-prod/mat-1/ldd_v2.pdf',
        fileName: 'LDD_Report_AnTam_v2_land.pdf',
        fileSize: 10200000,
        fileType: '.pdf',
        mimeType: 'application/pdf',
        sha256: '22222222d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        uploadedBy: 'emp-4',
        uploadedByName: 'Phạm Hải Đăng',
        uploadedAt: '2026-02-05T09:30:00Z',
        comment: 'Bổ sung kết quả thẩm định 45 hợp đồng thuê mặt bằng nhà thuốc',
        isCurrent: false,
      },
      {
        id: 'ver-3-3',
        documentId: 'doc-3',
        versionNumber: 3,
        fileKey: 's3://lpms-vault-prod/mat-1/ldd_v3.pdf',
        fileName: 'LDD_Report_AnTam_v3_internal.pdf',
        fileSize: 12500000,
        fileType: '.pdf',
        mimeType: 'application/pdf',
        sha256: '33333333d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        uploadedBy: 'emp-2',
        uploadedByName: 'Trần Thị Bích',
        uploadedAt: '2026-02-20T15:00:00Z',
        comment: 'Hiệu chỉnh phần khuyến nghị giải pháp khắc phục rủi ro PCCC',
        isCurrent: false,
      },
      {
        id: 'ver-3-4',
        documentId: 'doc-3',
        versionNumber: 4,
        fileKey: 's3://lpms-vault-prod/mat-1/ldd_report_v4_4b22777.pdf',
        fileName: 'LDD_Report_AnTam_Pharma_v4_ExecutiveSummary.pdf',
        fileSize: 13212057,
        fileType: '.pdf',
        mimeType: 'application/pdf',
        sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        uploadedBy: 'emp-1',
        uploadedByName: 'Luật sư Trần Tuấn Vũ',
        uploadedAt: '2026-02-28T17:00:00Z',
        comment: 'Bản hoàn thiện tóm tắt điều hành gửi Hội đồng Quản trị Khách hàng',
        isCurrent: true,
      },
    ],
    createdAt: '2026-01-25T11:00:00Z',
    updatedAt: '2026-02-28T17:00:00Z',
    createdBy: 'emp-4',
    createdByName: 'Phạm Hải Đăng',
  },
  {
    id: 'doc-4',
    matterId: 'mat-4',
    matterCode: 'MAT-2026-000004',
    matterTitle: 'Cấp phép Dự án Nhà máy Sản xuất Chip Bán dẫn Cao cấp',
    folderId: 'fld-mat-4-1',
    folderName: '01 Client Documents',
    title: 'Hồ sơ Pháp lý Quyền sử dụng đất & Giấy phép xây dựng Khu công nghệ cao (Tối mật)',
    description:
      'Hồ sơ bản quyền thiết kế công nghệ và thỏa thuận đất đai đối tác độc quyền, áp dụng cơ chế Whitelist Partners.',
    currentVersion: 1,
    status: 'APPROVED',
    fileName: 'HiTech_Semiconductor_Land_Use_Dossier_Classified.pdf',
    fileType: '.pdf',
    mimeType: 'application/pdf',
    fileSize: 33658912,
    sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    storageKey: 's3://lpms-vault-prod/mat-4/classified_land_dossier_ef2d127.pdf',
    isSensitive: true,
    watermarkEnabled: true,
    downloadRestricted: true,
    partnerOnly: true,
    isDeleted: false,
    versions: [
      {
        id: 'ver-4-1',
        documentId: 'doc-4',
        versionNumber: 1,
        fileKey: 's3://lpms-vault-prod/mat-4/classified_land_dossier_ef2d127.pdf',
        fileName: 'HiTech_Semiconductor_Land_Use_Dossier_Classified.pdf',
        fileSize: 33658912,
        fileType: '.pdf',
        mimeType: 'application/pdf',
        sha256: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        uploadedBy: 'emp-1',
        uploadedByName: 'Luật sư Trần Tuấn Vũ',
        uploadedAt: '2026-02-15T08:30:00Z',
        comment: 'Tải lên bộ hồ sơ tối mật theo thỏa thuận bảo hộ độc quyền công nghệ',
        isCurrent: true,
      },
    ],
    createdAt: '2026-02-15T08:30:00Z',
    updatedAt: '2026-02-15T08:30:00Z',
    createdBy: 'emp-1',
    createdByName: 'Luật sư Trần Tuấn Vũ',
  },
  {
    id: 'doc-5',
    matterId: 'mat-2',
    matterCode: 'MAT-2026-000002',
    matterTitle: 'Tư vấn Tái cấu trúc Sở hữu Doanh nghiệp & Hoạch định Di sản Thừa kế',
    folderId: 'fld-mat-2-3',
    folderName: '03 Drafts',
    title: 'Dự thảo Phụ lục Biên bản Ghi nhớ Liên doanh (MOU Draft - Đã hủy bỏ)',
    description:
      'Bản thảo cũ đã bị hủy do các bên thống nhất phương án ký hợp đồng chuyển nhượng vốn góp mới.',
    currentVersion: 1,
    status: 'DRAFT',
    fileName: 'MOU_Addendum_Superseded_Draft.docx',
    fileType: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 852000,
    sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    storageKey: 's3://lpms-vault-prod/mat-2/mou_addendum_old_a1b2c3d.docx',
    isSensitive: false,
    watermarkEnabled: false,
    downloadRestricted: false,
    partnerOnly: false,
    isDeleted: true,
    deletedAt: '2026-03-22T09:15:00Z',
    deletedBy: 'emp-2',
    deletedByName: 'Trần Thị Bích (Partner)',
    deleteReason: 'Bản thảo hủy do các bên thống nhất phương án góp vốn bằng tài sản mới',
    versions: [
      {
        id: 'ver-5-1',
        documentId: 'doc-5',
        versionNumber: 1,
        fileKey: 's3://lpms-vault-prod/mat-2/mou_addendum_old_a1b2c3d.docx',
        fileName: 'MOU_Addendum_Superseded_Draft.docx',
        fileSize: 852000,
        fileType: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        uploadedBy: 'emp-2',
        uploadedByName: 'Trần Thị Bích',
        uploadedAt: '2026-02-18T10:00:00Z',
        comment: 'Bản thảo ghi nhớ liên doanh sơ bộ',
        isCurrent: true,
      },
    ],
    createdAt: '2026-02-18T10:00:00Z',
    updatedAt: '2026-03-22T09:15:00Z',
    createdBy: 'emp-2',
    createdByName: 'Trần Thị Bích',
  },
  {
    id: 'doc-6',
    matterId: 'mat-4',
    matterCode: 'MAT-2026-000004',
    matterTitle: 'Cấp phép Dự án Nhà máy Sản xuất Chip Bán dẫn Cao cấp',
    folderId: 'fld-mat-4-8',
    folderName: '08 Authority Response',
    title: 'Công văn phản hồi số 482/BQL-ĐT về ưu đãi thuế thu nhập doanh nghiệp 10% trong 15 năm',
    description:
      'Văn bản chấp thuận nguyên tắc áp dụng gói ưu đãi đầu tư đặc biệt của Ban Quản lý Khu Công nghệ cao TP.HCM.',
    currentVersion: 1,
    status: 'FINAL',
    fileName: 'SHTP_Tax_Incentive_Approval_482.pdf',
    fileType: '.pdf',
    mimeType: 'application/pdf',
    fileSize: 2150000,
    sha256: 'b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2',
    storageKey: 's3://lpms-vault-prod/mat-4/shtp_tax_482_b3c4d5e.pdf',
    isSensitive: false,
    watermarkEnabled: true,
    downloadRestricted: false,
    partnerOnly: false,
    isDeleted: false,
    versions: [
      {
        id: 'ver-6-1',
        documentId: 'doc-6',
        versionNumber: 1,
        fileKey: 's3://lpms-vault-prod/mat-4/shtp_tax_482_b3c4d5e.pdf',
        fileName: 'SHTP_Tax_Incentive_Approval_482.pdf',
        fileSize: 2150000,
        fileType: '.pdf',
        mimeType: 'application/pdf',
        sha256: 'b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2',
        uploadedBy: 'emp-1',
        uploadedByName: 'Luật sư Trần Tuấn Vũ',
        uploadedAt: '2026-03-05T14:30:00Z',
        comment: 'Lưu công văn phê duyệt chính thức từ BQL SHTP',
        isCurrent: true,
      },
    ],
    createdAt: '2026-03-05T14:30:00Z',
    updatedAt: '2026-03-05T14:30:00Z',
    createdBy: 'emp-1',
    createdByName: 'Luật sư Trần Tuấn Vũ',
  },
];

let mockDocumentActivities: DocumentActivity[] = [
  {
    id: 'act-1',
    documentId: 'doc-1',
    action: 'VERSION_CREATED',
    performedBy: 'emp-1',
    performedByName: 'Luật sư Trần Tuấn Vũ',
    performedAt: '2026-02-15T16:30:00Z',
    details: 'Tải lên phiên bản mới v3: Chốt trần bồi thường tối đa 15%',
    ipAddress: '14.241.120.45',
  },
  {
    id: 'act-2',
    documentId: 'doc-1',
    action: 'DOWNLOADED',
    performedBy: 'emp-2',
    performedByName: 'Trần Thị Bích',
    performedAt: '2026-02-16T09:12:00Z',
    details: 'Tạo liên kết tải có chữ ký điện tử (Signed URL 15 phút) cho phiên bản v3',
    ipAddress: '113.161.78.22',
  },
  {
    id: 'act-3',
    documentId: 'doc-2',
    action: 'STATUS_CHANGED',
    performedBy: 'emp-1',
    performedByName: 'Luật sư Trần Tuấn Vũ',
    performedAt: '2026-03-01T14:15:00Z',
    details: 'Chuyển trạng thái tài liệu sang FINAL sau khi nộp VIAC',
    ipAddress: '14.241.120.45',
  },
  {
    id: 'act-4',
    documentId: 'doc-4',
    action: 'PERMISSIONS_UPDATED',
    performedBy: 'emp-1',
    performedByName: 'Luật sư Trần Tuấn Vũ',
    performedAt: '2026-02-15T08:35:00Z',
    details:
      'Kích hoạt chính sách Tối mật: Giới hạn Partner-Only, Bật Watermark bảo mật, Khóa quyền tải xuống trực tiếp',
    ipAddress: '14.241.120.45',
  },
  {
    id: 'act-5',
    documentId: 'doc-5',
    action: 'SOFT_DELETED',
    performedBy: 'emp-2',
    performedByName: 'Trần Thị Bích',
    performedAt: '2026-03-22T09:15:00Z',
    details: 'Chuyển tài liệu vào Thùng rác: Thay thế bằng Hợp đồng góp vốn sửa đổi ký ngày 22/03',
    ipAddress: '113.161.78.22',
  },
];

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (DATA_MODE === 'mock') {
    return handleMockRequest<T>(endpoint, options);
  }

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      const err = data.error || {};
      throw new ApiError(
        err.message || 'Yêu cầu không thành công',
        err.code || 'HTTP_ERROR',
        res.status,
        err.details,
      );
    }

    return (data as ApiResponse<T>).data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (DATA_MODE === 'api') {
      throw new ApiError(
        'Không thể kết nối tới máy chủ. Vui lòng thử lại sau.',
        'API_UNAVAILABLE',
        503,
      );
    }
    // Nếu kết nối backend bị lỗi hoặc backend chưa bật, fallback sang local mock an toàn
    console.warn(
      `[LPMS API] Kết nối tới backend thất bại (${url}), chuyển sang chế độ mô phỏng local.`,
    );
    return handleMockRequest<T>(endpoint, options);
  }
}

// Fallback mô phỏng cho UI độc lập
async function handleMockRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
  if (MOCK_API_DELAY_MS) await new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY_MS));

  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth Mocks
  if (endpoint === '/auth/login') {
    const { email, password } = body as LoginPayload;
    const candidate = getMockUser(email);
    if (password === 'wrong') {
      mockAuthenticated = false;
      mockCurrentUser = null;
      persistMockUser(null);
      throw new ApiError('Email hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS', 401);
    }
    if (email.includes('mfa') || candidate.mfaEnabled) {
      mockAuthenticated = false;
      mockCurrentUser = null;
      mockPendingUser = candidate;
      return {
        requiresMfa: true,
        mfaSessionToken: 'mock-mfa-session-token-xyz123',
        message: 'Tài khoản đã kích hoạt bảo vệ 2 lớp (MFA). Vui lòng nhập mã TOTP.',
      } as T;
    }
    mockCurrentUser = getMockUser(email);
    mockAuthenticated = true;
    persistMockUser(mockCurrentUser);
    return {
      requiresMfa: false,
      user: mockCurrentUser,
      message: 'Đăng nhập thành công',
    } as T;
  }

  if (endpoint === '/auth/mfa/verify') {
    mockCurrentUser = mockPendingUser || getMockUser('mfa.partner@lpms.vn');
    mockPendingUser = null;
    mockAuthenticated = true;
    persistMockUser(mockCurrentUser);
    return { user: mockCurrentUser, message: 'Xác thực 2 lớp thành công' } as T;
  }

  if (endpoint === '/auth/forgot-password') {
    return {
      message: 'Nếu địa chỉ email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi đến bạn.',
    } as T;
  }

  if (endpoint === '/auth/reset-password') {
    return { message: 'Mật khẩu đã được cập nhật thành công.' } as T;
  }

  if (endpoint === '/auth/sessions') {
    return mockSessions as T;
  }

  if (endpoint.startsWith('/auth/sessions/revoke/')) {
    const id = endpoint.replace('/auth/sessions/revoke/', '');
    mockSessions = mockSessions.filter((s) => s.id !== id);
    return { message: 'Đã thu hồi phiên thành công' } as T;
  }

  if (endpoint === '/auth/sessions/revoke-all') {
    mockSessions = mockSessions.filter((s) => s.isCurrent);
    return { message: 'Đã đăng xuất khỏi tất cả các thiết bị khác' } as T;
  }

  if (endpoint === '/auth/me') {
    const currentUser = restoreMockUser();
    if (!mockAuthenticated || !currentUser) {
      throw new ApiError('Phiên đăng nhập đã hết hạn.', 'UNAUTHORIZED', 401);
    }
    return currentUser as T;
  }

  if (endpoint === '/auth/logout') {
    mockAuthenticated = false;
    mockCurrentUser = null;
    mockPendingUser = null;
    persistMockUser(null);
    return { message: 'Đăng xuất thành công' } as T;
  }

  // Organization Mocks
  if (endpoint === '/organization/overview') {
    const activeEmployees = mockEmployees.filter((employee) => employee.status === 'ACTIVE').length;
    const branches = [
      {
        id: 'branch-hcm',
        code: 'HCM',
        name: 'Chi nhánh Sài Gòn',
        city: 'TP. Hồ Chí Minh',
        address: 'Quận 1, TP. Hồ Chí Minh',
        managerName: 'Nguyễn Văn An',
        employeeCount: 18,
        status: 'ACTIVE' as const,
        createdAt: '2024-01-15T00:00:00Z',
      },
      {
        id: 'branch-dna',
        code: 'DNI',
        name: 'Chi nhánh Đồng Nai',
        city: 'Đồng Nai',
        address: 'Biên Hòa, Đồng Nai',
        managerName: 'Trần Thị Bích',
        employeeCount: 7,
        status: 'ACTIVE' as const,
        createdAt: '2025-04-10T00:00:00Z',
      },
      {
        id: 'branch-cto',
        code: 'CTO',
        name: 'Chi nhánh Cần Thơ',
        city: 'Cần Thơ',
        address: 'Ninh Kiều, Cần Thơ',
        managerName: 'Lê Hoàng Nam',
        employeeCount: 4,
        status: 'PLANNED' as const,
        createdAt: '2026-02-01T00:00:00Z',
      },
    ];
    return {
      director: { id: 'emp-1', name: 'Nguyễn Văn An', title: 'Giám đốc điều hành', initials: 'NA' },
      deputyDirector: { id: 'emp-2', name: 'Trần Thị Bích', title: 'Phó giám đốc', initials: 'TB' },
      departments: mockDepartments,
      branches,
      totalEmployees: mockEmployees.length,
      activeEmployees,
    } as T;
  }

  if (endpoint.startsWith('/users')) {
    if (options.method === 'POST') {
      const payload = body as CreateEmployeePayload;
      const dept = mockDepartments.find((d) => d.id === payload.departmentId);
      const pos = mockPositions.find((p) => p.id === payload.positionId);
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        employeeCode: payload.employeeCode,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        departmentId: payload.departmentId,
        departmentName: dept?.name || 'Chưa phân bổ',
        positionId: payload.positionId,
        positionTitle: pos?.title || 'Nhân viên',
        roles: payload.roles,
        status: 'ACTIVE',
        startDate: payload.startDate,
        activeSessionsCount: 0,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
      };
      mockEmployees = [newEmp, ...mockEmployees];
      return newEmp as T;
    }

    if (endpoint.includes('/suspend')) {
      const id = endpoint.split('/')[2];
      mockEmployees = mockEmployees.map((e) =>
        e.id === id ? { ...e, status: 'SUSPENDED', activeSessionsCount: 0 } : e,
      );
      return { message: 'Đã đình chỉ tài khoản nhân sự và thu hồi mọi phiên làm việc' } as T;
    }

    if (endpoint.includes('/reactivate')) {
      const id = endpoint.split('/')[2];
      mockEmployees = mockEmployees.map((e) => (e.id === id ? { ...e, status: 'ACTIVE' } : e));
      return { message: 'Đã kích hoạt lại tài khoản thành công' } as T;
    }

    return mockEmployees as T;
  }

  if (endpoint === '/organization/departments') {
    if (options.method === 'POST') {
      const newDept: Department = {
        id: `dep-${Date.now()}`,
        code: body.code,
        name: body.name,
        description: body.description,
        managerName: body.managerName,
        employeeCount: 0,
        createdAt: new Date().toISOString(),
      };
      mockDepartments = [...mockDepartments, newDept];
      return newDept as T;
    }
    return mockDepartments as T;
  }

  if (endpoint === '/organization/positions') {
    return mockPositions as T;
  }

  // Authorization Mocks
  if (endpoint === '/authorization/roles') {
    return mockRoles as T;
  }

  if (endpoint === '/authorization/permissions') {
    return mockPermissions as T;
  }

  if (endpoint.startsWith('/authorization/roles/') && endpoint.endsWith('/permissions')) {
    const roleId = endpoint.split('/')[3];
    const { permissions } = body as { permissions: string[] };
    mockRoles = mockRoles.map((r) => (r.id === roleId ? { ...r, permissions } : r));
    return { message: 'Đã cập nhật ma trận phân quyền thành công' } as T;
  }

  // Client Mocks
  if (endpoint === '/clients' && options.method === 'POST') {
    const payload = body as CreateClientPayload;
    const newId = `cli-${Date.now()}`;
    const newCode = `CLI-2026-00000${mockClients.length + 1}`;
    const newClient: Client = {
      id: newId,
      clientCode: newCode,
      type: payload.type,
      status: 'NEW',
      displayName: payload.displayName,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      dateOfBirth: payload.dateOfBirth,
      nationality: payload.nationality,
      idNumber: payload.idNumber,
      occupation: payload.occupation,
      companyName: payload.companyName,
      vietnameseName: payload.vietnameseName,
      englishName: payload.englishName,
      shortName: payload.shortName,
      taxCode: payload.taxCode,
      enterpriseNumber: payload.enterpriseNumber,
      country: payload.country || 'Việt Nam',
      legalRepresentative: payload.legalRepresentative,
      website: payload.website,
      industry: payload.industry,
      contactsCount: payload.primaryContactName ? 1 : 0,
      mattersCount: 0,
    };

    if (payload.primaryContactName) {
      mockContacts.push({
        id: `con-${Date.now()}`,
        clientId: newId,
        fullName: payload.primaryContactName,
        email: payload.primaryContactEmail || payload.email,
        phone: payload.primaryContactPhone || payload.phone,
        position: payload.primaryContactPosition || 'Đại diện liên hệ',
        isPrimary: true,
        createdAt: new Date().toISOString(),
      });
    }

    mockClients = [newClient, ...mockClients];
    return newClient as T;
  }

  if (
    endpoint.startsWith('/clients/') &&
    endpoint.endsWith('/status') &&
    options.method === 'PATCH'
  ) {
    const id = endpoint.split('/')[2];
    const { status, decisionNotes } = body as ChangeClientStatusPayload;
    mockClients = mockClients.map((c) =>
      c.id === id
        ? {
            ...c,
            status,
            notes: decisionNotes
              ? `${c.notes || ''}\n[Quyết định Intake]: ${decisionNotes}`
              : c.notes,
          }
        : c,
    );
    return { message: 'Đã cập nhật trạng thái tiếp nhận khách hàng' } as T;
  }

  if (endpoint.startsWith('/clients/') && endpoint.endsWith('/contacts')) {
    const id = endpoint.split('/')[2];
    if (options.method === 'POST') {
      const newContact: Contact = {
        id: `con-${Date.now()}`,
        clientId: id,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        position: body.position,
        idNumber: body.idNumber,
        isPrimary: !!body.isPrimary,
        notes: body.notes,
        createdAt: new Date().toISOString(),
      };
      mockContacts.push(newContact);
      mockClients = mockClients.map((c) =>
        c.id === id ? { ...c, contactsCount: c.contactsCount + 1 } : c,
      );
      return newContact as T;
    }
    return mockContacts.filter((con) => con.clientId === id) as T;
  }

  if (endpoint.startsWith('/clients/') && endpoint.endsWith('/relations')) {
    const id = endpoint.split('/')[2];
    return mockRelations.filter((r) => r.sourceClientId === id) as T;
  }

  if (endpoint.startsWith('/clients/')) {
    const id = endpoint.split('/')[2];
    const client = mockClients.find((c) => c.id === id);
    if (!client) {
      throw new ApiError('Không tìm thấy thông tin khách hàng', 'CLIENT_NOT_FOUND', 404);
    }
    const contacts = mockContacts.filter((c) => c.clientId === id);
    const relations = mockRelations.filter((r) => r.sourceClientId === id);
    return { ...client, contacts, relations } as T;
  }

  if (endpoint === '/clients' || endpoint.startsWith('/clients?')) {
    return mockClients as T;
  }

  // Conflict Check Mocks
  if (endpoint === '/conflict-checks' && options.method === 'POST') {
    const payload = body as CreateConflictCheckPayload;
    const newId = `cc-${Date.now()}`;
    const newCode = `CC-2026-00000${mockConflictChecks.length + 1}`;

    const results: ConflictResultItem[] = [];
    const allTerms = [
      ...(payload.searchTerms || []),
      ...(payload.opposingParties || []),
      payload.clientName || '',
    ]
      .filter(Boolean)
      .map((t) => t.toLowerCase());

    // Quét tìm trùng lặp với danh bạ khách hàng
    mockClients.forEach((cl) => {
      const matchName = allTerms.some((term) => cl.displayName.toLowerCase().includes(term));
      if (matchName) {
        results.push({
          id: `cr-${Date.now()}-1`,
          matchedEntityType: 'CLIENT',
          matchedEntityId: cl.id,
          matchedName: cl.displayName,
          matchedRole: 'Khách hàng hiện hữu trong hệ thống',
          similarityScore: 95,
          reason: `Trùng khớp với hồ sơ khách hàng đang tồn tại: ${cl.clientCode} (${cl.displayName})`,
        });
      }

      if (cl.legalRepresentative) {
        const matchRep = allTerms.some((term) =>
          cl.legalRepresentative!.toLowerCase().includes(term),
        );
        if (matchRep) {
          results.push({
            id: `cr-${Date.now()}-2`,
            matchedEntityType: 'DIRECTOR',
            matchedName: cl.legalRepresentative,
            matchedRole: `Người đại diện pháp luật của ${cl.displayName}`,
            similarityScore: 98,
            reason: `Trùng khớp với Người đại diện theo pháp luật của khách hàng ${cl.clientCode}`,
          });
        }
      }
    });

    // Quét tìm với cổ đông và quan hệ công ty
    mockRelations.forEach((rel) => {
      const matchRel = allTerms.some((term) => rel.targetName.toLowerCase().includes(term));
      if (matchRel) {
        results.push({
          id: `cr-${Date.now()}-3`,
          matchedEntityType: rel.relationType === 'SHAREHOLDER' ? 'SHAREHOLDER' : 'RELATED_PARTY',
          matchedName: rel.targetName,
          matchedRole: `Quan hệ: ${rel.relationType}`,
          similarityScore: 90,
          reason: `Phát hiện quan hệ liên kết cổ đông/công ty con trong cơ sở dữ liệu: ${rel.notes || rel.relationType}`,
        });
      }
    });

    // Kiểm tra đương sự đối kháng
    const isDirectConflict = allTerms.some(
      (t) => t.includes('thịnh vượng') || t.includes('đối thủ'),
    );

    let status: ConflictStatus = 'NO_CONFLICT';
    if (isDirectConflict) {
      status = 'CONFIRMED_CONFLICT';
      results.push({
        id: `cr-${Date.now()}-9`,
        matchedEntityType: 'OPPOSING_PARTY',
        matchedName: 'Bên đối lập tố tụng đã xác nhận',
        matchedRole: 'Đương sự đối kháng trong vụ kiện',
        similarityScore: 99,
        reason: 'Xung đột trực tiếp với hồ sơ vụ việc đang giải quyết tại Tòa án cấp cao',
      });
    } else if (results.length > 0) {
      status = 'POTENTIAL_CONFLICT';
    }

    const newCheck: ConflictCheck = {
      id: newId,
      code: newCode,
      clientId: payload.clientId,
      clientName: payload.clientName || 'Hồ sơ tra cứu độc lập',
      matterName: payload.matterName || 'Thẩm định mở vụ việc',
      searchTerms: payload.searchTerms,
      status,
      requestedById: 'emp-1',
      requestedByName: 'Luật sư Nguyễn Văn An',
      requestedAt: new Date().toISOString(),
      notes: payload.notes,
      results,
    };

    mockConflictChecks = [newCheck, ...mockConflictChecks];
    return newCheck as T;
  }

  if (
    endpoint.startsWith('/conflict-checks/') &&
    endpoint.endsWith('/review') &&
    options.method === 'POST'
  ) {
    const id = endpoint.split('/')[2];
    const { decisionType, decisionNotes } = body as ReviewConflictCheckPayload;
    let newStatus: ConflictStatus = 'NO_CONFLICT';
    if (decisionType === 'REJECTED_CONFIRMED') newStatus = 'CONFIRMED_CONFLICT';
    if (decisionType === 'APPROVED_WITH_CONDITIONS') newStatus = 'POTENTIAL_CONFLICT';

    mockConflictChecks = mockConflictChecks.map((cc) =>
      cc.id === id
        ? {
            ...cc,
            status: newStatus,
            decisionType,
            decisionNotes,
            reviewedById: 'emp-1',
            reviewedByName: 'Luật sư Nguyễn Văn An (Managing Partner)',
            reviewedAt: new Date().toISOString(),
          }
        : cc,
    );
    return { message: 'Đã hoàn tất thẩm duyệt lệnh tra cứu xung đột' } as T;
  }

  if (endpoint.startsWith('/conflict-checks/')) {
    const id = endpoint.split('/')[2];
    const check = mockConflictChecks.find((cc) => cc.id === id);
    if (!check) {
      throw new ApiError('Không tìm thấy lệnh tra cứu xung đột', 'CONFLICT_CHECK_NOT_FOUND', 404);
    }
    return check as T;
  }

  if (endpoint === '/conflict-checks' || endpoint.startsWith('/conflict-checks?')) {
    return mockConflictChecks as T;
  }

  // Matter Mocks
  if (endpoint === '/matters' && options.method === 'POST') {
    const payload = body as CreateMatterPayload;
    const client = mockClients.find((c) => c.id === payload.clientId);
    const partner = mockEmployees.find((e) => e.id === payload.responsiblePartnerId);
    const lawyer = mockEmployees.find((e) => e.id === payload.responsibleLawyerId);

    const newId = `mat-${Date.now()}`;
    const newCode = `MAT-2026-00000${mockMatters.length + 1}`;

    const members: MatterMember[] = [
      {
        id: `mm-${Date.now()}-1`,
        matterId: newId,
        userId: payload.responsiblePartnerId,
        userName: partner?.fullName || 'Partner Phụ trách',
        userEmail: partner?.email || 'partner@lpms-law.vn',
        role: 'RESPONSIBLE_PARTNER',
        canEdit: true,
        joinedAt: new Date().toISOString(),
      },
      {
        id: `mm-${Date.now()}-2`,
        matterId: newId,
        userId: payload.responsibleLawyerId,
        userName: lawyer?.fullName || 'Luật sư Chủ nhiệm',
        userEmail: lawyer?.email || 'lawyer@lpms-law.vn',
        role: 'RESPONSIBLE_LAWYER',
        canEdit: true,
        joinedAt: new Date().toISOString(),
      },
    ];

    const parties: MatterParty[] = [
      {
        id: `mp-${Date.now()}-1`,
        matterId: newId,
        name: client?.displayName || 'Thân chủ',
        role: 'CLIENT',
        representativeName: client?.legalRepresentative,
        contactInfo: client?.email,
      },
    ];

    const newMatter: Matter = {
      id: newId,
      matterCode: newCode,
      name: payload.name,
      description: payload.description,
      clientId: payload.clientId,
      clientName: client?.displayName || 'Khách hàng mới',
      conflictCheckId: payload.conflictCheckId,
      practiceArea: payload.practiceArea,
      matterType: payload.matterType,
      responsiblePartnerId: payload.responsiblePartnerId,
      responsiblePartnerName: partner?.fullName || 'Partner Phụ trách',
      responsibleLawyerId: payload.responsibleLawyerId,
      responsibleLawyerName: lawyer?.fullName || 'Luật sư Chủ nhiệm',
      status: 'INTAKE',
      priority: payload.priority,
      confidentialityLevel: payload.confidentialityLevel,
      openDate: payload.openDate,
      expectedCloseDate: payload.expectedCloseDate,
      estimatedHours: payload.estimatedHours,
      billingMethod: payload.billingMethod,
      members,
      parties,
      tasks: [],
      deadlines: [],
      documents: [],
      notes: [],
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          matterId: newId,
          type: 'STATUS_CHANGE',
          actorName: 'Nguyễn Văn An (Managing Partner)',
          timestamp: new Date().toISOString(),
          description: `Khởi tạo hồ sơ vụ việc mới (${newCode}) và thiết lập thư mục quản lý tập trung.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockMatters = [newMatter, ...mockMatters];
    return newMatter as T;
  }

  if (
    endpoint.startsWith('/matters/') &&
    endpoint.endsWith('/status') &&
    options.method === 'POST'
  ) {
    const id = endpoint.split('/')[2];
    const { status, notes } = body as ChangeMatterStatusPayload;
    mockMatters = mockMatters.map((m) => {
      if (m.id === id) {
        const event: MatterTimelineEvent = {
          id: `tl-${Date.now()}`,
          matterId: id,
          type: 'STATUS_CHANGE',
          actorName: 'Nguyễn Văn An (Managing Partner)',
          timestamp: new Date().toISOString(),
          description: `Chuyển trạng thái vụ việc từ ${m.status} sang ${status}${notes ? `. Ghi chú: ${notes}` : ''}`,
        };
        return {
          ...m,
          status,
          updatedAt: new Date().toISOString(),
          timeline: [event, ...m.timeline],
        };
      }
      return m;
    });
    return { message: 'Đã cập nhật trạng thái hồ sơ vụ việc' } as T;
  }

  if (
    endpoint.startsWith('/matters/') &&
    endpoint.endsWith('/members') &&
    options.method === 'POST'
  ) {
    const id = endpoint.split('/')[2];
    const { userId, role, canEdit } = body as AddMatterMemberPayload;
    const emp = mockEmployees.find((e) => e.id === userId);
    const newMember: MatterMember = {
      id: `mm-${Date.now()}`,
      matterId: id,
      userId,
      userName: emp?.fullName || 'Thành viên mới',
      userEmail: emp?.email || 'member@lpms-law.vn',
      role,
      canEdit,
      joinedAt: new Date().toISOString(),
    };
    mockMatters = mockMatters.map((m) =>
      m.id === id ? { ...m, members: [...m.members, newMember] } : m,
    );
    return newMember as T;
  }

  if (
    endpoint.startsWith('/matters/') &&
    endpoint.includes('/members/') &&
    options.method === 'DELETE'
  ) {
    const parts = endpoint.split('/');
    const matterId = parts[2];
    const memberId = parts[4];
    mockMatters = mockMatters.map((m) =>
      m.id === matterId ? { ...m, members: m.members.filter((mem) => mem.id !== memberId) } : m,
    );
    return { message: 'Đã xóa thành viên khỏi vụ việc' } as T;
  }

  if (
    endpoint.startsWith('/matters/') &&
    endpoint.endsWith('/parties') &&
    options.method === 'POST'
  ) {
    const id = endpoint.split('/')[2];
    const payload = body as AddMatterPartyPayload;
    const newParty: MatterParty = {
      id: `mp-${Date.now()}`,
      matterId: id,
      ...payload,
    };
    mockMatters = mockMatters.map((m) =>
      m.id === id ? { ...m, parties: [...m.parties, newParty] } : m,
    );
    return newParty as T;
  }

  if (
    endpoint.startsWith('/matters/') &&
    endpoint.endsWith('/notes') &&
    options.method === 'POST'
  ) {
    const id = endpoint.split('/')[2];
    const { content, isConfidential } = body as { content: string; isConfidential?: boolean };
    const newNote: MatterNote = {
      id: `not-${Date.now()}`,
      authorName: 'Nguyễn Văn An (Managing Partner)',
      content,
      createdAt: new Date().toISOString(),
      isConfidential,
    };
    mockMatters = mockMatters.map((m) =>
      m.id === id ? { ...m, notes: [newNote, ...m.notes] } : m,
    );
    return newNote as T;
  }

  if (endpoint.startsWith('/matters/') && options.method === 'PATCH') {
    const id = endpoint.split('/')[2];
    const payload = body as UpdateMatterPayload;
    mockMatters = mockMatters.map((m) =>
      m.id === id ? { ...m, ...payload, updatedAt: new Date().toISOString() } : m,
    );
    const updated = mockMatters.find((m) => m.id === id);
    return updated as T;
  }

  if (endpoint.startsWith('/matters/')) {
    const id = endpoint.split('/')[2];
    const matter = mockMatters.find((m) => m.id === id);
    if (!matter) {
      throw new ApiError('Không tìm thấy hồ sơ vụ việc', 'MATTER_NOT_FOUND', 404);
    }
    return matter as T;
  }

  if (endpoint === '/matters' || endpoint.startsWith('/matters?')) {
    return mockMatters as T;
  }

  // Tasks Mocks
  if (endpoint === '/tasks' && options.method === 'POST') {
    const payload = body as CreateTaskPayload;
    const matter = payload.matterId
      ? mockMatters.find((m) => m.id === payload.matterId)
      : undefined;
    const assignee = mockEmployees.find((e) => e.id === payload.assigneeId);
    const reviewer = payload.reviewerId
      ? mockEmployees.find((e) => e.id === payload.reviewerId)
      : undefined;

    const newId = `tsk-${Date.now()}`;
    const newCode = `TSK-2026-00000${mockTasks.length + 1}`;

    const checklists: TaskChecklistItem[] = (payload.checklists || []).map((title, i) => ({
      id: `chk-${Date.now()}-${i}`,
      title,
      isCompleted: false,
    }));

    const newTask: Task = {
      id: newId,
      code: newCode,
      title: payload.title,
      description: payload.description,
      matterId: payload.matterId,
      matterCode: matter?.matterCode,
      matterName: matter?.name,
      assigneeId: payload.assigneeId,
      assigneeName: assignee?.fullName || 'Người thực hiện',
      reviewerId: payload.reviewerId,
      reviewerName: reviewer?.fullName,
      priority: payload.priority,
      status: 'TODO',
      startDate: payload.startDate,
      dueDate: payload.dueDate,
      estimatedMinutes: payload.estimatedMinutes,
      isOverdue: false,
      checklists,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockTasks = [newTask, ...mockTasks];
    return newTask as T;
  }

  if (endpoint.startsWith('/tasks/') && endpoint.endsWith('/status') && options.method === 'POST') {
    const id = endpoint.split('/')[2];
    const { status } = body as ChangeTaskStatusPayload;
    mockTasks = mockTasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status,
            completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
            completedBy: status === 'COMPLETED' ? 'Nguyễn Văn An' : undefined,
            updatedAt: new Date().toISOString(),
          }
        : t,
    );
    return { message: 'Đã cập nhật trạng thái công việc' } as T;
  }

  if (
    endpoint.startsWith('/tasks/') &&
    endpoint.includes('/checklists/') &&
    options.method === 'PATCH'
  ) {
    const parts = endpoint.split('/');
    const taskId = parts[2];
    const checklistId = parts[4];
    const { isCompleted } = body as { isCompleted: boolean };
    let updatedItem: TaskChecklistItem | undefined;

    mockTasks = mockTasks.map((t) => {
      if (t.id === taskId) {
        const checklists = t.checklists.map((c) => {
          if (c.id === checklistId) {
            updatedItem = {
              ...c,
              isCompleted,
              completedAt: isCompleted ? new Date().toISOString() : undefined,
              completedBy: isCompleted ? 'Nguyễn Văn An' : undefined,
            };
            return updatedItem;
          }
          return c;
        });
        return { ...t, checklists, updatedAt: new Date().toISOString() };
      }
      return t;
    });

    return updatedItem as T;
  }

  if (
    endpoint.startsWith('/tasks/') &&
    endpoint.endsWith('/comments') &&
    options.method === 'POST'
  ) {
    const id = endpoint.split('/')[2];
    const { content } = body as { content: string };
    const newComment: TaskComment = {
      id: `com-${Date.now()}`,
      authorId: 'emp-1',
      authorName: 'Nguyễn Văn An (Managing Partner)',
      content,
      createdAt: new Date().toISOString(),
    };
    mockTasks = mockTasks.map((t) =>
      t.id === id
        ? { ...t, comments: [...t.comments, newComment], updatedAt: new Date().toISOString() }
        : t,
    );
    return newComment as T;
  }

  if (endpoint.startsWith('/tasks/')) {
    const id = endpoint.split('/')[2];
    const task = mockTasks.find((t) => t.id === id);
    if (!task) {
      throw new ApiError('Không tìm thấy công việc', 'TASK_NOT_FOUND', 404);
    }
    return task as T;
  }

  if (endpoint === '/tasks' || endpoint.startsWith('/tasks?')) {
    return mockTasks as T;
  }

  // Deadlines Mocks
  if (endpoint === '/deadlines' && options.method === 'POST') {
    const payload = body as CreateDeadlinePayload;
    const matter = payload.matterId
      ? mockMatters.find((m) => m.id === payload.matterId)
      : undefined;
    const person = mockEmployees.find((e) => e.id === payload.responsiblePersonId);

    const newId = `dl-${Date.now()}`;
    const newCode = `DL-2026-00000${mockDeadlines.length + 1}`;

    const newDeadline: Deadline = {
      id: newId,
      code: newCode,
      title: payload.title,
      description: payload.description,
      matterId: payload.matterId,
      matterCode: matter?.matterCode,
      matterName: matter?.name,
      category: payload.category,
      dueDate: payload.dueDate,
      dueTime: payload.dueTime,
      reminderDays: payload.reminderDays || [7, 3, 1],
      isCompleted: false,
      isOverdue: false,
      responsiblePersonId: payload.responsiblePersonId,
      responsiblePersonName: person?.fullName || 'Người phụ trách',
      authorityName: payload.authorityName,
      courtName: payload.courtName,
      caseNumber: payload.caseNumber,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDeadlines = [newDeadline, ...mockDeadlines];
    return newDeadline as T;
  }

  if (
    endpoint.startsWith('/deadlines/') &&
    endpoint.endsWith('/toggle-complete') &&
    options.method === 'POST'
  ) {
    const id = endpoint.split('/')[2];
    const { isCompleted } = body as { isCompleted: boolean };
    mockDeadlines = mockDeadlines.map((d) =>
      d.id === id
        ? {
            ...d,
            isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          }
        : d,
    );
    return { message: 'Đã cập nhật trạng thái thời hạn' } as T;
  }

  if (endpoint.startsWith('/deadlines/')) {
    const id = endpoint.split('/')[2];
    const dl = mockDeadlines.find((d) => d.id === id);
    if (!dl) {
      throw new ApiError('Không tìm thấy thời hạn', 'DEADLINE_NOT_FOUND', 404);
    }
    return dl as T;
  }

  if (endpoint === '/deadlines' || endpoint.startsWith('/deadlines?')) {
    return mockDeadlines as T;
  }

  // Folders
  if (endpoint === '/folders' || endpoint.startsWith('/folders?')) {
    const url = new URL(`http://localhost${endpoint}`);
    const matterId = url.searchParams.get('matterId');
    if (options.method === 'POST') {
      const payload = JSON.parse(options.body as string);
      const newFolder: DocumentFolder = {
        id: `fld-${payload.matterId}-${Date.now()}`,
        matterId: payload.matterId,
        matterCode: 'MAT-2026-CUSTOM',
        matterTitle: 'Hồ sơ pháp lý liên quan',
        name: payload.name,
        code: `FLD-${Date.now().toString().slice(-4)}`,
        order: mockFolders.length + 1,
        documentCount: 0,
        createdAt: new Date().toISOString(),
      };
      mockFolders = [...mockFolders, newFolder];
      return newFolder as T;
    }
    if (matterId) {
      return mockFolders.filter((f) => f.matterId === matterId) as T;
    }
    return mockFolders as T;
  }

  // Documents
  if (endpoint.startsWith('/documents/') && endpoint.endsWith('/activities')) {
    const docId = endpoint.split('/')[2];
    const activities = mockDocumentActivities.filter((a) => a.documentId === docId);
    return activities.sort(
      (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    ) as T;
  }

  if (endpoint.startsWith('/documents/') && endpoint.endsWith('/signed-download')) {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    const body = options.body ? JSON.parse(options.body as string) : {};
    const verNum = body.versionNumber || doc.currentVersion;
    const version =
      doc.versions.find((v) => v.versionNumber === verNum) || doc.versions[doc.versions.length - 1];

    // Log download audit activity
    const newAct: DocumentActivity = {
      id: `act-${Date.now()}`,
      documentId: doc.id,
      action: 'DOWNLOADED',
      performedBy: 'emp-1',
      performedByName: 'Luật sư Trần Tuấn Vũ',
      performedAt: new Date().toISOString(),
      details: `Yêu cầu liên kết tải Signed URL (15 phút) cho phiên bản v${verNum} [${version.fileName}]`,
      ipAddress: '14.241.120.45',
    };
    mockDocumentActivities = [newAct, ...mockDocumentActivities];

    const signedRes: SignedUrlResponse = {
      documentId: doc.id,
      versionNumber: verNum,
      downloadUrl: `https://lpms-vault-prod.s3.ap-southeast-1.amazonaws.com/downloads/${doc.id}/v${verNum}/${encodeURIComponent(version.fileName)}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900&X-Amz-Signature=mock9f86d081884c7d659a2feaa0c55ad015`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      expiresInSeconds: 900,
      sha256: version.sha256,
      watermarkText: doc.watermarkEnabled
        ? `MẬT - CÔNG TY LUẬT LPMS - NGƯỜI TẢI: LUẬT SƯ TRẦN TUẤN VŨ - ${new Date().toISOString().slice(0, 10)}`
        : undefined,
      fileSize: version.fileSize,
      fileName: version.fileName,
    };
    return signedRes as T;
  }

  if (
    endpoint.startsWith('/documents/') &&
    endpoint.endsWith('/versions') &&
    options.method === 'POST'
  ) {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    const payload: UploadNewVersionPayload = JSON.parse(options.body as string);
    const nextVer = doc.versions.length + 1;
    const newVersion: DocumentVersion = {
      id: `ver-${doc.id}-${nextVer}`,
      documentId: doc.id,
      versionNumber: nextVer,
      fileKey: `s3://lpms-vault-prod/${doc.matterId}/${doc.id}_v${nextVer}_${payload.fileName}`,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      fileType: payload.fileName.slice(payload.fileName.lastIndexOf('.')),
      mimeType: payload.mimeType,
      sha256: `sha256_${Date.now()}_mock_integrity_hash_${Math.random().toString(36).substring(2, 9)}`,
      uploadedBy: 'emp-1',
      uploadedByName: 'Luật sư Trần Tuấn Vũ',
      uploadedAt: new Date().toISOString(),
      comment: payload.comment,
      isCurrent: true,
    };

    const updatedVersions = doc.versions
      .map((v) => ({ ...v, isCurrent: false }))
      .concat(newVersion);
    const updatedDoc: DocumentItem = {
      ...doc,
      currentVersion: nextVer,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      fileType: newVersion.fileType,
      mimeType: payload.mimeType,
      sha256: newVersion.sha256,
      storageKey: newVersion.fileKey,
      versions: updatedVersions,
      updatedAt: new Date().toISOString(),
    };

    mockDocuments = mockDocuments.map((d) => (d.id === doc.id ? updatedDoc : d));

    const newAct: DocumentActivity = {
      id: `act-${Date.now()}`,
      documentId: doc.id,
      action: 'VERSION_CREATED',
      performedBy: 'emp-1',
      performedByName: 'Luật sư Trần Tuấn Vũ',
      performedAt: new Date().toISOString(),
      details: `Tải lên phiên bản mới v${nextVer}: ${payload.comment}`,
      ipAddress: '14.241.120.45',
    };
    mockDocumentActivities = [newAct, ...mockDocumentActivities];

    return updatedDoc as T;
  }

  if (
    endpoint.startsWith('/documents/') &&
    endpoint.endsWith('/restore-version') &&
    options.method === 'POST'
  ) {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    const { versionNumber, comment } = JSON.parse(options.body as string);
    const targetVer = doc.versions.find((v) => v.versionNumber === versionNumber);
    if (!targetVer)
      throw new ApiError(`Không tìm thấy phiên bản v${versionNumber}`, 'VERSION_NOT_FOUND', 404);

    // Section 26: Restore phải tạo version mới, không xóa lịch sử
    const nextVer = doc.versions.length + 1;
    const restoredVersion: DocumentVersion = {
      id: `ver-${doc.id}-${nextVer}`,
      documentId: doc.id,
      versionNumber: nextVer,
      fileKey: targetVer.fileKey,
      fileName: targetVer.fileName,
      fileSize: targetVer.fileSize,
      fileType: targetVer.fileType,
      mimeType: targetVer.mimeType,
      sha256: targetVer.sha256,
      uploadedBy: 'emp-1',
      uploadedByName: 'Luật sư Trần Tuấn Vũ',
      uploadedAt: new Date().toISOString(),
      comment: `Khôi phục nội dung từ phiên bản v${versionNumber}${comment ? `: ${comment}` : ''}`,
      isCurrent: true,
    };

    const updatedVersions = doc.versions
      .map((v) => ({ ...v, isCurrent: false }))
      .concat(restoredVersion);
    const updatedDoc: DocumentItem = {
      ...doc,
      currentVersion: nextVer,
      fileName: targetVer.fileName,
      fileSize: targetVer.fileSize,
      fileType: targetVer.fileType,
      mimeType: targetVer.mimeType,
      sha256: targetVer.sha256,
      storageKey: targetVer.fileKey,
      versions: updatedVersions,
      updatedAt: new Date().toISOString(),
    };

    mockDocuments = mockDocuments.map((d) => (d.id === doc.id ? updatedDoc : d));

    const newAct: DocumentActivity = {
      id: `act-${Date.now()}`,
      documentId: doc.id,
      action: 'RESTORED',
      performedBy: 'emp-1',
      performedByName: 'Luật sư Trần Tuấn Vũ',
      performedAt: new Date().toISOString(),
      details: `Khôi phục phiên bản v${versionNumber} thành phiên bản mới v${nextVer}`,
      ipAddress: '14.241.120.45',
    };
    mockDocumentActivities = [newAct, ...mockDocumentActivities];

    return updatedDoc as T;
  }

  if (
    endpoint.startsWith('/documents/') &&
    endpoint.endsWith('/status') &&
    options.method === 'PATCH'
  ) {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    const { status } = JSON.parse(options.body as string);
    const oldStatus = doc.status;
    const updatedDoc: DocumentItem = {
      ...doc,
      status,
      updatedAt: new Date().toISOString(),
    };
    mockDocuments = mockDocuments.map((d) => (d.id === doc.id ? updatedDoc : d));

    const newAct: DocumentActivity = {
      id: `act-${Date.now()}`,
      documentId: doc.id,
      action: 'STATUS_CHANGED',
      performedBy: 'emp-1',
      performedByName: 'Luật sư Trần Tuấn Vũ',
      performedAt: new Date().toISOString(),
      details: `Chuyển trạng thái tài liệu từ ${oldStatus} sang ${status}`,
      ipAddress: '14.241.120.45',
    };
    mockDocumentActivities = [newAct, ...mockDocumentActivities];

    return updatedDoc as T;
  }

  if (
    endpoint.startsWith('/documents/') &&
    endpoint.endsWith('/permissions') &&
    options.method === 'PATCH'
  ) {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    const payload: UpdateDocumentPermissionsPayload = JSON.parse(options.body as string);
    const updatedDoc: DocumentItem = {
      ...doc,
      ...(payload.isSensitive !== undefined ? { isSensitive: payload.isSensitive } : {}),
      ...(payload.watermarkEnabled !== undefined
        ? { watermarkEnabled: payload.watermarkEnabled }
        : {}),
      ...(payload.downloadRestricted !== undefined
        ? { downloadRestricted: payload.downloadRestricted }
        : {}),
      ...(payload.partnerOnly !== undefined ? { partnerOnly: payload.partnerOnly } : {}),
      updatedAt: new Date().toISOString(),
    };
    mockDocuments = mockDocuments.map((d) => (d.id === doc.id ? updatedDoc : d));

    const newAct: DocumentActivity = {
      id: `act-${Date.now()}`,
      documentId: doc.id,
      action: 'PERMISSIONS_UPDATED',
      performedBy: 'emp-1',
      performedByName: 'Luật sư Trần Tuấn Vũ',
      performedAt: new Date().toISOString(),
      details: 'Cập nhật chính sách bảo mật: Quyền truy cập, Watermark và Giới hạn tải xuống',
      ipAddress: '14.241.120.45',
    };
    mockDocumentActivities = [newAct, ...mockDocumentActivities];

    return updatedDoc as T;
  }

  if (
    endpoint.startsWith('/documents/') &&
    endpoint.endsWith('/restore') &&
    options.method === 'POST'
  ) {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    const updatedDoc: DocumentItem = {
      ...doc,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deletedByName: undefined,
      deleteReason: undefined,
      updatedAt: new Date().toISOString(),
    };
    mockDocuments = mockDocuments.map((d) => (d.id === doc.id ? updatedDoc : d));

    const newAct: DocumentActivity = {
      id: `act-${Date.now()}`,
      documentId: doc.id,
      action: 'RECYCLED_RESTORED',
      performedBy: 'emp-1',
      performedByName: 'Luật sư Trần Tuấn Vũ',
      performedAt: new Date().toISOString(),
      details: 'Khôi phục tài liệu từ Thùng rác về thư mục hoạt động',
      ipAddress: '14.241.120.45',
    };
    mockDocumentActivities = [newAct, ...mockDocumentActivities];

    return updatedDoc as T;
  }

  if (
    endpoint.startsWith('/documents/') &&
    endpoint.endsWith('/purge') &&
    options.method === 'DELETE'
  ) {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    const { confirmationWord } = JSON.parse(options.body as string);
    if (confirmationWord !== 'DELETE_FOREVER') {
      throw new ApiError(
        'Từ khóa xác nhận không chính xác. Yêu cầu nhập đúng DELETE_FOREVER.',
        'INVALID_CONFIRMATION',
        400,
      );
    }
    // Section 29: Permanent deletion requires special permission, confirmation & audit
    mockDocuments = mockDocuments.filter((d) => d.id !== docId);
    return { message: `Đã xóa vĩnh viễn tài liệu "${doc.title}" khỏi hệ thống lưu trữ.` } as T;
  }

  if (endpoint.startsWith('/documents/') && options.method === 'DELETE') {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    const body = options.body ? JSON.parse(options.body as string) : {};
    const updatedDoc: DocumentItem = {
      ...doc,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: 'emp-1',
      deletedByName: 'Luật sư Trần Tuấn Vũ',
      deleteReason: body.reason || 'Người dùng chuyển vào Thùng rác',
      updatedAt: new Date().toISOString(),
    };
    mockDocuments = mockDocuments.map((d) => (d.id === doc.id ? updatedDoc : d));

    const newAct: DocumentActivity = {
      id: `act-${Date.now()}`,
      documentId: doc.id,
      action: 'SOFT_DELETED',
      performedBy: 'emp-1',
      performedByName: 'Luật sư Trần Tuấn Vũ',
      performedAt: new Date().toISOString(),
      details: `Chuyển tài liệu vào Thùng rác. Lý do: ${body.reason || 'Không nêu'}`,
      ipAddress: '14.241.120.45',
    };
    mockDocumentActivities = [newAct, ...mockDocumentActivities];

    return { message: 'Đã chuyển tài liệu vào Thùng rác thành công.' } as T;
  }

  if (endpoint.startsWith('/documents/') && options.method === 'GET') {
    const docId = endpoint.split('/')[2];
    const doc = mockDocuments.find((d) => d.id === docId);
    if (!doc) throw new ApiError('Không tìm thấy tài liệu', 'DOCUMENT_NOT_FOUND', 404);
    return doc as T;
  }

  if (endpoint === '/documents' && options.method === 'POST') {
    const payload: UploadDocumentPayload = JSON.parse(options.body as string);
    const targetMatter = mockMattersForFolders.find((m) => m.id === payload.matterId);
    const targetFolder = mockFolders.find((f) => f.id === payload.folderId);
    const docId = `doc-${Date.now().toString().slice(-4)}`;
    const fileExt = payload.fileName.slice(payload.fileName.lastIndexOf('.'));
    const sha256 = `sha256_${Date.now()}_mock_${Math.random().toString(36).substring(2, 10)}`;
    const storageKey = `s3://lpms-vault-prod/${payload.matterId}/${docId}_v1_${payload.fileName}`;

    const initialVersion: DocumentVersion = {
      id: `ver-${docId}-1`,
      documentId: docId,
      versionNumber: 1,
      fileKey: storageKey,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      fileType: fileExt,
      mimeType: payload.mimeType,
      sha256,
      uploadedBy: 'emp-1',
      uploadedByName: 'Luật sư Trần Tuấn Vũ',
      uploadedAt: new Date().toISOString(),
      comment: payload.comment || 'Tải lên phiên bản khởi tạo',
      isCurrent: true,
    };

    const newDoc: DocumentItem = {
      id: docId,
      matterId: payload.matterId,
      matterCode: targetMatter?.code || 'MAT-2026-000001',
      matterTitle: targetMatter?.title || 'Hồ sơ vụ việc',
      folderId: payload.folderId,
      folderName: targetFolder?.name || '03 Drafts',
      title: payload.title,
      description: payload.description,
      currentVersion: 1,
      status: payload.status || 'DRAFT',
      fileName: payload.fileName,
      fileType: fileExt,
      mimeType: payload.mimeType,
      fileSize: payload.fileSize,
      sha256,
      storageKey,
      isSensitive: payload.isSensitive || false,
      watermarkEnabled: payload.watermarkEnabled !== undefined ? payload.watermarkEnabled : true,
      downloadRestricted: payload.downloadRestricted || false,
      partnerOnly: payload.partnerOnly || false,
      isDeleted: false,
      versions: [initialVersion],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'emp-1',
      createdByName: 'Luật sư Trần Tuấn Vũ',
    };

    mockDocuments = [newDoc, ...mockDocuments];

    const newAct: DocumentActivity = {
      id: `act-${Date.now()}`,
      documentId: docId,
      action: 'UPLOADED',
      performedBy: 'emp-1',
      performedByName: 'Luật sư Trần Tuấn Vũ',
      performedAt: new Date().toISOString(),
      details: `Tải lên tài liệu mới: ${payload.title} (${payload.fileName})`,
      ipAddress: '14.241.120.45',
    };
    mockDocumentActivities = [newAct, ...mockDocumentActivities];

    return newDoc as T;
  }

  if (endpoint === '/documents' || endpoint.startsWith('/documents?')) {
    const url = new URL(`http://localhost${endpoint}`);
    const matterId = url.searchParams.get('matterId');
    const folderId = url.searchParams.get('folderId');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.toLowerCase();
    const isDeleted = url.searchParams.get('isDeleted');
    const isSensitive = url.searchParams.get('isSensitive');

    let docs = [...mockDocuments];

    if (isDeleted === 'true') {
      docs = docs.filter((d) => d.isDeleted);
    } else {
      docs = docs.filter((d) => !d.isDeleted);
    }

    if (matterId) {
      docs = docs.filter((d) => d.matterId === matterId);
    }
    if (folderId) {
      docs = docs.filter((d) => d.folderId === folderId);
    }
    if (status) {
      docs = docs.filter((d) => d.status === status);
    }
    if (isSensitive === 'true') {
      docs = docs.filter((d) => d.isSensitive);
    }
    if (search) {
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.fileName.toLowerCase().includes(search) ||
          (d.description && d.description.toLowerCase().includes(search)),
      );
    }

    return docs as T;
  }

  if (endpoint === '/notifications' || endpoint.startsWith('/notifications?')) {
    const url = new URL(`http://localhost${endpoint}`);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    return mockNotifications
      .filter((item) => !unreadOnly || !item.readAt)
      .map((item) => ({ ...item })) as T;
  }

  if (
    endpoint.startsWith('/notifications/') &&
    endpoint.endsWith('/read') &&
    options.method === 'PATCH'
  ) {
    const id = endpoint.split('/')[2];
    const index = mockNotifications.findIndex((item) => item.id === id);
    if (index < 0) throw new ApiError('Không tìm thấy thông báo', 'NOTIFICATION_NOT_FOUND', 404);
    mockNotifications[index] = { ...mockNotifications[index], readAt: new Date().toISOString() };
    return { ...mockNotifications[index] } as T;
  }

  if (endpoint === '/notifications/read-all' && options.method === 'POST') {
    const readAt = new Date().toISOString();
    const updated = mockNotifications.filter((item) => !item.readAt).length;
    mockNotifications = mockNotifications.map((item) => ({
      ...item,
      readAt: item.readAt ?? readAt,
    }));
    return { updated } as T;
  }

  if (endpoint === '/search' || endpoint.startsWith('/search?')) {
    const url = new URL(`http://localhost${endpoint}`);
    const query = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
    const type = url.searchParams.get('type');
    const catalog: SearchResultSet['results'] = [
      {
        id: 'cli-1',
        type: 'CLIENT',
        title: 'Công ty Cổ phần Năng lượng Tái tạo Mekong',
        subtitle: 'CLI-2026-000001',
        href: '/clients/cli-1',
        score: 0,
      },
      {
        id: 'mat-1',
        type: 'MATTER',
        title: 'Tư vấn dự án Solar Việt Nam',
        subtitle: 'MAT-2026-0001',
        href: '/matters/mat-1',
        score: 0,
      },
      {
        id: 'tsk-1',
        type: 'TASK',
        title: 'Rà soát điều khoản bảo lãnh',
        subtitle: 'TSK-2026-0001',
        href: '/tasks/tsk-1',
        score: 0,
      },
      {
        id: 'dl-1',
        type: 'DEADLINE',
        title: 'Nộp bản giải trình cho Tòa án',
        subtitle: 'DL-2026-0001',
        href: '/deadlines/dl-1',
        score: 0,
      },
      {
        id: 'doc-1',
        type: 'DOCUMENT',
        title: 'Dự thảo hợp đồng tư vấn pháp lý',
        subtitle: 'hop-dong-tu-van-v2.docx',
        href: '/documents/doc-1',
        score: 0,
      },
    ];
    const results = catalog
      .filter((item) => !type || item.type === type)
      .map((item) => ({
        ...item,
        score:
          query && `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(query) ? 1 : 0,
      }))
      .filter((item) => !query || item.score > 0);
    return { query: url.searchParams.get('q') ?? '', results, total: results.length } as T;
  }

  if (endpoint === '/reports/overview' || endpoint.startsWith('/reports/overview?')) {
    const url = new URL(`http://localhost${endpoint}`);
    return {
      period: {
        from: url.searchParams.get('from') ?? `${new Date().getFullYear()}-01-01`,
        to: url.searchParams.get('to') ?? new Date().toISOString(),
      },
      totals: { clients: 24, matters: 18, tasks: 47, deadlines: 12, documents: 136 },
      taskStatus: [
        { status: 'TODO', count: 14 },
        { status: 'IN_PROGRESS', count: 18 },
        { status: 'COMPLETED', count: 12 },
        { status: 'BLOCKED', count: 3 },
      ],
      matterStatus: [
        { status: 'INTAKE', count: 3 },
        { status: 'ACTIVE', count: 11 },
        { status: 'ON_HOLD', count: 2 },
        { status: 'CLOSED', count: 2 },
      ],
      workload: [
        { userId: 'emp-3', userName: 'Lê Hoàng Nam', openTasks: 9, overdueTasks: 1 },
        { userId: 'emp-4', userName: 'Nguyễn Văn An', openTasks: 7, overdueTasks: 2 },
        { userId: 'emp-2', userName: 'Trần Thị Bích', openTasks: 5, overdueTasks: 0 },
      ],
    } as T;
  }

  if (endpoint === '/audit' || endpoint.startsWith('/audit?')) {
    const url = new URL(`http://localhost${endpoint}`);
    const auditModule = url.searchParams.get('module');
    const action = url.searchParams.get('action');
    const actorId = url.searchParams.get('actorId');
    return mockAuditEntries.filter(
      (entry) =>
        (!auditModule || entry.module === auditModule) &&
        (!action || entry.action === action) &&
        (!actorId || entry.actorId === actorId),
    ) as T;
  }

  throw new ApiError('Không tìm thấy endpoint mô phỏng', 'NOT_FOUND', 404);
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyMfa: (payload: VerifyMfaPayload) =>
    request<{ user: UserSummary; message: string }>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => request<UserSummary>('/auth/me'),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getSessions: () => request<ActiveSession[]>('/auth/sessions'),

  revokeSession: (sessionId: string) =>
    request<{ message: string }>(`/auth/sessions/revoke/${sessionId}`, {
      method: 'POST',
    }),

  revokeAllOtherSessions: () =>
    request<{ message: string }>('/auth/sessions/revoke-all', {
      method: 'POST',
    }),
};

export const organizationApi = {
  getOverview: () => request<OrganizationOverview>('/organization/overview'),

  getEmployees: () => request<Employee[]>('/users'),

  createEmployee: (payload: CreateEmployeePayload) =>
    request<Employee>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateEmployee: (id: string, payload: UpdateEmployeePayload) =>
    request<Employee>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  suspendEmployee: (id: string) =>
    request<{ message: string }>(`/users/${id}/suspend`, {
      method: 'POST',
    }),

  reactivateEmployee: (id: string) =>
    request<{ message: string }>(`/users/${id}/reactivate`, {
      method: 'POST',
    }),

  getDepartments: () => request<Department[]>('/organization/departments'),

  createDepartment: (payload: Partial<Department>) =>
    request<Department>('/organization/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPositions: () => request<Position[]>('/organization/positions'),

  getRoles: () => request<RoleDefinition[]>('/authorization/roles'),

  getPermissions: () => request<PermissionDefinition[]>('/authorization/permissions'),

  updateRolePermissions: (roleId: string, permissions: string[]) =>
    request<{ message: string }>(`/authorization/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),
};

export const clientApi = {
  getClients: () => request<Client[]>('/clients'),

  getClient: (id: string) => request<Client>(`/clients/${id}`),

  createClient: (payload: CreateClientPayload) =>
    request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateClient: (id: string, payload: UpdateClientPayload) =>
    request<Client>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changeStatus: (id: string, payload: ChangeClientStatusPayload) =>
    request<{ message: string }>(`/clients/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getContacts: (clientId: string) => request<Contact[]>(`/clients/${clientId}/contacts`),

  addContact: (clientId: string, payload: Partial<Contact>) =>
    request<Contact>(`/clients/${clientId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getRelations: (clientId: string) => request<ClientRelation[]>(`/clients/${clientId}/relations`),
};

export const conflictApi = {
  getConflictChecks: () => request<ConflictCheck[]>('/conflict-checks'),

  getConflictCheck: (id: string) => request<ConflictCheck>(`/conflict-checks/${id}`),

  createConflictCheck: (payload: CreateConflictCheckPayload) =>
    request<ConflictCheck>('/conflict-checks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewConflictCheck: (id: string, payload: ReviewConflictCheckPayload) =>
    request<{ message: string }>(`/conflict-checks/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const matterApi = {
  getMatters: () => request<Matter[]>('/matters'),

  getMatter: (id: string) => request<Matter>(`/matters/${id}`),

  createMatter: (payload: CreateMatterPayload) =>
    request<Matter>('/matters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMatter: (id: string, payload: UpdateMatterPayload) =>
    request<Matter>(`/matters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changeStatus: (id: string, payload: ChangeMatterStatusPayload) =>
    request<{ message: string }>(`/matters/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addMember: (id: string, payload: AddMatterMemberPayload) =>
    request<MatterMember>(`/matters/${id}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  removeMember: (id: string, memberId: string) =>
    request<{ message: string }>(`/matters/${id}/members/${memberId}`, {
      method: 'DELETE',
    }),

  addParty: (id: string, payload: AddMatterPartyPayload) =>
    request<MatterParty>(`/matters/${id}/parties`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addNote: (id: string, content: string, isConfidential?: boolean) =>
    request<MatterNote>(`/matters/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, isConfidential }),
    }),
};

export const taskApi = {
  getTasks: () => request<Task[]>('/tasks'),

  getTask: (id: string) => request<Task>(`/tasks/${id}`),

  createTask: (payload: CreateTaskPayload) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTask: (id: string, payload: UpdateTaskPayload) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changeStatus: (id: string, payload: ChangeTaskStatusPayload) =>
    request<{ message: string }>(`/tasks/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleChecklist: (taskId: string, checklistId: string, isCompleted: boolean) =>
    request<TaskChecklistItem>(`/tasks/${taskId}/checklists/${checklistId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
    }),

  addComment: (taskId: string, content: string) =>
    request<TaskComment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

export const deadlineApi = {
  getDeadlines: () => request<Deadline[]>('/deadlines'),

  getDeadline: (id: string) => request<Deadline>(`/deadlines/${id}`),

  createDeadline: (payload: CreateDeadlinePayload) =>
    request<Deadline>('/deadlines', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDeadline: (id: string, payload: UpdateDeadlinePayload) =>
    request<Deadline>(`/deadlines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  toggleComplete: (id: string, isCompleted: boolean) =>
    request<{ message: string }>(`/deadlines/${id}/toggle-complete`, {
      method: 'POST',
      body: JSON.stringify({ isCompleted }),
    }),
};

export const documentApi = {
  getDocuments: (params?: DocumentFilterParams) => {
    const query = new URLSearchParams();
    if (params?.matterId) query.set('matterId', params.matterId);
    if (params?.folderId) query.set('folderId', params.folderId);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.isDeleted !== undefined) query.set('isDeleted', String(params.isDeleted));
    if (params?.isSensitive !== undefined) query.set('isSensitive', String(params.isSensitive));
    const qs = query.toString();
    return request<DocumentItem[]>(`/documents${qs ? `?${qs}` : ''}`);
  },

  getDocument: (id: string) => request<DocumentItem>(`/documents/${id}`),

  getFolders: (matterId?: string) =>
    request<DocumentFolder[]>(`/folders${matterId ? `?matterId=${matterId}` : ''}`),

  createFolder: (payload: { matterId: string; name: string }) =>
    request<DocumentFolder>('/folders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  uploadDocument: (payload: UploadDocumentPayload) =>
    request<DocumentItem>('/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  uploadNewVersion: (id: string, payload: UploadNewVersionPayload) =>
    request<DocumentItem>(`/documents/${id}/versions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  restoreVersion: (id: string, versionNumber: number, comment?: string) =>
    request<DocumentItem>(`/documents/${id}/restore-version`, {
      method: 'POST',
      body: JSON.stringify({ versionNumber, comment }),
    }),

  changeStatus: (id: string, status: DocumentStatus) =>
    request<DocumentItem>(`/documents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updatePermissions: (id: string, payload: UpdateDocumentPermissionsPayload) =>
    request<DocumentItem>(`/documents/${id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  softDelete: (id: string, reason?: string) =>
    request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),

  restoreFromRecycleBin: (id: string) =>
    request<DocumentItem>(`/documents/${id}/restore`, {
      method: 'POST',
    }),

  permanentPurge: (id: string, confirmationWord: string) =>
    request<{ message: string }>(`/documents/${id}/purge`, {
      method: 'DELETE',
      body: JSON.stringify({ confirmationWord }),
    }),

  requestSignedDownloadUrl: (id: string, versionNumber?: number) =>
    request<SignedUrlResponse>(`/documents/${id}/signed-download`, {
      method: 'POST',
      body: JSON.stringify({ versionNumber }),
    }),

  getDocumentActivities: (id: string) => request<DocumentActivity[]>(`/documents/${id}/activities`),
};
