# LPMS Remake Checklist

Đây là checklist làm việc cho đợt remake giao diện và backend mock. `require.md` vẫn là nguồn yêu cầu gốc. Database/cloud chỉ được gắn sau khi các luồng mock ổn định.

## Đã hoàn thành trong mốc 2026-09-29

- [x] App Shell dùng chung: sidebar, topbar, breadcrumb, profile menu, mobile drawer và thu gọn sidebar.
- [x] Điều hướng V1 theo ngữ cảnh: Dashboard, Khách hàng, Hồ sơ vụ việc, Nhiệm vụ, Thời hạn, Lịch, Tài liệu, Thông báo, Báo cáo, Audit, Tổ chức và Quản trị; Conflict Check chỉ còn là luồng ngữ cảnh.
- [x] Thay trang `/` showcase bằng Dashboard vận hành với KPI, công việc, thời hạn, hồ sơ gần đây và quick actions.
- [x] Thêm `/organization` và dùng chung với `/administration/organization`.
- [x] Màn hình Tổ chức & Phòng ban: KPI, sơ đồ điều hành read-only, phòng ban, chi nhánh, chức danh và form tạo phòng ban mock.
- [x] Thêm `/calendar`, `/notifications`, `/reports`, `/audit` để các liên kết điều hướng không còn dẫn tới route trống.
- [x] Remake danh sách Khách hàng, Kiểm tra xung đột, Hồ sơ vụ việc, Nhiệm vụ, Thời hạn và Tài liệu theo App Shell mới.
- [x] Bỏ sidebar/layout cũ của từng module; mọi module dùng App Shell root.
- [x] Chế độ mock rõ ràng qua `NEXT_PUBLIC_DATA_MODE=mock` (mặc định); `api` dùng khi backend sẵn sàng.
- [x] Backend mock `OrganizationModule`: overview, departments, branches, positions, users, roles và permissions.
- [x] Backend mock `ClientsModule`: danh sách, chi tiết, tạo/sửa, đổi trạng thái, contacts và relations.
- [x] Backend mock `OperationsModule`: Conflict, Matter, Task, Deadline, Document và Folder route contracts.
- [x] Backend `CalendarModule`: event list/detail/create/update/delete với mock/Prisma selector và lọc theo thời gian/vụ việc.
- [x] Guard và response envelope cho endpoint tổ chức.
- [x] Sửa API bootstrap Logger để backend chạy runtime.
- [x] Web typecheck/lint/build pass.
- [x] API typecheck/lint/build và tests pass.

## Hoàn thành bổ sung — mốc actor và ổn định runtime

- [x] Tách ba không gian làm việc Admin, Giám đốc và Nhân viên trên cùng mô hình 10 role RBAC nền tảng.
- [x] Sidebar, breadcrumb, profile và quick actions lọc theo actor; không hiển thị "Kiểm tra xung đột" ở điều hướng chung.
- [x] Giữ Conflict Check trong luồng tiếp nhận theo quyền `conflict.check`/`conflict.review`, không xóa route hoặc API nghiệp vụ.
- [x] Mock login có tài khoản riêng cho admin, giám đốc, luật sư/trợ lý; session mock được khôi phục khi tải lại trang.
- [x] Seed permission idempotent cho ba actor và các role nghiệp vụ còn lại; mock API backend có nhiều user mẫu.
- [x] Bổ sung route `/deadlines/[id]`, hoàn thiện trạng thái loading/error và thao tác đánh dấu hoàn tất.
- [x] Thêm trang `/access-denied` và kiểm tra điều hướng client-side; backend authorization vẫn là lớp bảo mật bắt buộc.
- [x] Xác nhận runtime sau khi làm sạch cache `.next`: các route chính, `/deadlines/dl-1` và `/access-denied` trả HTTP 200.
- [x] Chạy lại `format:check`, lint, typecheck và 52 tests sau thay đổi.

## Đang làm tiếp theo

- [~] Tách API client monolith thành client theo domain (đã có transport export, platform client và façade domain; phần legacy còn cần loại bỏ sau khi migrate toàn bộ import).
- [x] Persistence foundation: Prisma schema có `DIRECT_URL`, migration auth/RBAC/session/audit + entity MVP và seed permissions idempotent.
- [x] API persistence mode có opt-in rõ ràng (`PERSISTENCE_MODE=mock|prisma`) và readiness endpoint không làm hỏng mock runtime.
- [x] Storage boundary: mock/R2 mode, AWS SigV4 presigned GET/PUT contract và fail-closed credential check.
- [x] Nối repository mock sang Prisma repository theo từng module (Auth, Clients, Organization, Operations và Platform đã có adapter/mode selector; staging e2e còn ở mục triển khai).
- [x] Khi ở `api` mode, không fallback mock im lặng khi backend lỗi.
- [x] Hoàn thiện màn hình chi tiết và form tạo/sửa cho Khách hàng, Conflict, Matter, Task, Deadline và Documents.
- [x] Bổ sung API mock cho Client, Conflict, Matter, Task, Deadline và Document route contracts.
- [x] Bổ sung notification, search, report và audit service backend.
- [x] Bổ sung test permission/IDOR và test API cho Organization/RBAC (RolesGuard, role mismatch và resource-id boundary đã có; e2e database thật để phase persistence).
- [x] Đồng bộ chuỗi tiếng Việt và loại bỏ nhãn phase/demo khỏi giao diện sản phẩm trong các luồng đã remake.

## Chưa làm trong giai đoạn mock/persistence

- [ ] Kết nối Supabase PostgreSQL staging và chạy migration deploy thật (migration đã có, chưa có credential/database để verify).
- [~] Cloudflare R2 signed upload/download (SigV4 contract đã có; live bucket/credential smoke test chưa chạy).
- [~] Vercel Queues worker (SDK consumer, retry/idempotency ledger và trigger manifest đã có; live Vercel smoke còn chờ deployment/credential).
- [~] Backup/disaster recovery runbook (managed Supabase/R2 procedure và restore checklist đã có; restore test thật cần staging credentials).
- [ ] Tài chính & thu chi.
- [ ] Vòng đời hợp đồng độc lập.
- [ ] Trao đổi nội bộ/chat.
- [ ] Sơ đồ tổ chức kéo-thả nâng cao.

## Quy tắc phối hợp

- Mỗi task phải ghi rõ module, file sở hữu, dependency và acceptance criteria.
- Không sửa đồng thời `AppShell`, `packages/types`, API base client và checklist nếu chưa thống nhất.
- Frontend không dùng việc ẩn nút làm biện pháp bảo mật; backend phải kiểm tra quyền.
- Mỗi mốc phải chạy typecheck, lint, test và build trước khi đánh dấu `[x]`.
