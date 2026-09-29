# SECURITY POLICY & GUIDELINES — LPMS

Hệ thống Legal Practice Management System (LPMS) quản lý thông tin pháp lý nhạy cảm của khách hàng và doanh nghiệp. Tài liệu này xác lập các tiêu chuẩn an ninh bắt buộc dựa trên **OWASP Application Security Verification Standard (ASVS)**.

---

## 1. Authentication & Session Management
1. **Password Hashing:**
   - Sử dụng thuật toán an toàn hiện đại (Argon2id hoặc bcrypt với cost factor tối thiểu 12).
   - Nghiêm cấm lưu trữ plaintext password ở mọi môi trường.
2. **Multi-Factor Authentication (MFA):**
   - Hỗ trợ TOTP (Google Authenticator, Microsoft Authenticator).
   - Recovery code một lần được mã hóa an toàn khi lưu trữ.
3. **Session Control:**
   - Token ngắn hạn (JWT Access Token: 15 phút) kết hợp Refresh Token (lưu trữ có băm trong DB, hỗ trợ rotation và thu hồi).
   - Lưu trữ qua Cookie an toàn: `HttpOnly`, `Secure`, `SameSite=Strict/Lax`.
   - Hỗ trợ user revoke session hiện tại, revoke all devices, và Admin revoke toàn bộ phiên của user bị đình chỉ.
4. **Brute-force & Enumeration Protection:**
   - Rate limiting trên các endpoint: `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/mfa/verify`.
   - Phản hồi generic cho các luồng quên mật khẩu/đăng nhập, không làm lộ sự tồn tại của email (`User Enumeration Protection`).

---

## 2. Multi-layer Authorization & IDOR Prevention
1. **Nguyên tắc phân quyền:**
   - Không dựa vào vai trò đơn thuần. Một request truy cập tài nguyên phải thỏa mãn:
     $$\text{Access} = \text{RBAC Permission} \land (\text{Matter Membership} \lor \text{Global Override}) \land \text{Confidentiality Clearance}$$
2. **Phòng chống IDOR (Insecure Direct Object References):**
   - Mọi endpoint có tham số định danh (e.g., `/matters/:id`, `/documents/:id`) bắt buộc phải kiểm tra quyền sở hữu/quyền thành viên tại Service Layer.
   - Tuyệt đối không tin cậy việc người dùng tự truyền ID.
3. **Bảo mật Matter có mức độ RESTRICTED:**
   - Chỉ user thuộc Whitelist rõ ràng mới được xem. Role `PARTNER` hoặc `MANAGING_PARTNER` không tự động bypass nếu không có trong Whitelist.

---

## 3. Data Protection & Cryptography
1. **Data in Transit:**
   - Bắt buộc TLS 1.3 / HTTPS trên toàn bộ môi trường Production và Staging.
   - HSTS (HTTP Strict Transport Security) được kích hoạt qua reverse proxy.
2. **Data at Rest:**
   - Supabase PostgreSQL encryption at rest và Cloudflare R2 server-side encryption.
   - Các trường dữ liệu siêu nhạy cảm (e.g. số CMND/CCCD, Hộ chiếu, ghi chú đặc biệt) được mã hóa cấp ứng dụng (Application-level encryption) bằng AES-GCM khi cần.
3. **Secret Management:**
   - Tuyệt đối không commit Supabase DB credentials, JWT secrets, R2 keys hay API keys vào Git repository.
   - Mọi cấu hình nhạy cảm được nạp qua Vercel Environment Variables. Cung cấp file `.env.example` với giá trị giả lập.

---

## 4. Secure File Handling
1. **Upload Validation:**
   - Kiểm tra định dạng qua MIME type thực tế (Magic bytes inspection), không chỉ tin vào file extension từ client.
   - Tạo tên file ngẫu nhiên (UUID) trên Object storage để chống Path Traversal và Overwrite.
   - Giới hạn kích thước file tải lên tối đa theo quy định cấu hình hệ thống.
2. **Download Protection:**
   - Không public URL trực tiếp tới file binary.
   - Sử dụng Short-lived Presigned URLs (thời hạn 5 - 15 phút), chỉ sinh ra sau khi đã thẩm định quyền đọc tài liệu và ghi nhận Audit log.
3. **Xóa an toàn (Soft delete):**
   - Mọi thao tác xóa tài liệu đều thực hiện Soft Delete và chuyển vào Recycle Bin.
   - Thao tác xóa vĩnh viễn (Hard delete) yêu cầu quyền đặc biệt, xác nhận xác thực lại và ghi audit log chi tiết.

---

## 5. Audit Logging & Non-repudiation
1. **Audit bắt buộc:**
   - Toàn bộ các thao tác: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `CREATE`, `VIEW_SENSITIVE`, `UPDATE`, `DELETE`, `DOWNLOAD`, `PERMISSION_CHANGE`, `EXPORT` đều phải được ghi log.
2. **Tính toàn vẹn (Immutability):**
   - Bảng `audit_logs` là Append-only. Không có API nào cho phép chỉnh sửa hoặc xóa audit log.
   - Log bao gồm: `userId`, `action`, `resourceType`, `resourceId`, `timestamp`, `ip`, `userAgent`, `requestId`, `metadata`.
   - Nghiêm cấm log thông tin mật (mật khẩu plaintext, access/refresh token, payload văn bản nhạy cảm).
