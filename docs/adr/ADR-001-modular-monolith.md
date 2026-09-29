# ADR-001: LỰA CHỌN KIẾN TRÚC MODULAR MONOLITH CHO V1

## 1. Trạng thái (Status)
**ACCEPTED** (Đã thông qua và áp dụng làm tiêu chuẩn bắt buộc)

---

## 2. Bối cảnh (Context)
Dự án Legal Practice Management System (LPMS) là hệ thống quản trị chuyên sâu cho công ty luật với quy mô dự kiến từ 10 đến 200 nhân sự hoạt động trong V1. Hệ thống đòi hỏi tính toàn vẹn dữ liệu cao (ACID transactions), nhất quán giữa các thực thể phụ thuộc (Matter, Task, Document, Conflict Check) và bảo mật nghiêm ngặt. Việc triển khai Microservices ở giai đoạn này sẽ làm gia tăng đáng kể độ phức tạp về vận hành mạng, phân tán transaction (Saga/2PC), trễ mạng (latency) và chi phí hạ tầng không cần thiết.

---

## 3. Quyết định (Decision)
Triển khai toàn bộ Backend dưới dạng một **Modular Monolith** sử dụng **NestJS**:
- Toàn bộ các domain (Auth, Org, Client, Matter, Task, Calendar, Document, Audit) nằm trong cùng một repository và chạy trong cùng một tiến trình Node.js LTS.
- Các module giao tiếp nội bộ thông qua Interface và Dependency Injection rõ ràng, không truy cập trực tiếp vào repository nội bộ của nhau mà gọi qua Service layer.
- Giữ vững tính cô lập logic domain để sẵn sàng bóc tách thành Microservices nếu tải nghiệp vụ trong tương lai thực sự đòi hỏi.

---

## 4. Hệ quả (Consequences)
- **Thuận lợi:**
  - Quy trình phát triển, kiểm thử E2E và CI/CD đơn giản, nhanh chóng.
  - Tận dụng triệt để ACID transaction của PostgreSQL cho các nghiệp vụ phức tạp (như mở Matter kèm phân quyền và khởi tạo cấu trúc thư mục).
  - Deploy serverless qua Vercel mà vẫn giữ ranh giới module rõ ràng trong một codebase.
- **Thách thức:**
  - Cần kỷ luật cao trong việc phân định ranh giới giữa các module (không tạo circular dependencies hoặc import tắt giữa các domain service).
