# LPMS — Implementation Checklist

`require.md` là nguồn yêu cầu chính; ADR-006 chốt Vercel + Supabase + Cloudflare. File này là bảng bàn giao để nhiều người/agent có thể triển khai song song mà không chồng chéo.

## Quy ước trạng thái

- `[x]` Hoàn thành và đã kiểm tra
- `[~]` Đã có khung, cần hoàn thiện
- `[ ]` Chưa bắt đầu
- `[!]` Bị chặn bởi môi trường hoặc cần quyết định

## Hoàn thành — Phase 1: Project Foundation

- [x] Monorepo npm workspaces: `apps/web`, `apps/api`, `packages/*`
- [x] Next.js App Router skeleton và trang foundation
- [x] NestJS API với prefix `/api/v1`
- [x] Health endpoint: `GET /api/v1/health`
- [x] API response gồm `data` và `meta.requestId`/`meta.timestamp`
- [x] Request ID, HTTP error envelope, validation pipe, Helmet và CORS baseline
- [~] Cấu hình Docker Compose/Nginx cũ chỉ còn là local-dev legacy; không dùng cho production
- [x] `.env.example`, `.gitignore`, README local setup
- [x] Prisma baseline: User, Role, Permission, UserRole, RolePermission, RefreshSession
- [x] Seed 10 role hệ thống
- [x] CI workflow: format, lint, typecheck, test, build
- [x] `format:check`, lint, typecheck, test, API build, web build và Prisma schema validate đã pass
- [x] API build output được tách vào `apps/api/dist/compiled` và script start dùng đúng entrypoint, tránh artifact stale

## Môi trường còn thiếu

- [!] Tạo Supabase project development/staging/production độc lập (cần tài khoản/credential ngoài workspace).
- [!] Tạo Cloudflare R2 private bucket và scoped S3 API token (cần tài khoản/credential ngoài workspace).
- [!] Cấu hình Vercel Environment Variables cho từng môi trường (cần quyền project ngoài workspace).
- [~] Tạo migration đầu tiên và chạy qua direct/session connection, không qua request production (migration đã có; Supabase credentials còn thiếu).
- [~] Cấu hình Vercel Queue topic/consumer và smoke test (consumer/trigger/idempotency đã có; live smoke còn chờ deployment).

## Workstream có thể làm song song ngay

### A. Authentication và session — Phase 2

**Phạm vi thư mục:** `apps/api/src/modules/auth/**`, `apps/web/app/(auth)/**`, bổ sung schema Prisma liên quan Auth khi cần.

- [x] Login email/password, bcrypt cost >= 12
- [x] Access/refresh token cookie HttpOnly, Secure, SameSite
- [x] Refresh token rotation; hash token trong `refresh_sessions`
- [x] Logout current device, logout all devices, admin revoke sessions
- [x] TOTP MFA và recovery codes đã mã hóa
- [x] Password reset token dùng một lần, có hạn
- [x] Login rate limit, lock/throttle brute-force, generic error chống enumeration
- [x] Audit: login thành công/thất bại, logout, revoke session
- [x] Prisma auth repository: users, refresh sessions, reset tokens, auth audit và MFA secret encrypted at rest
- [x] Unit/API/authorization tests
- [x] UI: Login, MFA verification, forgot/reset password, session management

### B. Design system và app shell — UI foundation

**Phạm vi thư mục:** `apps/web/components/**`, `apps/web/app/(app)/**`, `packages/ui/**`.

- [x] Chốt tokens màu sắc, typography, spacing, trạng thái focus/accessibility
- [x] App shell responsive: sidebar, header, breadcrumbs, mobile navigation
- [x] Main navigation: Dashboard, Clients, Matters, Tasks, Calendar, Documents, Notifications, Reports, Administration
- [~] Reusable UI: button, input, select, table, badge, empty/loading/error states, pagination, confirmation dialog, toast
- [x] TanStack Query provider và API client/error handling tập trung
- [x] React Hook Form + Zod form convention
- [x] Không đặt business API calls rải rác trong page component

### C. RBAC và organization — Phase 3

**Phạm vi thư mục:** `apps/api/src/modules/{users,organization,authorization}/**`, `apps/web/app/(app)/administration/**`.

- [x] Department, Position, user profile và user administration schema/migration
- [x] Permission guard/decorator và permission lookup service
- [x] Quản lý role/permission configurable
- [x] User suspend/reactivate và revoke session liên quan
- [x] Audit permission/user changes
- [x] Administration UI và tests (Users, Organization, Roles/RBAC matrix)

## Các phase tuần tự theo nghiệp vụ

### Phase 4 — Client & Intake

- [x] Clients, contacts, client relations và migration
- [x] CRUD, validation, pagination/search/filter (Frontend client & intake workflow)
- [x] Individual/corporate intake UI (Directory, New Intake form, Detail tabs)
- [~] Authorization và audit tests (unit/ID boundary đã có; staging database e2e còn chờ)

### Phase 5 — Conflict Check

- [x] Conflict check/result schema và search matching
- [x] Review/decision workflow cho Partner/Managing Partner
- [x] UI kết quả, review và audit (Sổ lệnh tra cứu, Form quét mới, Thẩm duyệt Managing Partner & Quyết định Ethical Wall)

### Phase 6 — Matter (core)

- [x] Matter, practice area, member, party, status history schema
- [x] Matter code generation và folder initialization transaction
- [x] Matter membership + confidentiality guard
- [~] `RESTRICTED`: whitelist bắt buộc, chống enumeration 403/404 (Prisma repository scope + permission unit tests đã có; staging e2e còn chờ)
- [x] Matter directory, intake form, 10 status workflow, và phân loại 4 cấp bảo mật RESTRICTED whitelist UI
- [x] Matter detail tabs UI: Overview, Tasks, Deadlines, Documents, Parties, Notes, Activity (Mục 74 require.md)
- [~] IDOR tests: user của Matter A không truy cập Matter B (resource boundary đã truyền context và có unit tests; staging e2e còn chờ)

### Phase 7 — Tasks & Deadlines

- [x] Task, checklist, comment, dependency, deadline schema/API
- [x] Assignment, status workflow, overdue calculation
- [~] Reminder queue qua Vercel Queues (consumer, deterministic reminder producer và idempotency đã có; live smoke còn chờ deployment)
- [x] Task/deadline UI, filters và pagination (Danh sách việc, tương tác checklist, bình luận, quản lý hạn tố tụng Tòa/VIAC, 5 mốc nhắc nhở)

### Phase 8 — Document Management

- [x] Folder, document, version, document permission schema/API
- [~] S3/R2 upload validation: magic bytes, size limit, UUID storage key (signed URL boundary đã có; live bucket smoke còn chờ)
- [x] Versioning, soft delete/recycle bin, authorized permanent purge
- [x] Presigned download URL 5–15 phút sau authorization và audit contract
- [x] Document tree, upload/version history UI (Cấu trúc 9 thư mục chuẩn vụ việc Mục 24, upload kéo thả/magic bytes/antivirus Mục 25, lịch sử phiên bản không ghi đè và khôi phục tạo bản mới Mục 26, tải qua Signed URL 15 phút Mục 30, Thùng rác phục hồi/xóa vĩnh viễn kiểm soát từ khóa Mục 29)

### Phase 9–13

- [x] Calendar và calendar event (mock/Prisma CRUD, filtering và authorization đã có)
- [~] Notification in-app/email + Vercel Queues worker (in-app Prisma adapter và worker đã có; email/live smoke còn chờ)
- [x] Global search với permission filtering contract
- [x] Immutable audit log + activity timeline contract
- [x] Dashboard, operational reports
- [~] Backup, restore test và disaster-recovery runbook (runbook đã có; restore test thật cần staging credentials)

### Phase 14–15 — Staging/UAT và Production gate

- [~] Local UAT smoke: health/readiness, login cookie, `/me`, CRUD-read contracts, search/report/audit và queue idempotency đã pass; staging UAT còn chờ credentials.
- [x] Repeatable `npm run uat:smoke` runner kiểm tra API contracts, queue processed/duplicate và shared-secret boundary trong private environment.
- [x] `npm run deploy:preflight` kiểm tra cấu hình staging/production mà không in secret.
- [x] Vercel API serverless entrypoint (`apps/api/api/index.ts`) và project config dùng chung `createApp()`; deploy preview thật còn chờ project credentials.
- [!] Supabase migration/seed, R2 live smoke, Vercel preview deployment, restricted-resource UAT và backup restore rehearsal (blocked until external Supabase/R2/Vercel credentials are supplied).
- [!] Production deployment approval sau khi critical security, permission và restore gates pass (blocked by the staging gates above).

## Quy tắc phối hợp bắt buộc

- Không đổi kiến trúc đã chốt trong ADR-001…005 nếu chưa thêm ADR mới.
- `require.md` ưu tiên hơn các bản tóm tắt nếu có khác biệt.
- Không tự sửa file ngoài phạm vi workstream đang nhận.
- Không dùng `any`; controller chỉ parse/call service, business logic thuộc service/domain layer.
- Mọi endpoint theo ID phải kiểm tra authorization ở backend; UI ẩn nút không phải security control.
- Mọi thay đổi schema phải có Prisma migration, seed/test phù hợp và nêu rõ ảnh hưởng database.
- Mọi hành động nhạy cảm phải audit; không log password, token hoặc payload nhạy cảm.
- Trước khi bàn giao: chạy `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
