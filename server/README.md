# REST API Server

Server Express.js cung cấp REST API cho ứng dụng quản lý sân bóng.

## Cài đặt

```bash
npm install
```

## Chạy server

```bash
npm run dev:server
```

Server sẽ chạy tại `http://localhost:3001`

## API Endpoints

### 1. GET /api/pitches
Lấy danh sách tất cả sân bóng.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Sân 5 người - Trong nhà",
      "image": "/field-indoor.jpg",
      "price": "300.000đ",
      "priceValue": 300000,
      "location": "Quận 1, TP.HCM",
      "capacity": "10",
      "type": "5v5",
      "description": "..."
    }
  ]
}
```

### 2. GET /api/pitches/:id/available
Lấy lịch trống của một sân bóng trong ngày cụ thể.

**Query Parameters:**
- `date` (required): Ngày cần kiểm tra (format: YYYY-MM-DD)

**Example:**
```
GET /api/pitches/1/available?date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "availableSlots": ["06:00 - 07:30", "09:00 - 10:30", ...],
    "bookedSlots": ["07:30 - 09:00"],
    "allSlots": ["06:00 - 07:30", "07:30 - 09:00", ...]
  }
}
```

### 3. POST /api/bookings
Tạo đơn đặt sân mới.

**Request Body:**
```json
{
  "fieldId": "1",
  "fieldName": "Sân 5 người - Trong nhà",
  "date": "15/01/2024",
  "dateISO": "2024-01-15T00:00:00.000Z",
  "timeSlot": "06:00 - 07:30",
  "name": "Nguyễn Văn A",
  "phone": "0912345678",
  "price": "300.000đ"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đặt sân thành công",
  "data": {
    "id": "1705123456789",
    "fieldId": "1",
    "fieldName": "Sân 5 người - Trong nhà",
    "date": "15/01/2024",
    "dateISO": "2024-01-15T00:00:00.000Z",
    "timeSlot": "06:00 - 07:30",
    "name": "Nguyễn Văn A",
    "phone": "0912345678",
    "price": "300.000đ",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "userId": "0912345678"
  }
}
```

### 4. POST /api/payments/mock
Thanh toán giả lập cho đơn đặt sân.

**Request Body:**
```json
{
  "bookingId": "1705123456789",
  "paymentMethod": "mock"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thanh toán thành công",
  "data": {
    "booking": {
      "id": "1705123456789",
      "status": "confirmed",
      "payment": {
        "id": "payment_1705123456789",
        "bookingId": "1705123456789",
        "amount": "300.000đ",
        "paymentMethod": "mock",
        "status": "success",
        "transactionId": "TXN1705123456789",
        "paidAt": "2024-01-15T10:35:00.000Z"
      },
      "confirmedAt": "2024-01-15T10:35:00.000Z"
    },
    "payment": { ... }
  }
}
```

### 5. GET /api/bookings/user/:id
Lấy lịch sử đặt sân của một người dùng.

**Parameters:**
- `id`: Số điện thoại hoặc userId

**Example:**
```
GET /api/bookings/user/0912345678
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1705123456789",
      "fieldId": "1",
      "fieldName": "Sân 5 người - Trong nhà",
      "date": "15/01/2024",
      "timeSlot": "06:00 - 07:30",
      "status": "confirmed",
      ...
    }
  ]
}
```

## Data Storage

Dữ liệu được lưu trữ trong file JSON tại `server/data/`:
- `bookings.json`: Danh sách đơn đặt sân
- `pitches.json`: Danh sách sân bóng

## Health Check

```
GET /api/health
```

