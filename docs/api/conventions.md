# REST API CONVENTIONS & DESIGN STANDARDS

## 1. Chuẩn định danh và Base Path
- **Base URI:** `/api/v1`
- **Quy chuẩn URL:** Sử dụng chữ thường, dấu gạch nối (`kebab-case`) cho các segments, và danh từ số nhiều cho các resource collections:
  - `GET /api/v1/clients`
  - `POST /api/v1/clients`
  - `GET /api/v1/matters/:id/documents`
  - `POST /api/v1/tasks/:id/comments`

---

## 2. Chuẩn Response Envelope

### 2.1. Phản hồi thành công (Success Response)
Mọi phản hồi 2xx đều có cấu trúc JSON thống nhất:
```json
{
  "data": {
    "id": "c7a87e5b-3b36-4c46-9e67-d8615c49021e",
    "matterCode": "MAT-2026-000001",
    "name": "Tư vấn đầu tư dự án Solar Farm Bến Tre",
    "status": "ACTIVE"
  },
  "meta": {
    "timestamp": "2026-09-28T22:15:00.000Z",
    "requestId": "req-98f6230f-b0f9-4b68-b789-53b47c0ea91e"
  }
}
```

Đối với endpoint danh sách có phân trang:
```json
{
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 154,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "timestamp": "2026-09-28T22:15:00.000Z",
    "requestId": "req-..."
  }
}
```

### 2.2. Phản hồi lỗi (Error Response)
Không bao giờ trả về lỗi dạng text thuần hoặc rò rỉ stack trace ở môi trường Staging/Production:
```json
{
  "error": {
    "code": "MATTER_ACCESS_DENIED",
    "message": "Bạn không có quyền truy cập hồ sơ vụ việc này.",
    "details": [],
    "requestId": "req-98f6230f-b0f9-4b68-b789-53b47c0ea91e",
    "timestamp": "2026-09-28T22:15:00.000Z"
  }
}
```

---

## 3. Danh mục Mã trạng thái HTTP & Error Codes chuẩn

| HTTP Status | Trường hợp sử dụng | Ví dụ Code |
| :--- | :--- | :--- |
| `200 OK` | Truy vấn hoặc cập nhật thành công | — |
| `201 Created` | Tạo mới tài nguyên thành công | — |
| `204 No Content`| Xóa thành công hoặc không có body trả về | — |
| `400 Bad Request`| Dữ liệu đầu vào sai cú pháp hoặc vi phạm validation DTO | `VALIDATION_FAILED` |
| `401 Unauthorized`| Chưa đăng nhập hoặc Access Token hết hạn/không hợp lệ | `AUTH_TOKEN_EXPIRED`, `AUTH_UNAUTHORIZED` |
| `403 Forbidden` | Đã đăng nhập nhưng không đủ quyền trên tài nguyên (hoặc do IDOR guard chặn) | `MATTER_ACCESS_DENIED`, `INSUFFICIENT_PERMISSIONS` |
| `404 Not Found` | Không tìm thấy tài nguyên (hoặc hồ sơ RESTRICTED bị ẩn) | `RESOURCE_NOT_FOUND` |
| `409 Conflict` | Vi phạm ràng buộc duy nhất (Unique code, trùng lịch, xung đột trạng thái) | `DUPLICATE_CODE_CONFLICT` |
| `429 Too Many Requests` | Vượt quá ngưỡng Rate Limit | `RATE_LIMIT_EXCEEDED` |
| `500 Internal Error` | Lỗi máy chủ chưa được kiểm soát (có log kèm requestId nội bộ) | `INTERNAL_SERVER_ERROR` |

---

## 4. Query Parameters chuẩn cho Danh sách
- **Phân trang:** `?page=1&limit=20` (Mặc định limit=20, tối đa limit=100).
- **Sắp xếp:** `?sortBy=createdAt&sortOrder=desc` (`asc` / `desc`).
- **Tìm kiếm:** `?q=keywords` (Full-text hoặc ILIKE metadata).
- **Bộ lọc:** Dùng tiền tố rõ ràng như `?status=ACTIVE&practiceAreaId=...`.
