# MULTI-LAYER AUTHORIZATION & PERMISSION MATRIX

## 1. Triết lý ủy quyền đa tầng (Defense-in-depth)
Hệ thống LPMS loại bỏ hoàn toàn cơ chế phân quyền chỉ dựa vào Role (RBAC đơn thuần). Quyền truy cập vào bất kỳ tài nguyên nào (Matter, Document, Task, Note) được đánh giá qua 4 lớp kiểm soát nghiêm ngặt:

```text
Request Đến
   │
   ▼
[ Lớp 1: RBAC Permission Code ] ──(Fail: 403)──> Từ chối
   │ Thỏa mãn
   ▼
[ Lớp 2: Confidentiality Level Clearance ] ──(Fail: 403)──> Từ chối
   │ (Ví dụ: RESTRICTED bắt buộc phải có tên trong Whitelist)
   ▼
[ Lớp 3: Matter Membership / Resource Assignment ] ──(Fail: 403)──> Từ chối
   │ (User phải là Member của Matter hoặc có đặc quyền Read All)
   ▼
[ Lớp 4: Resource Specific Policy ] ──(Fail: 403)──> Từ chối
   │ (Ví dụ: Document bị khóa cấm download, hoặc chỉ Partner được duyệt)
   ▼
Thực thi Hành động
```

---

## 2. Danh mục Quyền hạn (Permission Codes)

| Mã Quyền | Mô tả |
| :--- | :--- |
| `user.manage` | Thêm, sửa, vô hiệu hóa tài khoản nhân sự |
| `role.manage` | Cấu hình vai trò và gán quyền hệ thống |
| `organization.manage` | Quản lý cơ cấu công ty, phòng ban, chức danh |
| `audit.read` | Tra cứu và xem toàn bộ nhật ký kiểm toán hệ thống |
| `client.read` | Xem danh sách và thông tin hồ sơ khách hàng |
| `client.create` | Tiếp nhận hồ sơ khách hàng mới (Client Intake) |
| `client.update` | Chỉnh sửa thông tin khách hàng |
| `conflict.check` | Khởi tạo lệnh tra cứu xung đột lợi ích |
| `conflict.review` | Thẩm duyệt và ra quyết định kết quả Conflict Check |
| `matter.read` | Xem thông tin vụ việc được phân công |
| `matter.read_all` | Xem tất cả vụ việc trong công ty (trừ RESTRICTED) |
| `matter.create` | Khởi tạo vụ việc mới |
| `matter.update` | Cập nhật tiến độ, thông tin vụ việc |
| `matter.manage_members`| Thêm / xóa nhân sự phụ trách trong vụ việc |
| `matter.archive` | Đóng và lưu trữ hồ sơ vụ việc |
| `task.read` | Xem công việc trong vụ việc tham gia |
| `task.create` | Tạo công việc mới |
| `task.assign` | Phân công hoặc đổi người thực hiện công việc |
| `task.update` | Cập nhật trạng thái, ghi chú tiến độ công việc |
| `deadline.manage` | Tạo, sửa đổi và thiết lập hạn chót tố tụng/pháp lý |
| `document.read` | Xem danh mục tài liệu trong vụ việc |
| `document.download` | Tải tài liệu đính kèm (sinh signed URL) |
| `document.upload` | Tải lên tài liệu và phiên bản mới |
| `document.delete` | Chuyển tài liệu vào thùng rác (Soft delete) |
| `document.purge` | Xóa vĩnh viễn tài liệu (Permanent Delete) |

---

## 3. Ma trận Vai trò mặc định (Role-Permission Matrix)

| Quyền \ Vai trò | SYSTEM_ADMIN | MANAGING_PARTNER | PARTNER | LAWYER | PARALEGAL | INTERN | ACCOUNTANT | ADMIN_STAFF | RECEPTIONIST |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `user.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `role.manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `client.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| `client.create` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `conflict.check`| ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `conflict.review`| ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `matter.read` | ✅ | ✅ | ✅ (assigned)| ✅ (assigned)| ✅ (assigned)| ✅ (assigned)| ❌ | ❌ | ❌ |
| `matter.read_all`| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `matter.create` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `matter.manage_members`| ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `matter.archive`| ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `task.create` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `task.assign` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `document.download`| ✅ | ✅ | ✅ (assigned)| ✅ (assigned)| ✅ (assigned)| ❌ (view only)| ❌ | ❌ | ❌ |
| `document.purge`| ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Quy tắc an toàn đặc thù cho Matter RESTRICTED
1. Matter có `confidentialityLevel = RESTRICTED` là hồ sơ mật cao độ.
2. Bất kỳ thành viên nào (kể cả người mang vai trò `PARTNER` hay `MANAGING_PARTNER`) nếu không có bản ghi trong bảng `matter_members` liên kết với Matter đó thì:
   - Hoàn toàn **không thể** truy vấn danh sách (bị ẩn trong query).
   - Truy cập thẳng bằng ID trực tiếp sẽ trả về **`HTTP 404 Not Found`** hoặc **`HTTP 403 Forbidden`** (thực hiện theo chính sách chống User/Resource Enumeration).
