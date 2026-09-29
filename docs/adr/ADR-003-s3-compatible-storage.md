# ADR-003: LƯU TRỮ TÀI LIỆU TRÊN S3-COMPATIBLE OBJECT STORAGE VÀ PRESIGNED URLS

## 1. Trạng thái (Status)
**SUPERSEDED BY ADR-007**

---

## 2. Bối cảnh (Context)
Một công ty luật xử lý hàng ngàn tài liệu pháp lý nặng (hợp đồng nhiều trang, hồ sơ scan, chứng cứ tố tụng dạng PDF/TIFF/DOCX). Nếu lưu trữ trực tiếp binary (BLOB/bytea) trong database PostgreSQL sẽ làm phình to database, gây tắc nghẽn I/O, kéo dài thời gian backup và giảm hiệu năng chung. Ngược lại, việc lưu trữ trực tiếp trên file system của server application sẽ gây khó khăn cho việc scale ngang (stateless container) và rủi ro mất mát dữ liệu.

---

## 3. Quyết định (Decision)
1. **Tách biệt Data & Binary:** Cơ sở dữ liệu PostgreSQL chỉ lưu trữ metadata (tên file, hash SHA-256, dung lượng, phiên bản, MIME, storage key).
2. **Object Storage:** Sử dụng **Cloudflare R2** qua S3-compatible API làm object storage chuẩn cho mọi môi trường cloud V1.
3. **Bảo mật truy cập:**
   - Bucket tài liệu ở trạng thái Private hoàn toàn.
   - Khi người dùng tải file, API xác thực quyền thành viên và quyền đọc của tài liệu, ghi lại Audit log, sau đó sinh một **Short-lived Presigned URL** (thời hạn 5 - 15 phút) để client tải trực tiếp từ Object Storage.

---

## 4. Hệ quả (Consequences)
- **Thuận lợi:**
  - Giảm tải băng thông cho Node.js server vì file được stream trực tiếp từ Object Storage.
  - An toàn bảo mật: Không có link công khai vĩnh viễn, ngăn ngừa rò rỉ hồ sơ mật.
  - Database nhẹ và việc backup CSDL diễn ra trong vài giây.
- **Thách thức:**
  - Cần quy trình đồng bộ và xử lý mồ côi (Orphaned files cleanup) trong trường hợp upload bị gián đoạn giữa chừng.
