# LEGAL PRACTICE MANAGEMENT SYSTEM (LPMS) — MASTER SPECIFICATION

## 1. Tổng quan hệ thống
- **Tên dự án:** Legal Practice Management System (LPMS)
- **Kiểu hệ thống:** Internal Web Application, Responsive, Modular Monolith, Multi-user, Matter-centric, Document-intensive, Security-sensitive.
- **Phạm vi V1 (MVP):**
  1. Authentication & MFA
  2. Organization & User Management
  3. RBAC & Multi-layer Authorization
  4. Client Management & Intake
  5. Conflict of Interest Check
  6. Matter Management (Hạt nhân nghiệp vụ)
  7. Task Management & Checklists
  8. Deadline Management & Automatic Reminders
  9. Calendar System
  10. Document Management System (DMS, Versioning, Presigned URLs)
  11. Notification System (In-app, Email)
  12. Global Search
  13. Immutable Audit Logging
  14. Backup & Disaster Recovery Framework
  15. Operational Dashboard
  16. Basic Operational Reports

---

## 2. Nguyên tắc kiến trúc cốt lõi
1. **Web-first Responsive:**
   - Hoạt động mượt mà trên Desktop Windows, MacOS, iPad/Tablet, và Mobile browser. Không làm native app ở V1.
2. **Modular Monolith:**
   - Một backend NestJS duy nhất, chia theo các module nghiệp vụ tách biệt về domain logic, sẵn sàng tách service nếu mở rộng sau này.
3. **Matter-centric:**
   - Vụ việc (`Matter`) là trung tâm của mọi luồng dữ liệu (Documents, Tasks, Deadlines, Notes, Members, Parties, Audits đều liên kết với Matter).
4. **Defense in Depth Security:**
   - Kiểm tra quyền đa tầng: Role-based + Resource-level + Matter Membership.
   - Không tin cậy dữ liệu đầu vào từ client.
   - Audit log bất biến (append-only).

---

## 3. Quy chuẩn công nghệ (Technology Stack)
- **Frontend:** Next.js (App Router), React, TypeScript (Strict Mode), Tailwind CSS, TanStack Query, React Hook Form, Zod.
- **Backend:** Node.js LTS, NestJS, TypeScript, REST API (`/api/v1`).
- **Database & ORM:** Supabase PostgreSQL 16+, Prisma ORM.
- **Queue:** Vercel Queues (durable, retryable, at-least-once delivery); không dùng Redis/BullMQ ở production V1.
- **File Storage:** Cloudflare R2 qua S3-compatible API; bucket luôn private.
- **Runtime & Deployment:** Vercel Node.js serverless functions cho Next.js và NestJS API.
- **Edge & Security:** Cloudflare DNS, Turnstile và R2; WAF được cấu hình sau giai đoạn xác minh production.

---

## 4. Định nghĩa hoàn thành (Definition of Done — DoD)
Một tính năng chỉ được xem là hoàn thành khi:
1. Code hoàn tất, tuân thủ TypeScript strict mode, không lạm dụng `any`.
2. Lint và Typecheck 100% pass, không cảnh báo.
3. Unit test và Integration test liên quan pass.
4. Authorization & Permission test pass (đặc biệt là IDOR test).
5. Validation 2 đầu (Frontend UX + Backend Zod/DTO) hoàn chỉnh.
6. Centralized Error Handling & Logging đầy đủ.
7. Audit event được ghi nhận cho mọi hành động nhạy cảm.
8. Tài liệu kỹ thuật cập nhật tương ứng.
