# ADR-005: MÔ HÌNH ỦY QUYỀN ĐA TẦNG (RBAC + RESOURCE + MATTER MEMBERSHIP)

## 1. Trạng thái (Status)
**ACCEPTED**

---

## 2. Bối cảnh (Context)
Trong một công ty luật, việc một nhân viên có vai trò Luật sư (`LAWYER`) không đồng nghĩa với việc họ có quyền xem toàn bộ hồ sơ vụ việc của công ty. Có những vụ việc thuộc nhóm cấm đoán (ví dụ: xung đột lợi ích nội bộ, vụ việc ly hôn/tranh chấp của khách hàng VIP, hoặc các vụ mua bán sáp nhập M&A mật). Nếu áp dụng RBAC thông thường (Role-Based Access Control) sẽ gây ra lỗ hổng Broken Access Control / IDOR nghiêm trọng.

---

## 3. Quyết định (Decision)
Triển khai mô hình ủy quyền kết hợp đa tầng:
1. **RBAC (Role-Based Access Control):** Cung cấp các quyền hạn chung của vai trò (ví dụ: `matter.create`, `task.update`).
2. **Matter Membership:** Phân quyền theo tư cách tham gia vụ việc. Một luật sư chỉ có thể xem và tương tác với vụ việc nếu họ là `Responsible Partner`, `Responsible Lawyer`, hoặc được thêm vào bảng `matter_members`.
3. **Confidentiality Clearance:** Mức độ bảo mật của Matter (`NORMAL`, `CONFIDENTIAL`, `HIGHLY_CONFIDENTIAL`, `RESTRICTED`). Với mức `RESTRICTED`, chỉ những người được duyệt tường minh trong Whitelist mới được phép truy cập (ngay cả các Partner khác trong công ty cũng bị từ chối).
4. **Enforcement Layer:** Toàn bộ việc kiểm tra quyền được thực thi ở tầng **Service Layer** trong Backend thông qua các Guards / Interceptors chuyên dụng. Frontend ẩn nút bấm chỉ nhằm mục đích tối ưu trải nghiệm (UX) và không bao giờ được coi là chốt chặn bảo mật.

---

## 4. Hệ quả (Consequences)
- **Thuận lợi:**
  - Ngăn chặn 100% rủi ro IDOR và truy cập chéo dữ liệu trái phép giữa các luật sư.
  - Tuân thủ tuyệt đối quy tắc đạo đức hành nghề luật sư về bảo mật thông tin thân chủ.
- **Thách thức:**
  - Logic kiểm tra truy vấn CSDL phải luôn lồng điều kiện lọc theo tư cách thành viên vụ việc, đòi hỏi phải viết các helper/extension chuẩn trong Prisma service.
