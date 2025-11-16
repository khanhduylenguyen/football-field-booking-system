

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Demo](#-demo)
- [Công nghệ](#-công-nghệ-sử-dụng)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-hướng-dẫn-sử-dụng)
- [API](#-api-endpoints)
- [Cấu trúc](#-cấu-trúc-project)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

---

## 🎯 Giới thiệu

**Football Field Booking System** là một ứng dụng web full-stack cho phép người dùng đặt sân bóng đá trực tuyến một cách dễ dàng và tiện lợi. Hệ thống cung cấp giao diện quản trị mạnh mẽ cho admin và chủ sân, cùng với trải nghiệm người dùng mượt mà cho người chơi.

### 🎨 Đặc điểm nổi bật

- ✨ **Giao diện hiện đại**: Sử dụng Tailwind CSS và shadcn/ui
- 🔐 **Bảo mật**: Authentication với JWT và role-based access control
- 📱 **Responsive**: Hoạt động tốt trên mọi thiết bị
- 🌙 **Dark Mode**: Hỗ trợ chế độ sáng/tối
- ⚡ **Performance**: Tối ưu hóa tốc độ với Vite và React 18
- 🔔 **Real-time**: Hệ thống thông báo cập nhật tự động

---

## 🚀 Tính năng

### 👥 Quản lý người dùng
- ✅ Đăng ký/Đăng nhập với xác thực email
- ✅ 3 vai trò: Admin, Owner (Chủ sân), Player (Người chơi)
- ✅ Quản lý profile cá nhân
- ✅ Upload và quản lý ảnh đại diện
- ✅ Đổi mật khẩu an toàn

### 🏟️ Đặt sân
- ✅ Xem danh sách sân bóng với bộ lọc
- ✅ Xem lịch trống theo ngày
- ✅ Đặt sân theo giờ
- ✅ Thanh toán trực tuyến
- ✅ Lịch sử đặt sân
- ✅ Hủy/Chỉnh sửa đặt sân

### 📊 Admin Dashboard
- ✅ Thống kê tổng quan (doanh thu, đặt sân, người dùng)
- ✅ Biểu đồ doanh thu theo thời gian
- ✅ Quản lý người dùng (CRUD)
- ✅ Quản lý sân bóng
- ✅ Quản lý đặt sân
- ✅ Quản lý khuyến mãi
- ✅ Xem đánh giá và feedback
- ✅ Báo cáo doanh thu chi tiết

### 🔔 Hệ thống thông báo
- ✅ Thông báo đặt sân thành công
- ✅ Thông báo thanh toán
- ✅ Thông báo khuyến mãi
- ✅ Đánh dấu đã đọc/chưa đọc
- ✅ Xóa thông báo
- ✅ Badge hiển thị số thông báo chưa đọc

### ⭐ Đánh giá & Feedback
- ✅ Đánh giá sân bóng (1-5 sao)
- ✅ Viết nhận xét
- ✅ Xem đánh giá của người khác
- ✅ Admin quản lý đánh giá

### 🎫 Khuyến mãi
- ✅ Tạo mã giảm giá
- ✅ Áp dụng khuyến mãi khi đặt sân
- ✅ Quản lý thời hạn khuyến mãi
- ✅ Hiển thị khuyến mãi đang có

---

## 🎬 Demo

### Trang chủ
![Homepage](https://via.placeholder.com/800x400?text=Homepage+Screenshot)

### Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/800x400?text=Admin+Dashboard+Screenshot)

### Đặt sân
![Booking](https://via.placeholder.com/800x400?text=Booking+Screenshot)

---

## 🛠️ Công nghệ sử dụng

### Frontend
| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| React | 18.3.1 | UI Library |
| TypeScript | 5.8.3 | Type Safety |
| Vite | 5.4.19 | Build Tool |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn/ui | Latest | UI Components |
| React Router | 6.30.1 | Routing |
| React Hook Form | 7.61.1 | Form Management |
| Zod | 3.25.76 | Validation |
| Tanstack Query | 5.83.0 | Data Fetching |
| date-fns | 3.6.0 | Date Utilities |
| Lucide React | 0.462.0 | Icons |

### Backend
| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Node.js | 18+ | Runtime |
| Express | 4.18.2 | Web Framework |
| Multer | Latest | File Upload |
| CORS | 2.8.5 | Cross-Origin |

---

## 💻 Cài đặt

### Yêu cầu hệ thống
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 hoặc **yarn**: >= 1.22.0
- **Git**: >= 2.0.0

### Bước 1: Clone repository

```bash
git clone https://github.com/khanhduylenguyen/football-field-booking-system.git
cd football-field-booking-system
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Chạy development server

#### Chạy cả Frontend và Backend cùng lúc (Khuyến nghị)
```bash
npm run dev:all
```

#### Hoặc chạy riêng từng phần

**Frontend** (Port 5173)
```bash
npm run dev
```

**Backend** (Port 3001)
```bash
npm run dev:server
```

### Bước 4: Truy cập ứng dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **API Health Check**: http://localhost:3001/api/health

---

## 📖 Hướng dẫn sử dụng

### 🔐 Tài khoản mặc định

Hệ thống tự động tạo tài khoản admin khi khởi động lần đầu:

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| **Admin** | admin@admin.com | admin123 |

### 👤 Đăng ký tài khoản mới

1. Truy cập trang đăng ký: http://localhost:5173/register
2. Điền thông tin:
   - Họ và tên
   - Email
   - Số điện thoại (tùy chọn)
   - Mật khẩu (tối thiểu 6 ký tự)
3. Click "Đăng ký"
4. Đăng nhập với tài khoản vừa tạo

### 🏟️ Đặt sân

1. **Xem danh sách sân**: Truy cập `/fields`
2. **Chọn sân**: Click vào sân muốn đặt
3. **Chọn ngày và giờ**: Chọn thời gian phù hợp
4. **Xác nhận**: Kiểm tra thông tin và xác nhận
5. **Thanh toán**: Hoàn tất thanh toán
6. **Nhận thông báo**: Nhận thông báo đặt sân thành công

### 📊 Sử dụng Admin Dashboard

1. **Đăng nhập** với tài khoản admin
2. **Truy cập Dashboard**: Click vào avatar > Dashboard
3. **Các chức năng**:
   - **Dashboard**: Xem thống kê tổng quan
   - **Users**: Quản lý người dùng
   - **Pitches**: Quản lý sân bóng
   - **Bookings**: Quản lý đặt sân
   - **Revenue**: Xem báo cáo doanh thu
   - **Promotions**: Quản lý khuyến mãi
   - **Reviews**: Xem đánh giá
   - **Settings**: Cài đặt hệ thống

### 🔔 Sử dụng thông báo

1. **Xem thông báo**: Click vào icon 🔔 ở góc trên bên phải
2. **Đọc thông báo**: Click vào thông báo để xem chi tiết
3. **Đánh dấu đã đọc**: Click vào nút ✓
4. **Xóa thông báo**: Click vào nút 🗑️
5. **Đánh dấu tất cả**: Click "Đánh dấu tất cả đã đọc"

---

## 📡 API Endpoints

### Authentication

#### Đăng ký
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "phone": "0123456789"
}
```

#### Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### User Profile

#### Lấy thông tin user
```http
GET /api/user/profile/:id
```

#### Cập nhật thông tin
```http
PUT /api/user/profile/:id
Content-Type: application/json

{
  "name": "Tên mới",
  "email": "email@example.com",
  "phone": "0987654321"
}
```

#### Upload avatar
```http
POST /api/user/profile/:id/avatar
Content-Type: multipart/form-data

avatar: [file]
```

#### Xóa avatar
```http
DELETE /api/user/profile/:id/avatar
```

### Bookings

#### Lấy danh sách đặt sân
```http
GET /api/bookings?userId=:userId
```

#### Tạo đặt sân mới
```http
POST /api/bookings
Content-Type: application/json

{
  "userId": "1",
  "fieldId": "field-1",
  "date": "2025-11-17",
  "timeSlot": "08:00-10:00",
  "price": 200000
}
```

#### Cập nhật đặt sân
```http
PUT /api/bookings/:id
Content-Type: application/json

{
  "status": "confirmed"
}
```

### Notifications

#### Lấy thông báo
```http
GET /api/notifications/:userId
```

#### Đánh dấu đã đọc
```http
PUT /api/notifications/:notificationId/read
```

#### Đánh dấu tất cả đã đọc
```http
PUT /api/notifications/:userId/read-all
```

#### Xóa thông báo
```http
DELETE /api/notifications/:notificationId
```

#### Tạo thông báo (Internal)
```http
POST /api/notifications
Content-Type: application/json

{
  "userId": "1",
  "type": "booking",
  "title": "Đặt sân thành công",
  "message": "Bạn đã đặt sân A thành công",
  "link": "/my-bookings"
}
```

---

## 📁 Cấu trúc Project

```
football-field-booking-system/
│
├── 📂 src/                          # Frontend source code
│   ├── 📂 components/              # React components
│   │   ├── 📂 admin/              # Admin components
│   │   ├── 📂 owner/              # Owner components
│   │   └── 📂 ui/                 # UI components (shadcn)
│   │
│   ├── 📂 contexts/               # React contexts
│   │   ├── AuthContext.tsx       # Authentication context
│   │   └── NotificationContext.tsx # Notification context
│   │
│   ├── 📂 pages/                  # Page components
│   │   ├── 📂 admin/             # Admin pages
│   │   ├── 📂 owner/             # Owner pages
│   │   ├── Index.tsx             # Homepage
│   │   ├── Login.tsx             # Login page
│   │   ├── Register.tsx          # Register page
│   │   ├── Fields.tsx            # Fields listing
│   │   ├── Booking.tsx           # Booking page
│   │   ├── MyBookings.tsx        # User bookings
│   │   └── Account.tsx           # Account settings
│   │
│   ├── 📂 hooks/                  # Custom React hooks
│   ├── 📂 lib/                    # Utilities & helpers
│   ├── 📂 assets/                 # Images & static files
│   ├── App.tsx                   # Main App component
│   └── main.tsx                  # Entry point
│
├── 📂 server/                      # Backend source code
│   ├── 📂 data/                   # JSON database files
│   │   ├── users.json            # Users data
│   │   ├── bookings.json         # Bookings data
│   │   ├── pitches.json          # Pitches data
│   │   ├── notifications.json    # Notifications data
│   │   └── ...
│   │
│   ├── 📂 uploads/                # Uploaded files
│   │   └── 📂 avatars/           # User avatars
│   │
│   └── index.js                  # Express server
│
├── 📂 public/                      # Static assets
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
├── vite.config.ts                # Vite config
└── README.md                     # Documentation
```

---

## 🔧 Scripts

```bash
# Development
npm run dev              # Chạy frontend (Vite)
npm run dev:server       # Chạy backend (Node.js)
npm run dev:all          # Chạy cả frontend và backend

# Build
npm run build            # Build production
npm run build:dev        # Build development

# Preview
npm run preview          # Preview production build

# Lint
npm run lint             # Check code quality
```

---

## 🌐 Deployment

### Frontend (Vercel/Netlify)

1. **Build project**:
```bash
npm run build
```

2. **Deploy folder `dist/`** lên Vercel hoặc Netlify

3. **Cấu hình environment variables**:
```
VITE_API_URL=https://your-backend-url.com
```

### Backend (Render/Railway)

1. **Push code** lên GitHub
2. **Kết nối** với Render/Railway
3. **Cấu hình**:
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
   - Port: `3001`

---

## 🤝 Đóng góp

Chúng tôi rất hoan nghênh mọi đóng góp! Để đóng góp:

1. **Fork** repository
2. **Tạo branch** mới: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** lên branch: `git push origin feature/amazing-feature`
5. **Tạo Pull Request**

### 📝 Coding Standards

- Sử dụng TypeScript
- Follow ESLint rules
- Viết comments cho code phức tạp
- Viết tests cho features mới

---

## 🐛 Báo lỗi

Nếu bạn phát hiện lỗi, vui lòng tạo [Issue](https://github.com/khanhduylenguyen/football-field-booking-system/issues) với thông tin:

- Mô tả lỗi
- Các bước tái hiện
- Screenshots (nếu có)
- Môi trường (OS, Browser, Node version)

---

## 📞 Liên hệ

- **GitHub**: [@khanhduylenguyen](https://github.com/khanhduylenguyen)
- **Email**: your.email@example.com

---

## 📄 License

MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

<div align="center">
  <p>Made with ❤️ by Khanh Duy Le Nguyen</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
