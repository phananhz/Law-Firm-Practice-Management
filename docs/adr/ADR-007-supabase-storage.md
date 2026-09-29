# ADR-007: Supabase Storage cho tài liệu private

## Trạng thái

Accepted — 2026-09-29.

## Quyết định

Supabase Storage là object storage mặc định cho V1. Bucket `lpms-documents`
phải private. NestJS kiểm tra JWT/RBAC và quyền tài liệu trước khi dùng
service-role key ở server để sinh signed upload/download URL ngắn hạn. Trình
duyệt không bao giờ nhận service-role key.

`STORAGE_MODE=mock` tiếp tục phục vụ phát triển local. Adapter R2 được giữ lại
qua `STORAGE_MODE=r2` để có đường di chuyển khi dung lượng hoặc lưu lượng vượt
giới hạn phù hợp của Supabase Free.

## Lý do

- Dùng chung nhà cung cấp PostgreSQL và Storage, giảm số tài khoản và secret.
- Gói Free phù hợp giai đoạn MVP và không cần kích hoạt thanh toán R2.
- Private bucket và signed URL đáp ứng contract bảo mật tài liệu hiện tại.

## Hệ quả

- Production API cần `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` và
  `SUPABASE_STORAGE_BUCKET`.
- File được upload trực tiếp từ browser bằng signed URL; API chỉ điều phối và
  lưu metadata.
- Cần theo dõi quota Storage/egress và có kế hoạch chuyển sang R2 khi cần.
