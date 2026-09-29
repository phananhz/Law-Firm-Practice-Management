# ADR-006: VERCEL, SUPABASE VÀ CLOUDFLARE CHO NỀN TẢNG V1

## 1. Trạng thái

**ACCEPTED**

## 2. Bối cảnh

LPMS cần deployment managed, triển khai nhanh, không vận hành server, Redis, Nginx hay object-storage self-hosted trong V1. Hệ thống vẫn cần PostgreSQL quan hệ/ACID, file private, API Node.js và job bất đồng bộ đáng tin cậy.

## 3. Quyết định

1. Vercel host Next.js web, NestJS API Node.js serverless functions và Vercel Queues.
2. Supabase PostgreSQL là database production; Prisma tiếp tục là single source of truth cho schema/migration.
3. Cloudflare R2 là object storage private; Cloudflare quản lý DNS, Turnstile và WAF theo rollout.
4. NestJS tiếp tục là nguồn xác thực/ủy quyền duy nhất. Không dùng Supabase Auth cho internal application users.
5. Redis/BullMQ, Nginx và Docker Compose không nằm trong production architecture V1. Docker Compose chỉ có thể dùng làm local-dev tùy chọn.

## 4. Hệ quả

- **Thuận lợi:** giảm vận hành hạ tầng, deploy preview tự động, file storage chi phí/egress phù hợp, PostgreSQL managed và queue managed.
- **Ràng buộc:** API phải stateless; Prisma phải dùng Supabase transaction pooler trên Vercel; queue handler idempotent; tiến trình dài hoặc workload vượt giới hạn function phải được thiết kế lại hoặc có ADR mới.
