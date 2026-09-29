# ADR-004: CHIẾN LƯỢC XÁC THỰC, PHIÊN LÀM VIỆC VÀ MFA

## 1. Trạng thái (Status)
**ACCEPTED**

---

## 2. Bối cảnh (Context)
Hệ thống LPMS chứa dữ liệu nhạy cảm hàng đầu về khách hàng và bí mật kinh doanh/tố tụng. Cơ chế xác thực cần đảm bảo chống giả mạo, hỗ trợ kiểm soát thiết bị đăng nhập, cho phép thu hồi phiên tức thì (khi tài khoản nhân sự bị đình chỉ hoặc mất máy), đồng thời trải nghiệm người dùng không bị đăng xuất liên tục khi đang làm việc.

---

## 3. Quyết định (Decision)
1. **Mô hình Token Kép (Dual-Token Architecture):**
   - **Access Token:** JWT ngắn hạn (15 phút), chứa thông tin định danh cơ bản (`userId`, `roles`), ký bằng thuật toán RS256/ES256 hoặc HS256 với secret key mạnh.
   - **Refresh Token:** Chuỗi ngẫu nhiên có độ dài bảo mật cao, được băm (hash SHA-256) trước khi lưu vào bảng `refresh_sessions` trong PostgreSQL kèm thông tin thiết bị (`userAgent`, `ipAddress`, `expiresAt`).
2. **Cơ chế Cookie:**
   - Cả Access Token và Refresh Token được lưu trong `HttpOnly`, `Secure`, `SameSite=Lax/Strict` Cookies để triệt tiêu rủi ro tấn công XSS đánh cắp token qua Javascript.
3. **Multi-Factor Authentication (MFA):**
   - Hỗ trợ chuẩn TOTP (RFC 6238). Khóa bí mật TOTP được mã hóa ở cấp ứng dụng trước khi lưu DB.
4. **Thu hồi phiên (Session Revocation):**
   - Khi đổi mật khẩu, người dùng chọn đăng xuất mọi thiết bị, hoặc Admin đình chỉ nhân sự: hệ thống đánh dấu `isRevoked = true` trong `refresh_sessions`. Access token ngắn hạn và kiểm tra session ở API bảo đảm thu hồi hiệu lực mà không cần Redis blacklist.

---

## 4. Hệ quả (Consequences)
- **Thuận lợi:**
  - Bảo mật tối ưu, chống XSS lấy cắp token.
  - Khả năng kiểm soát phiên đăng nhập từ xa tương đương các hệ thống ngân hàng/doanh nghiệp cao cấp.
- **Thách thức:**
  - Cần duy trì bảng quản lý phiên và middleware kiểm tra tính hợp lệ của session theo cách stateless, phù hợp Vercel Functions.
