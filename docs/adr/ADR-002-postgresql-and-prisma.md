# ADR-002: LỰA CHỌN POSTGRESQL VÀ PRISMA ORM

## 1. Trạng thái (Status)
**ACCEPTED**

---

## 2. Bối cảnh (Context)
Dữ liệu của hệ thống quản lý công ty luật có cấu trúc quan hệ mật thiết (Relational Data), đòi hỏi tính ràng buộc chặt chẽ (Foreign Keys, Constraints, Unique Indexes) và tuân thủ tuyệt đối chuẩn ACID. Ngoài ra, việc lưu trữ JSONB linh hoạt cho metadata và audit trail cũng là một yêu cầu quan trọng. Đội ngũ phát triển cần một ORM an toàn kiểu dữ liệu (Type-safe), quản lý migration tin cậy và có trải nghiệm phát triển (DX) cao với TypeScript.

---

## 3. Quyết định (Decision)
1. **Database:** Chọn **PostgreSQL 16+** làm cơ sở dữ liệu chính thức duy nhất cho toàn bộ dữ liệu nghiệp vụ của LPMS.
2. **ORM & Migration:** Chọn **Prisma ORM**:
   - Sử dụng Prisma Schema làm Single Source of Truth cho Data Model.
   - Prisma Client tự động sinh mã TypeScript Types đồng bộ 100% với Schema.
   - Mọi thay đổi cấu trúc dữ liệu đều thông qua `prisma migrate` và được lưu vào Git version control.

---

## 4. Hệ quả (Consequences)
- **Thuận lợi:**
  - Ngăn ngừa lỗi runtime do truy vấn sai tên trường hoặc kiểu dữ liệu nhờ tính năng Type-safety hoàn hảo của Prisma.
  - Hỗ trợ transaction an toàn (`prisma.$transaction`) cho các luồng nghiệp vụ tạo Matter và phân quyền đồng thời.
  - Khả năng tận dụng JSONB và Full-text search tích hợp sẵn của PostgreSQL.
- **Thách thức:**
  - Cần chú ý tối ưu các câu truy vấn phức tạp hoặc báo cáo đa bảng bằng raw SQL (`prisma.$queryRaw`) nếu Prisma Client sinh query chưa tối ưu.
