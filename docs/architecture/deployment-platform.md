# DEPLOYMENT PLATFORM — VERCEL, SUPABASE, CLOUDFLARE

## Quyết định nền tảng V1

LPMS sử dụng ba dịch vụ managed:

- **Vercel:** deploy Next.js web, NestJS API Node.js serverless functions và Vercel Queues.
- **Supabase:** PostgreSQL managed; Prisma là lớp truy cập dữ liệu duy nhất của backend.
- **Cloudflare:** DNS, Turnstile, Cloudflare R2 và WAF khi production đã được xác minh.

## Ranh giới trách nhiệm

```text
Browser -> Cloudflare DNS/Turnstile -> Vercel Web/API
                                      -> Supabase PostgreSQL
                                      -> Cloudflare R2
                                      -> Vercel Queues consumers
```

- Supabase Auth không được bật cho internal users khi NestJS vẫn là nguồn xác thực, MFA và session duy nhất.
- Cloudflare R2 bucket phải private. API xác thực quyền, ghi audit, rồi mới cấp presigned upload/download URL ngắn hạn.
- Vercel Functions phải stateless. Không lưu session, file, queue state hoặc Prisma client state nghiệp vụ trong RAM.
- Queue consumer có delivery at-least-once; mỗi handler phải idempotent và lưu trạng thái xử lý trong PostgreSQL khi cần.

## Prisma và Supabase pooling

- Runtime Vercel dùng Supavisor transaction pooler (`DATABASE_URL`, port 6543) với `pgbouncer=true` và connection limit thấp.
- Migration/administrative command dùng connection direct hoặc session pooler tách riêng (`DIRECT_URL`), không chạy trong request production.
- Prisma schema và migration vẫn là single source of truth; Supabase dashboard không được dùng để sửa schema production ngoài quy trình migration.

## Persistence rollout

- API local/mock mặc định dùng `PERSISTENCE_MODE=mock`; mode này không mở kết nối
  database và giữ cho contract test chạy độc lập.
- Chỉ staging/production đã có secrets mới bật `PERSISTENCE_MODE=prisma`.
- `GET /api/v1/health/ready` kiểm tra trạng thái persistence; deploy không được coi
  là ready nếu Prisma mode không truy vấn được `SELECT 1`.
- Migration đầu tiên (`apps/api/prisma/migrations/0001_auth_foundation`) bao phủ
  auth/RBAC/session/audit và các bảng MVP; repository runtime vẫn được nối theo
  từng module, không dùng `db push` để bỏ qua migration review.

## Secrets và môi trường

- Secret chỉ nằm trong Vercel Environment Variables theo `development`, `preview/staging`, `production`.
- `NEXT_PUBLIC_*` chỉ dành cho giá trị công khai; không đưa service-role key, DB password, R2 secret hay JWT secret vào frontend.
- Prisma mode phải có `AUTH_ENCRYPTION_KEY` riêng (không dùng lại JWT secret) để giải mã secret MFA trong repository Auth.
- Cloudflare DNS ban đầu dùng DNS-only cho domain Vercel; chỉ bật proxy/WAF sau khi test TLS, cookie HttpOnly và API streaming.

## Vercel project layout

- Web project root: `apps/web` (Next.js App Router and the queue trigger in
  `apps/web/app/api/queues/notifications/route.ts`, plus the daily reminder
  cron at `apps/web/app/api/cron/reminders/route.ts`).
- API project root: `apps/api`; `api/index.ts` is the serverless entrypoint and
  reuses `createApp()` from `src/main.ts`. `VERCEL=1` prevents the module from
  calling `listen()` during a function cold start.
- Both projects must receive their own environment variables in Vercel; the
  API project must never expose database, R2 or queue secrets as
  `NEXT_PUBLIC_*` values.
- Run `npm run deploy:preflight` from a private staging/production shell
  before migrations or deployment. The checker validates only names, formats,
  lengths and manifests; it never prints secret values.
