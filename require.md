# LEGAL PRACTICE MANAGEMENT SYSTEM — MASTER PROJECT SPECIFICATION

## 1. Tên dự án

Legal Practice Management System — LPMS

Loại hệ thống:

- Internal Web Application.
- Multi-user.
- Role-based.
- Matter-centric.
- Document-intensive.
- Security-sensitive.
- Có khả năng mở rộng thành Client Portal và AI Legal Assistant trong tương lai.

Mục đích:

Xây dựng hệ thống quản trị tập trung cho công ty luật, quản lý toàn bộ vòng đời:

Client → Conflict Check → Matter → Task → Deadline → Document → Communication → Time/Expense → Completion → Archive → Audit.

---

# 2. Nguyên tắc kiến trúc bắt buộc

## 2.1 Web-first

Ứng dụng chính phải là Web Application responsive.

Hỗ trợ:

- Windows desktop.
- Laptop.
- Mac.
- Tablet.
- Mobile browser.

Không phát triển desktop app native ở V1.

Có thể phát triển Desktop Companion trong tương lai cho:

- Scanner.
- Microsoft Word.
- Outlook.
- File synchronization.
- Digital signature.
- Local hardware.

## 2.2 Modular Monolith

V1 KHÔNG sử dụng microservices.

Backend được tổ chức theo module:

- Auth.
- User.
- Organization.
- Client.
- Conflict.
- Matter.
- Task.
- Calendar.
- Document.
- Search.
- Notification.
- Audit.
- Admin.

Các module phải độc lập về business logic nhưng chạy chung một backend.

## 2.3 Matter-centric

Matter là entity nghiệp vụ trung tâm.

Hầu hết dữ liệu nghiệp vụ phải có khả năng liên kết với Matter:

- Document.
- Task.
- Deadline.
- Note.
- Communication.
- User.
- Expense.
- Time Entry.
- Invoice.
- Audit event.

---

# 3. Technology Stack

## Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Component system có cấu trúc rõ ràng.
- React Query/TanStack Query hoặc giải pháp tương đương.
- React Hook Form.
- Zod validation.

## Backend

- Node.js LTS.
- NestJS.
- TypeScript.
- REST API.

## Database

- PostgreSQL.

## ORM

Ưu tiên:

- Prisma.

Nếu sử dụng ORM khác phải giải thích lý do trong ADR.

## Cache / Queue

- Vercel Queues cho các tác vụ bất đồng bộ có độ bền, retry và idempotency.
- Không dùng Redis/BullMQ trong kiến trúc production V1.
- Consumer chạy dưới Vercel Function; không giữ worker, queue consumer hay state trong RAM giữa các request.

## File Storage

Cloudflare R2 qua S3-compatible API.

- R2 là object storage mặc định duy nhất cho V1.
- API chỉ tạo presigned URL sau authorization và audit; browser không nhận R2 secret.

Không lưu toàn bộ binary document trực tiếp trong PostgreSQL.

## Deployment

- **Vercel:** Next.js web và NestJS API theo Node.js serverless functions.
- **Supabase:** PostgreSQL 16+ managed; Prisma là ORM và migration tool.
- **Cloudflare:** DNS, Turnstile, R2; WAF được bật theo môi trường production sau khi xác minh cookie/API behavior.
- Không dùng Kubernetes, Nginx, Docker Compose hay server/worker chạy liên tục trong production V1.
- Docker Compose chỉ là tùy chọn local-dev, không phải mục tiêu deployment hay exit criterion.

---

# 4. Repository Structure

Ưu tiên monorepo:

```text
lpms/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── config/
│   └── shared/
│
├── infrastructure/
│   ├── vercel/
│   ├── cloudflare/
│   └── scripts/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── security/
│   └── adr/
│
├── tests/
│
├── vercel.json
├── README.md
├── PROJECT_SPEC.md
└── SECURITY.md
```

---

# 5. Environment

Phải có tối thiểu:

```text
development
staging
production
```

Không dùng production database cho development.

Không sử dụng production documents để test.

Environment secrets không được commit vào Git.

Cung cấp:

```text
.env.example
```

nhưng không chứa credential thật.

---

# 6. User Roles

Các role mặc định:

### SYSTEM_ADMIN

Quản trị kỹ thuật.

### MANAGING_PARTNER

Quản trị cấp cao toàn công ty.

### PARTNER

Quản lý Matter và team được cấp quyền.

### LAWYER

Xử lý Matter được giao.

### PARALEGAL

Hỗ trợ Matter.

### INTERN

Quyền giới hạn.

### ACCOUNTANT

Billing/expense/payment.

### ADMIN_STAFF

Hành chính.

### RECEPTIONIST

Client intake cơ bản.

### EXTERNAL_COLLABORATOR

Chỉ xem Matter được chỉ định.

Role phải configurable.

---

# 7. Permission Model

Không được chỉ sử dụng Role Based Access Control đơn giản.

Phải kết hợp:

RBAC + Resource Permission + Matter Membership.

Ví dụ:

User có role LAWYER

không đồng nghĩa với:

User được xem mọi Matter.

Permission format:

```text
matter.read
matter.create
matter.update
matter.archive

client.read
client.create
client.update

document.read
document.upload
document.download
document.update
document.delete
document.share

task.read
task.create
task.assign
task.update

audit.read

user.manage
role.manage
```

Backend phải kiểm tra authorization trên từng request.

Frontend hide button KHÔNG được xem là security control.

---

# 8. Authentication Module

## AUTH-001

Login bằng email + password.

## AUTH-002

Password phải được hash bằng thuật toán password hashing an toàn.

Không lưu plaintext password.

## AUTH-003

Hỗ trợ MFA.

Ưu tiên:

- TOTP.
- Authenticator app.

## AUTH-004

Password reset bằng token có thời hạn.

## AUTH-005

Token reset chỉ dùng được một lần.

## AUTH-006

Quản lý active sessions.

## AUTH-007

User có thể logout current device.

## AUTH-008

User có thể logout all devices.

## AUTH-009

Admin có thể revoke toàn bộ session của user.

## AUTH-010

Rate limit login.

## AUTH-011

Ghi audit failed login.

## AUTH-012

Temporarily lock hoặc throttle khi brute-force.

## AUTH-013

Không tiết lộ:

"Email này tồn tại."

Response reset-password phải tránh user enumeration.

---

# 9. Organization Management

Quản lý:

- Company.
- Branch.
- Department.
- Team.
- Position.
- Employee.

Employee fields:

- employeeCode.
- fullName.
- email.
- phone.
- department.
- position.
- manager.
- status.
- startDate.
- endDate.

Status:

```text
ACTIVE
SUSPENDED
RESIGNED
```

Khi user bị suspend:

- Không login được.
- Existing sessions bị revoke.

---

# 10. Client Management

Hai loại:

```text
INDIVIDUAL
ORGANIZATION
```

## Individual Client

Thông tin có thể gồm:

- Client code.
- Full name.
- Date of birth.
- Nationality.
- ID/passport.
- Address.
- Email.
- Phone.
- Occupation.
- Company.
- Notes.

## Corporate Client

- Client code.
- Vietnamese name.
- English name.
- Short name.
- Enterprise number.
- Tax code.
- Address.
- Country.
- Legal representative.
- Phone.
- Email.
- Website.
- Industry.
- Notes.

Có related contacts.

Có related organizations.

Có relationship:

- Parent company.
- Subsidiary.
- Shareholder.
- Director.
- Representative.
- Related company.

---

# 11. Client Intake

Workflow:

```text
NEW
↓
IN_REVIEW
↓
CONFLICT_CHECK
↓
APPROVED
↓
ACTIVE
```

Hoặc:

```text
REJECTED
```

Không mở Matter chính thức trước khi conflict check hoàn thành nếu policy công ty yêu cầu.

---

# 12. Conflict of Interest Module

Đây là module bắt buộc.

Khi tạo Client/Matter:

Hệ thống tìm:

- Existing client.
- Previous client.
- Related company.
- Director.
- Shareholder.
- Opposing party.
- Related person.
- Similar organization name.

Status:

```text
NO_CONFLICT
POTENTIAL_CONFLICT
CONFIRMED_CONFLICT
```

Potential Conflict yêu cầu review.

Lưu:

- Người check.
- Thời gian.
- Search terms.
- Kết quả.
- Decision.
- Reviewer.
- Comment.

Không được overwrite history.

---

# 13. Matter Management

Matter fields tối thiểu:

```text
id
matterCode
name
description
clientId
practiceAreaId
matterType
responsiblePartnerId
responsibleLawyerId
status
priority
confidentialityLevel
openDate
expectedCloseDate
closeDate
createdAt
updatedAt
```

Matter Code:

```text
MAT-YYYY-000001
```

Phải unique.

---

# 14. Matter Status

Default:

```text
INTAKE
CONFLICT_CHECK
PROPOSAL
ACTIVE
WAITING_CLIENT
WAITING_AUTHORITY
ON_HOLD
COMPLETED
CLOSED
ARCHIVED
```

Status configurable trong tương lai.

Mọi thay đổi status phải log.

---

# 15. Matter Members

Matter có:

- Responsible Partner.
- Responsible Lawyer.
- Members.
- Assistants.
- External collaborator.

Matter Membership xác định ai được truy cập Matter.

Admin có thể thêm/xóa member.

Mọi permission change phải audit.

---

# 16. Confidentiality Level

Matter hỗ trợ:

```text
NORMAL
CONFIDENTIAL
HIGHLY_CONFIDENTIAL
RESTRICTED
```

Matter RESTRICTED chỉ user được whitelist mới được truy cập.

Partner role không mặc định bypass RESTRICTED Matter.

---

# 17. Matter Parties

Matter có thể chứa:

- Client.
- Opposing party.
- Related party.
- Authority.
- Court.
- Arbitrator.
- Witness.
- Representative.
- Other.

Party có thể link đến Client/Contact hoặc tồn tại độc lập.

---

# 18. Practice Area

Admin quản lý:

- Corporate.
- Investment.
- FDI.
- M&A.
- Labor.
- Tax.
- Intellectual Property.
- Litigation.
- Real Estate.
- Licensing.
- Compliance.
- Contract.

Không hard-code danh sách vào frontend.

---

# 19. Task Management

Task fields:

```text
id
title
description
matterId
assigneeId
reviewerId
priority
status
startDate
dueDate
estimatedMinutes
actualMinutes
createdBy
createdAt
updatedAt
```

Status:

```text
TODO
IN_PROGRESS
WAITING
REVIEW
COMPLETED
CANCELLED
```

Priority:

```text
LOW
NORMAL
HIGH
URGENT
```

---

# 20. Task Features

Phải hỗ trợ:

- Assignment.
- Reassignment.
- Due date.
- Checklist.
- Comments.
- Attachment.
- Watchers.
- Reviewer.
- Dependencies.
- Activity history.

Task overdue tự động đánh dấu.

Task completed phải lưu:

- completedAt.
- completedBy.

---

# 21. Deadline Management

Deadline không nên chỉ là Task.

Entity riêng:

```text
Deadline
```

Loại:

- Filing deadline.
- Government deadline.
- Court deadline.
- Contract expiry.
- License expiry.
- Renewal.
- Client deadline.
- Internal deadline.

Reminder configurable:

```text
30 days
15 days
7 days
3 days
1 day
custom
```

---

# 22. Calendar

Calendar hiển thị:

- Tasks.
- Deadlines.
- Meetings.
- Hearings.
- Events.

Views:

- Month.
- Week.
- Day.
- Agenda.

Filter:

- User.
- Matter.
- Department.
- Event type.

---

# 23. Document Management System

Document phải là module lõi.

Không chỉ là file upload.

Entities:

```text
Folder
Document
DocumentVersion
DocumentPermission
DocumentActivity
```

---

# 24. Matter Folder

Mỗi Matter tự sinh folder mặc định:

```text
01 Client Documents
02 Legal Research
03 Drafts
04 Internal Review
05 Client Review
06 Signed Documents
07 Submission
08 Authority Response
09 Final
```

Admin có thể sửa template.

---

# 25. Document Upload

Hỗ trợ:

- Drag & drop.
- Multiple upload.
- Progress indicator.
- File size validation.
- Extension validation.
- MIME validation.
- Virus/malware scanning nếu hạ tầng hỗ trợ.

Không tin filename từ client.

---

# 26. Document Versioning

Không overwrite bản cũ.

Ví dụ:

```text
Contract.docx
v1
v2
v3
v4
```

Version lưu:

- Version number.
- File key.
- File size.
- Hash.
- Uploaded by.
- Uploaded at.
- Comment.

Có chức năng restore previous version.

Restore phải tạo version mới, không xóa lịch sử.

---

# 27. Document Status

```text
DRAFT
INTERNAL_REVIEW
CLIENT_REVIEW
APPROVED
SIGNED
FINAL
ARCHIVED
```

---

# 28. Document Permission

Permission:

```text
VIEW
DOWNLOAD
UPLOAD_VERSION
EDIT_METADATA
MOVE
DELETE
SHARE
```

Sensitive documents có thể:

- Không cho download.
- Chỉ cho Partner.
- Chỉ whitelist user.
- Có watermark.

---

# 29. Document Delete

Không hard-delete trực tiếp.

Sử dụng:

```text
Soft Delete
```

Có recycle bin.

Admin có thể restore.

Permanent deletion phải:

- Có quyền đặc biệt.
- Confirmation.
- Audit log.

---

# 30. File Download

Flow:

```text
User
↓
API Request
↓
Authentication
↓
Matter Permission
↓
Document Permission
↓
Audit
↓
Short-lived Signed URL
↓
Object Storage
```

Không tạo permanent public URL.

---

# 31. Search

Global search phải tìm được:

- Client.
- Contact.
- Matter.
- Task.
- Document metadata.

Filter:

- Date.
- Practice Area.
- Matter.
- Client.
- Lawyer.
- Status.
- Document type.

P2:

Full-text search document content.

---

# 32. Notes

Matter có internal notes.

Note:

- Author.
- Created date.
- Updated date.
- Content.
- Visibility.

Có thể restricted.

Edit note phải lưu activity history.

---

# 33. Communication

P1:

Cho phép manually log:

- Phone.
- Meeting.
- Email.
- Client communication.

P2:

Integrate Gmail/Outlook.

Email có thể link vào Matter.

---

# 34. Notification

In-app notification.

Notification events:

- Matter assigned.
- Task assigned.
- Task reassigned.
- Due soon.
- Overdue.
- Deadline approaching.
- Document uploaded.
- Review requested.
- Permission granted.
- Comment mentioned.

User có notification preferences.

---

# 35. Notification Delivery

P1:

- In-app.
- Email.

P2:

- Browser push.
- Microsoft Teams.
- Slack.

---

# 36. Audit Logging

Audit module bắt buộc.

Log tối thiểu:

```text
user
action
resourceType
resourceId
timestamp
ip
userAgent
requestId
metadata
```

Actions:

- LOGIN_SUCCESS.
- LOGIN_FAILED.
- LOGOUT.
- CREATE.
- VIEW_SENSITIVE.
- UPDATE.
- DELETE.
- RESTORE.
- DOWNLOAD.
- UPLOAD.
- SHARE.
- PERMISSION_CHANGE.
- EXPORT.
- ARCHIVE.

Audit log không cho normal user edit/delete.

---

# 37. Audit Search

Admin/authorized user có thể lọc:

- User.
- Date.
- Matter.
- Client.
- Action.
- IP.
- Resource.

Export audit log phải được audit ngược lại.

---

# 38. Activity Timeline

Matter có timeline:

```text
Matter created
Task assigned
Document uploaded
Status changed
Comment added
Deadline created
Document downloaded
Matter completed
```

Timeline lấy từ event/activity data.

---

# 39. Dashboard

Trang Home không được chỉ toàn chart.

Ưu tiên operational information.

### My Work

- Tasks today.
- Overdue tasks.
- Upcoming deadlines.
- Matters assigned.

### Management

- Active matters.
- Matters by status.
- Overdue matters.
- Workload.
- Recently opened matters.

---

# 40. Reports

P1:

- Matter count.
- Client count.
- Matter by status.
- Matter by Practice Area.
- Task completion.
- Overdue tasks.
- Workload by lawyer.

P2:

- Billable time.
- Revenue.
- Expense.
- Profitability.

---

# 41. Time Tracking — Phase 2

Time Entry:

```text
matterId
taskId
userId
description
duration
date
billable
rate
```

Cho phép:

- Manual input.
- Timer.
- Approval.

---

# 42. Expense — Phase 2

Expense:

- Matter.
- Type.
- Amount.
- Currency.
- Date.
- Description.
- Receipt.
- Paid by.
- Billable/non-billable.

---

# 43. Billing — Phase 2

Fee models:

```text
FIXED_FEE
HOURLY
RETAINER
MILESTONE
MONTHLY
```

Entities:

- Invoice.
- InvoiceItem.
- Payment.

Không xây accounting system hoàn chỉnh trong LPMS.

---

# 44. Knowledge Management — Phase 2

Knowledge Base chứa:

- Contract templates.
- Legal memo.
- Precedents.
- Legal research.
- Clause library.
- Internal guideline.
- Checklist.

Có:

- Category.
- Tags.
- Version.
- Owner.
- Reviewer.
- Approved status.

---

# 45. Workflow Engine — Phase 2

Admin có thể tạo workflow template.

Ví dụ:

```text
FDI Establishment
↓
Collect documents
↓
Legal review
↓
Draft IRC
↓
Internal review
↓
Client approval
↓
Submission
↓
Follow-up
↓
Result
```

Khi tạo Matter:

System có thể generate task từ template.

---

# 46. Client Portal — Phase 3

Portal riêng cho client.

Client chỉ được xem dữ liệu thuộc mình.

Có:

- Matter status.
- Documents.
- Upload.
- Request.
- Message.
- Invoice.
- Approval.

Không reuse internal permission một cách thiếu kiểm soát.

---

# 47. AI Module — Phase 3

AI chỉ được phát triển sau khi core system ổn định.

Possible features:

- Document summarization.
- OCR.
- Information extraction.
- Contract comparison.
- Legal document comparison.
- Semantic search.
- Matter Q&A.
- Knowledge Base Q&A.

AI phải tôn trọng Matter Permission.

AI không được lấy document mà current user không có quyền xem.

---

# 48. AI/RAG Architecture

Future architecture:

```text
Document
↓
Text extraction
↓
Chunking
↓
Embedding
↓
Vector Database
↓
Permission Filter
↓
Retrieval
↓
LLM
```

Permission filtering phải xảy ra trước khi context được gửi đến model.

---

# 49. Database Entities

V1 dự kiến tối thiểu:

```text
users
roles
permissions
user_roles
role_permissions

organizations
branches
departments
positions

clients
contacts
client_contacts
client_relations

practice_areas

matters
matter_members
matter_parties
matter_status_history

conflict_checks
conflict_results

tasks
task_comments
task_checklists
task_dependencies

deadlines
calendar_events

folders
documents
document_versions
document_permissions

notes

notifications

audit_logs

refresh_sessions

system_settings
```

Phase 2:

```text
communications
emails
time_entries
expenses
invoices
invoice_items
payments

workflow_templates
workflow_steps

knowledge_articles
knowledge_versions
```

---

# 50. Database Rules

Mọi bảng nghiệp vụ phải có khi phù hợp:

```text
id
createdAt
createdBy
updatedAt
updatedBy
```

Soft delete:

```text
deletedAt
deletedBy
```

Không reuse deleted ID.

Foreign key phải rõ ràng.

Không tạo quan hệ database mơ hồ.

Unique constraints phải đặt ở database, không chỉ application.

---

# 51. Database Migration

Mọi schema change phải thông qua migration.

Không manually sửa production DB.

Migration phải commit vào Git.

Production migration phải backup trước nếu migration có rủi ro.

---

# 52. API Standard

Prefix:

```text
/api/v1
```

Ví dụ:

```text
POST   /api/v1/auth/login
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/clients/:id

GET    /api/v1/matters
POST   /api/v1/matters
GET    /api/v1/matters/:id

GET    /api/v1/matters/:id/documents

POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id
```

---

# 53. API Response

Response format nhất quán.

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "MATTER_ACCESS_DENIED",
    "message": "Access denied"
  }
}
```

Không leak stack trace ở production.

---

# 54. Pagination

Mọi endpoint list lớn phải pagination.

Không trả hàng chục nghìn row.

Có thể sử dụng:

- cursor pagination;
- hoặc page/limit tùy use case.

---

# 55. Validation

Frontend validation để UX.

Backend validation là bắt buộc.

Không tin:

- Browser.
- Frontend.
- Request body.
- Query params.
- Filename.
- MIME declared by client.

---

# 56. Security Baseline

Security development phải theo OWASP ASVS.

Bao gồm tối thiểu:

- Authentication.
- Authorization.
- Session management.
- Input validation.
- Output encoding.
- Cryptography.
- File handling.
- API protection.
- Logging.
- Data protection.
- Configuration security.

---

# 57. Authorization Security

Phòng chống IDOR/Broken Access Control.

Ví dụ request:

```text
GET /matters/1234
```

Backend phải xác nhận:

Current User ∈ Matter 1234

hoặc có explicit global privilege.

Không dựa vào ID khó đoán.

---

# 58. PostgreSQL RLS

Có thể triển khai Row-Level Security cho bảng đặc biệt nhạy cảm như lớp defense-in-depth.

Không dùng RLS thay cho application-level authorization.

---

# 59. Session Security

Session/token phải:

- Có expiration.
- Có revocation.
- Có rotation.
- Có secure storage.

Nếu cookie:

- HttpOnly.
- Secure.
- SameSite phù hợp.

---

# 60. Encryption

Data in transit:

```text
TLS/HTTPS
```

Data at rest:

- Database encryption do infrastructure cung cấp.
- Object storage encryption.
- Encrypted backup.

Highly sensitive fields có thể application-level encrypt.

---

# 61. Secret Management

Không commit:

- JWT secret.
- Database password.
- API key.
- SMTP credential.
- Storage secret.

Không hard-code secrets.

---

# 62. File Security

File upload phải kiểm tra:

- Allowed extension.
- MIME.
- Maximum size.
- Malware.
- Path traversal.
- Duplicate/hash nếu cần.

Không execute uploaded file.

---

# 63. Rate Limiting

Áp dụng ít nhất cho:

- Login.
- Forgot password.
- OTP.
- Search expensive.
- File download.
- Public endpoints.

---

# 64. Security Headers

Configure appropriate security headers.

Bao gồm:

- Content Security Policy.
- X-Content-Type-Options.
- Frame restrictions.
- Referrer Policy.

---

# 65. CORS

Không dùng:

```text
Access-Control-Allow-Origin: *
```

cho authenticated production API.

Whitelist frontend origin.

---

# 66. Logging

Application log cần:

- requestId.
- timestamp.
- level.
- module.
- event.

Không log plaintext:

- Password.
- Access token.
- Refresh token.
- Sensitive document contents.

---

# 67. Backup

Backup:

- PostgreSQL.
- Object storage.
- System configuration.

Backup tự động.

Backup encrypted.

Backup phải có retention policy.

---

# 68. Restore Testing

Backup chưa đủ.

Phải định kỳ test:

```text
Backup
↓
Restore
↓
Integrity validation
```

Document procedure trong:

```text
docs/disaster-recovery.md
```

---

# 69. Disaster Recovery

Xác định:

```text
RPO
RTO
```

Cho V1 có thể đặt mục tiêu ban đầu:

```text
RPO <= 1 hour
RTO <= 4 hours
```

Có thể điều chỉnh theo hạ tầng.

---

# 70. Monitoring

Theo dõi:

- API availability.
- Response time.
- Error rate.
- CPU.
- RAM.
- Disk.
- Supabase PostgreSQL và connection pool usage.
- Vercel Function duration/error rate và Vercel Queue delivery/retry.
- Cloudflare R2 storage, access error và egress.
- Backup status.

---

# 71. Security Monitoring

Alert:

- Excessive failed logins.
- Large bulk download.
- Suspicious permission changes.
- Backup failure.
- Unusual admin action.

---

# 72. UI Layout

Desktop layout:

```text
┌──────────────────────────────────────┐
│ Top Bar                              │
├──────────────┬───────────────────────┤
│ Sidebar      │ Main Content          │
│              │                       │
│ Dashboard    │                       │
│ Clients      │                       │
│ Matters      │                       │
│ Tasks        │                       │
│ Calendar     │                       │
│ Documents    │                       │
│ Knowledge    │                       │
│ Reports      │                       │
│ Admin        │                       │
└──────────────┴───────────────────────┘
```

---

# 73. Main Navigation

V1:

```text
Dashboard
Clients
Matters
Tasks
Calendar
Documents
Notifications
Reports
Administration
```

---

# 74. Matter Detail Screen

Tabs:

```text
Overview
Tasks
Deadlines
Documents
Parties
Notes
Activity
```

P2:

```text
Communication
Time
Expense
Billing
```

---

# 75. UX Requirements

Phải:

- Responsive.
- Keyboard accessible ở mức hợp lý.
- Loading state.
- Empty state.
- Error state.
- Confirmation cho destructive action.
- Toast/feedback.
- Breadcrumb.
- Search.
- Sorting.
- Filter.
- Pagination.

Không sử dụng modal cho mọi tác vụ.

---

# 76. Accessibility

Forms phải:

- Có label.
- Keyboard navigation.
- Focus state.
- Validation message rõ ràng.

Không chỉ dùng màu để truyền đạt trạng thái.

---

# 77. Performance

Target ban đầu:

Typical API request:

```text
p95 < 500 ms
```

không tính heavy document processing.

Danh sách phải pagination.

Không N+1 query.

Database index cho field thường search/filter.

---

# 78. Scalability

Thiết kế ban đầu ít nhất phù hợp:

```text
10 users
↓
50 users
↓
200 users
```

mà không phải viết lại toàn bộ architecture.

Không tối ưu premature cho hàng triệu concurrent users.

---

# 79. Background Jobs

Các việc bất đồng bộ chạy Vercel Queues:

- Email.
- OCR.
- Document processing.
- Virus scanning.
- Notification.
- Search indexing.
- Report export.

Không block API request.

---

# 80. Testing Strategy

Bắt buộc:

### Unit Test

Business logic quan trọng.

### Integration Test

Database/repository/service.

### API Test

Endpoints.

### Authorization Test

Đặc biệt quan trọng.

### E2E Test

Critical user flows.

### Security Test

Core controls.

---

# 81. Permission Tests

Ví dụ bắt buộc:

User A thuộc Matter A.

User A request Matter B.

Expected:

```text
403
```

User A request Document B.

Expected:

```text
403
```

User A thay ID trên URL.

Expected:

```text
403/404
```

---

# 82. Critical E2E Flows

E2E-001:

```text
Login
→ Client
→ Conflict Check
→ Matter
→ Task
→ Document
→ Complete Matter
```

E2E-002:

```text
Create Matter
→ Add Lawyer
→ Lawyer sees Matter
→ Remove Lawyer
→ Lawyer loses access
```

E2E-003:

```text
Upload Document
→ Version 2
→ Restore Version
→ Verify history
```

---

# 83. Code Quality

TypeScript strict mode.

Không:

```text
any
```

tràn lan.

Không bỏ error bằng empty catch.

Không hard-code business constants lung tung.

Không copy logic giữa controller.

Business logic nằm service/domain layer.

---

# 84. API Architecture

Controller:

- Parse request.
- Call service.
- Return response.

Service:

- Business logic.
- Authorization orchestration.

Repository:

- Database operations nếu architecture sử dụng repository.

Controller không chứa business logic lớn.

---

# 85. Frontend Architecture

Không để một page component 2.000 dòng.

Tách:

- components.
- features.
- hooks.
- services.
- schemas.
- types.

Business API calls không rải lung tung trong UI component.

---

# 86. Error Handling

Centralized backend exception handling.

Frontend có centralized API error handling.

User-facing error phải rõ ràng.

Technical detail chỉ log ở server.

---

# 87. Git Workflow

Branches:

```text
main
develop
feature/*
fix/*
```

Hoặc trunk-based nếu team chọn.

Không push trực tiếp production code thiếu review.

Commit rõ nghĩa.

---

# 88. Pull Request

PR phải có:

- Description.
- Requirement ID.
- Changed modules.
- Migration notice.
- Security impact.
- Test result.

---

# 89. CI Pipeline

Mỗi PR:

```text
Install
↓
Lint
↓
Type Check
↓
Unit Test
↓
Integration Test
↓
Build
↓
Security Scan
```

Fail bất kỳ bước nào:

Không merge.

---

# 90. CD Pipeline

```text
main
↓
Build image
↓
Staging
↓
Smoke Test
↓
Approval
↓
Production
```

Không auto-deploy production ngay từ V1 nếu chưa có quy trình rollback tốt.

---

# 91. Dependency Security

Có:

- Dependency scanning.
- Lockfile.
- Vulnerability monitoring.

Không auto-upgrade major version production.

---

# 92. Security Scanning

Nên có:

- Secret scanning.
- Dependency scanning.
- SAST.
- Container scan.

P2:

- DAST.

---

# 93. Documentation

Mỗi module phải có documentation.

Tối thiểu:

```text
README.md
PROJECT_SPEC.md
SECURITY.md

docs/
    architecture.md
    database.md
    permissions.md
    deployment.md
    backup.md
    disaster-recovery.md
```

---

# 94. Architecture Decision Records

Quyết định quan trọng phải tạo ADR.

Ví dụ:

```text
ADR-001 Modular Monolith
ADR-002 PostgreSQL
ADR-003 Object Storage
ADR-004 Authentication Strategy
ADR-005 Permission Model
```

AI không tự thay architecture mà không tạo ADR.

---

# 95. Seed Data

Development có seed:

- Admin.
- Partner.
- Lawyer.
- Example client.
- Example matter.

Không seed dữ liệu thật của khách hàng.

---

# 96. Demo Environment

Có staging/demo với fake data.

Không sử dụng production copy chưa anonymize.

---

# 97. Import / Export

P2:

Import:

- CSV Client.
- Contact.

Export phải permission controlled.

Export sensitive information phải audit.

---

# 98. Data Retention

Phải thiết kế framework cho retention policy.

Ví dụ:

- Active Matter.
- Closed Matter.
- Archived Matter.
- Audit log.
- Deleted file.

Không hard-delete toàn hệ thống chỉ bằng một cron đơn giản.

---

# 99. Database Audit Fields

Các entity nhạy cảm nên có:

```text
createdBy
updatedBy
deletedBy
```

Ngoài centralized audit log.

---

# 100. System Settings

Admin cấu hình:

- Company.
- Matter code format.
- Practice Areas.
- Task priorities.
- Folder templates.
- Deadline reminders.
- File size.
- Session timeout.

---

# 101. Feature Flags

Các module chưa hoàn thiện có thể dùng feature flags.

Không expose unfinished feature production.

---

# 102. Development Phase Plan

## PHASE 0 — REQUIREMENTS & ARCHITECTURE

Không code business feature.

Deliverables:

```text
PROJECT_SPEC.md
architecture.md
ERD
permission matrix
API conventions
folder structure
ADR-001...
```

Exit criteria:

Architecture được xác định rõ.

---

## PHASE 1 — PROJECT FOUNDATION

Build:

- Monorepo.
- Next.js.
- NestJS.
- Supabase PostgreSQL.
- Prisma.
- Vercel Queues.
- Cloudflare R2.
- Environment config.
- Logging.
- Health endpoint.

Exit criteria:

```text
web và API deploy preview trên Vercel
Supabase PostgreSQL kết nối qua Prisma pooler
Cloudflare R2 bucket private sẵn sàng
Vercel Queues có consumer smoke test
CI passing
```

---

## PHASE 2 — AUTHENTICATION

Build:

- User.
- Login.
- Logout.
- Password reset.
- Session.
- MFA.
- Rate limiting.
- Audit login.

Tests:

Authentication + security tests.

---

## PHASE 3 — RBAC & ORGANIZATION

Build:

- Role.
- Permission.
- Department.
- Employee.
- Permission guards.

Tests:

Authorization matrix.

---

## PHASE 4 — CLIENT

Build:

- Client CRUD.
- Individual client.
- Corporate client.
- Contact.
- Relations.
- Search/filter.

---

## PHASE 5 — CONFLICT CHECK

Build:

- Conflict search.
- Results.
- Review.
- Approval.
- History.

---

## PHASE 6 — MATTER

Build:

- Matter.
- Matter member.
- Party.
- Status.
- Confidentiality.
- Timeline.

Đây là phase quan trọng nhất.

---

## PHASE 7 — TASK & DEADLINE

Build:

- Tasks.
- Checklist.
- Comments.
- Deadlines.
- Notifications.
- Dashboard work list.

---

## PHASE 8 — DOCUMENT MANAGEMENT

Build:

- Folder.
- Upload.
- Object storage.
- Versions.
- Permissions.
- Download.
- Signed URL.
- Recycle bin.
- Document audit.

Không được rush phase này.

---

## PHASE 9 — CALENDAR

Build:

- Calendar.
- Deadline display.
- Event.
- Reminder.

---

## PHASE 10 — GLOBAL SEARCH

Build search cho:

- Client.
- Matter.
- Task.
- Document metadata.

---

## PHASE 11 — AUDIT & SECURITY HARDENING

Review:

- Permission.
- IDOR.
- Rate limits.
- Sessions.
- Security headers.
- Audit completeness.
- File security.

---

## PHASE 12 — BACKUP & DISASTER RECOVERY

Build:

- Database backup.
- File backup.
- Backup monitoring.
- Restore procedure.

Thực hiện restore test thật.

---

## PHASE 13 — REPORTING

Basic reports.

---

## PHASE 14 — STAGING / UAT

User Acceptance Testing.

Sửa bugs.

---

## PHASE 15 — PRODUCTION

Deploy.

Không triển khai nếu:

- Critical security test fail.
- Backup chưa test restore.
- Permission tests fail.

---

# 103. Phase 2 Development After MVP

Sau khi V1 ổn định mới làm:

- Workflow Engine.
- Email integration.
- Google/Microsoft Calendar.
- OCR.
- Full-text search.
- Knowledge Base.
- Time Tracking.
- Expense.
- Billing.
- Advanced Reports.

---

# 104. Phase 3

Sau Phase 2:

- Client Portal.
- RAG.
- AI Legal Assistant.
- E-signature.
- Office integration.
- Desktop Companion.
- Mobile/PWA improvements.

---

# 105. MVP Definition

MVP chính thức gồm:

1. Authentication + MFA.
2. Organization/User.
3. RBAC.
4. Client.
5. Conflict Check.
6. Matter.
7. Task.
8. Deadline.
9. Calendar.
10. Document Management.
11. Notification.
12. Search.
13. Audit.
14. Backup.
15. Basic Dashboard.
16. Basic Reports.

Không thêm feature ngoài phạm vi nếu chưa hoàn thành MVP.

---

# 106. Definition of Done

Một feature chỉ được DONE khi:

- Code hoàn thành.
- Type check pass.
- Lint pass.
- Unit test pass.
- Integration test pass nếu cần.
- Permission tested.
- Validation implemented.
- Error handling implemented.
- Audit implemented nếu liên quan.
- Documentation updated.
- No known critical security defect.

UI chạy được không đồng nghĩa feature DONE.

---

# 107. AI CODING RULES

AI phải tuân thủ các quy tắc sau.

## Rule 1

Không code toàn bộ dự án trong một lần.

Làm từng Phase.

## Rule 2

Trước mỗi phase:

Đọc:

```text
PROJECT_SPEC.md
architecture docs
existing code
database schema
ADRs
```

## Rule 3

Trước khi code, AI phải xuất:

```text
PHASE PLAN
FILES TO CREATE
FILES TO MODIFY
DATABASE CHANGES
API CHANGES
SECURITY IMPACT
TEST PLAN
```

Sau đó mới implement.

## Rule 4

Không tự ý đổi technology stack.

## Rule 5

Không tự ý đổi database architecture.

## Rule 6

Không tự ý xóa feature đã tồn tại.

## Rule 7

Không tạo duplicate service/component khi đã có implementation tương đương.

## Rule 8

Trước khi tạo file mới, search codebase.

## Rule 9

Không hard-code security bypass.

## Rule 10

Không để TODO cho security-critical code.

## Rule 11

Không fake authentication.

## Rule 12

Không mock authorization trong production path.

## Rule 13

Không bỏ test chỉ để build pass.

## Rule 14

Nếu test fail:

Sửa nguyên nhân.

Không xóa test.

## Rule 15

Database schema thay đổi phải migration.

## Rule 16

Migration không được tự ý xóa production data.

## Rule 17

Mọi endpoint Matter/Document phải kiểm tra permission.

## Rule 18

Không expose internal stack trace.

## Rule 19

Không commit secrets.

## Rule 20

Sau mỗi phase phải chạy:

```text
lint
typecheck
test
build
```

## Rule 21

AI phải báo cáo:

```text
COMPLETED
NOT COMPLETED
KNOWN ISSUES
SECURITY NOTES
HOW TO TEST
```

## Rule 22

Không chuyển sang phase tiếp theo khi phase hiện tại còn lỗi nghiêm trọng.

---

# 108. Master Instruction cho Coding AI

Bạn đang đóng vai trò Principal Software Architect + Senior Full-Stack Engineer + Application Security Engineer của dự án Legal Practice Management System.

PROJECT_SPEC.md là tài liệu có thẩm quyền cao nhất về kiến trúc và yêu cầu nghiệp vụ.

Bạn không được tự ý thay đổi architecture, technology stack, permission model hoặc data model nền tảng nếu chưa có lý do kỹ thuật rõ ràng và Architecture Decision Record.

Không được cố xây toàn bộ sản phẩm trong một lần.

Hãy làm chính xác phase được giao.

Trước khi viết code:

1. Đọc toàn bộ tài liệu liên quan.
2. Kiểm tra codebase hiện tại.
3. Xác định những gì đã tồn tại.
4. Xác định dependency.
5. Xác định database changes.
6. Xác định security implications.
7. Tạo implementation plan.
8. Tạo test plan.

Trong quá trình triển khai:

- Maintain TypeScript strictness.
- Không duplicate logic.
- Tuân thủ modular architecture.
- Validate toàn bộ external input.
- Enforce authorization tại backend.
- Viết migration cho schema changes.
- Ghi audit cho security-sensitive events.
- Không hard-code credentials.
- Không bypass authentication/authorization.
- Không xóa tests để làm CI pass.
- Không expose sensitive data trong log.
- Viết tests cho business logic và authorization.

Sau khi triển khai:

1. Run lint.
2. Run type check.
3. Run unit tests.
4. Run integration tests.
5. Run build.
6. Kiểm tra migration.
7. Kiểm tra authorization.
8. Kiểm tra security impact.

Cuối mỗi phase, báo cáo:

### IMPLEMENTED

Những gì đã hoàn thành.

### FILES CHANGED

Danh sách file chính.

### DATABASE CHANGES

Migration/schema.

### API CHANGES

Endpoint mới/thay đổi.

### SECURITY

Kiểm soát bảo mật đã triển khai.

### TESTS

Các tests đã chạy và kết quả.

### KNOWN ISSUES

Những vấn đề còn tồn tại.

### NEXT PHASE

Chỉ mô tả phase kế tiếp; không tự động triển khai phase kế tiếp.
