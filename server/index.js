import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' })); // Increased limit further for base64 images
app.use(express.urlencoded({ extended: true, limit: '25mb' })); // Increased limit further
// Ensure 413 errors are returned as JSON instead of HTML
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Payload quá lớn. Ảnh vượt quá giới hạn máy chủ.' });
  }
  next(err);
});

// Configure multer for avatar uploads
const UPLOADS_DIR = join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.originalname.split('.').pop();
    cb(null, `avatar-${uniqueSuffix}.${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// Serve uploaded avatars
app.use('/api/uploads/avatars', express.static(UPLOADS_DIR));

// ==================== ADMIN REVENUE ENDPOINTS ====================

// Helper to parse price value
const getPriceValue = (price, priceValue) => {
  if (typeof priceValue === 'number') return priceValue;
  const n = parseInt(String(price || '').replace(/[^\d]/g, '') || '0');
  return isNaN(n) ? 0 : n;
};

// GET /api/admin/revenue/summary
app.get('/api/admin/revenue/summary', (req, res) => {
  try {
    const { dateFrom, dateTo, pitchId } = req.query;
    const bookings = readBookings();
    const inRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      let ok = true;
      if (dateFrom) ok = ok && d >= new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        ok = ok && d <= toEnd;
      }
      return ok;
    };

    const filtered = bookings.filter(b => b.status === 'confirmed' && inRange(b.dateISO) && (!pitchId || b.fieldId === pitchId));
    const cancelled = bookings.filter(b => b.status === 'cancelled' && inRange(b.dateISO) && (!pitchId || b.fieldId === pitchId));

    const totalRevenue = filtered.reduce((sum, b) => sum + getPriceValue(b.price, b.priceValue), 0);
    const ordersConfirmed = filtered.length;
    const totalConsidered = filtered.length + cancelled.length;
    const cancelRate = totalConsidered > 0 ? Math.round((cancelled.length / totalConsidered) * 10000) / 100 : 0;
    const aov = ordersConfirmed > 0 ? Math.round((totalRevenue / ordersConfirmed)) : 0;

    res.json({ success: true, data: { totalRevenue, ordersConfirmed, cancelRate, aov } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy tổng quan doanh thu', error: error.message });
  }
});

// GET /api/admin/revenue/timeseries
app.get('/api/admin/revenue/timeseries', (req, res) => {
  try {
    const { dateFrom, dateTo, pitchId, interval = 'day' } = req.query;
    const bookings = readBookings().filter(b => b.status === 'confirmed');

    const fmtKey = (d) => {
      const yy = d.getFullYear();
      const mm = `${d.getMonth() + 1}`.padStart(2, '0');
      const dd = `${d.getDate()}`.padStart(2, '0');
      if (interval === 'month') return `${yy}-${mm}`;
      if (interval === 'week') {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        return `${yy}-W${String(week).padStart(2, '0')}`;
      }
      return `${yy}-${mm}-${dd}`;
    };

    const inRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      let ok = true;
      if (dateFrom) ok = ok && d >= new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        ok = ok && d <= toEnd;
      }
      return ok;
    };

    const map = {};
    bookings.forEach(b => {
      if (!inRange(b.dateISO)) return;
      if (pitchId && b.fieldId !== pitchId) return;
      const d = new Date(b.dateISO);
      const key = fmtKey(d);
      const val = getPriceValue(b.price, b.priceValue);
      map[key] = map[key] || { date: key, revenue: 0, orders: 0 };
      map[key].revenue += val;
      map[key].orders += 1;
    });

    const series = Object.values(map).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    res.json({ success: true, data: series });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy timeseries doanh thu', error: error.message });
  }
});

// GET /api/admin/revenue/by-pitch
app.get('/api/admin/revenue/by-pitch', (req, res) => {
  try {
    const { dateFrom, dateTo, limit = 10 } = req.query;
    const bookings = readBookings().filter(b => b.status === 'confirmed');
    const pitches = readPitches();

    const inRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      let ok = true;
      if (dateFrom) ok = ok && d >= new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        ok = ok && d <= toEnd;
      }
      return ok;
    };

    const map = {};
    bookings.forEach(b => {
      if (!inRange(b.dateISO)) return;
      const priceVal = getPriceValue(b.price, b.priceValue);
      const id = b.fieldId;
      if (!map[id]) map[id] = { pitchId: id, pitchName: b.fieldName || (pitches.find(p => p.id === id)?.name) || 'Unknown', revenue: 0, orders: 0, cancelled: 0 };
      map[id].revenue += priceVal;
      map[id].orders += 1;
    });

    // add cancel stats
    readBookings().filter(b => b.status === 'cancelled' && inRange(b.dateISO)).forEach(b => {
      const id = b.fieldId;
      map[id] = map[id] || { pitchId: id, pitchName: b.fieldName || (pitches.find(p => p.id === id)?.name) || 'Unknown', revenue: 0, orders: 0, cancelled: 0 };
      map[id].cancelled += 1;
    });

    const rows = Object.values(map).map(r => ({
      pitchId: r.pitchId,
      pitchName: r.pitchName,
      revenue: r.revenue,
      orders: r.orders,
      aov: r.orders > 0 ? Math.round(r.revenue / r.orders) : 0,
      cancelRate: (r.orders + r.cancelled) > 0 ? Math.round((r.cancelled / (r.orders + r.cancelled)) * 10000) / 100 : 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, parseInt(limit));

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy doanh thu theo sân', error: error.message });
  }
});

// Data storage file
const DATA_DIR = join(__dirname, 'data');
const BOOKINGS_FILE = join(DATA_DIR, 'bookings.json');
const PITCHES_FILE = join(DATA_DIR, 'pitches.json');
const USERS_FILE = join(DATA_DIR, 'users.json');
const LOGIN_ATTEMPTS_FILE = join(DATA_DIR, 'loginAttempts.json');
const PROMOTIONS_FILE = join(DATA_DIR, 'promotions.json');
const REVIEWS_FILE = join(DATA_DIR, 'reviews.json');
const NOTIFICATIONS_FILE = join(DATA_DIR, 'notifications.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(PITCHES_FILE)) {
  const defaultPitches = [
    {
      id: "1",
      name: "Sân 5 người - Trong nhà",
      image: "/field-indoor.jpg",
      price: "300.000đ",
      priceValue: 300000,
      location: "Quận 1, TP.HCM",
      capacity: "10",
      type: "5v5",
      description: "Sân 5 người trong nhà, có mái che, điều hòa, phù hợp cho mọi thời tiết."
    },
    {
      id: "2",
      name: "Sân 7 người - Ngoài trời",
      image: "/field-outdoor.jpg",
      price: "500.000đ",
      priceValue: 500000,
      location: "Quận 2, TP.HCM",
      capacity: "14",
      type: "7v7",
      description: "Sân cỏ tự nhiên ngoài trời, không gian thoáng đãng, view đẹp."
    },
    {
      id: "3",
      name: "Sân 11 người - Premium",
      image: "/field-premium.jpg",
      price: "1.200.000đ",
      priceValue: 1200000,
      location: "Quận 7, TP.HCM",
      capacity: "22",
      type: "11v11",
      description: "Sân cỏ tiêu chuẩn quốc tế, hệ thống chiếu sáng hiện đại, phòng thay đồ cao cấp."
    }
  ];
  fs.writeFileSync(PITCHES_FILE, JSON.stringify(defaultPitches, null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(LOGIN_ATTEMPTS_FILE)) {
  fs.writeFileSync(LOGIN_ATTEMPTS_FILE, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(PROMOTIONS_FILE)) {
  fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(REVIEWS_FILE)) {
  // Khởi tạo với dữ liệu mẫu
  const defaultReviews = [
    {
      id: "1",
      name: "Nguyễn Văn A",
      avatar: "NA",
      rating: 5,
      comment: "Sân bóng rất đẹp, sạch sẽ. Nhân viên phục vụ nhiệt tình. Sẽ quay lại đặt tiếp!",
      field: "Sân bóng ABC",
      fieldId: null,
      status: "active",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      name: "Trần Thị B",
      avatar: "TB",
      rating: 5,
      comment: "Đặt sân rất dễ dàng, thanh toán nhanh chóng. Sân chất lượng tốt, giá cả hợp lý.",
      field: "Sân bóng XYZ",
      fieldId: null,
      status: "active",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      name: "Lê Văn C",
      avatar: "LC",
      rating: 4,
      comment: "Giao diện website dễ sử dụng, xem lịch trống rất tiện. Sân đẹp, đèn sáng tốt.",
      field: "Sân bóng DEF",
      fieldId: null,
      status: "active",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      name: "Phạm Thị D",
      avatar: "PD",
      rating: 5,
      comment: "Dịch vụ tuyệt vời! Đặt sân online rất tiện, không cần gọi điện. Sẽ giới thiệu cho bạn bè.",
      field: "Sân bóng GHI",
      fieldId: null,
      status: "active",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "5",
      name: "Hoàng Văn E",
      avatar: "HE",
      rating: 5,
      comment: "Sân cỏ nhân tạo mới, đẹp. Giá cả phải chăng. Hệ thống đặt sân online rất chuyên nghiệp.",
      field: "Sân bóng JKL",
      fieldId: null,
      status: "active",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "6",
      name: "Võ Thị F",
      avatar: "VF",
      rating: 4,
      comment: "Đặt sân nhanh chóng, thanh toán dễ dàng. Sân sạch sẽ, có chỗ để xe rộng rãi.",
      field: "Sân bóng MNO",
      fieldId: null,
      status: "active",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(defaultReviews, null, 2));
}

// Helper functions
const readBookings = () => {
  try {
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeBookings = (bookings) => {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
};

const readPitches = () => {
  try {
    const data = fs.readFileSync(PITCHES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writePitches = (pitches) => {
  fs.writeFileSync(PITCHES_FILE, JSON.stringify(pitches, null, 2));
};

const readPromotions = () => {
  try {
    const data = fs.readFileSync(PROMOTIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writePromotions = (promotions) => {
  fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify(promotions, null, 2));
};

const readReviews = () => {
  try {
    const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeReviews = (reviews) => {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
};

const readNotifications = () => {
  try {
    const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeNotifications = (notifications) => {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
};

// Audit log
const AUDIT_FILE = join(DATA_DIR, 'audit.json');
if (!fs.existsSync(AUDIT_FILE)) {
  fs.writeFileSync(AUDIT_FILE, JSON.stringify([], null, 2));
}
const readAudit = () => {
  try {
    const data = fs.readFileSync(AUDIT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};
const writeAudit = (entry) => {
  const logs = readAudit();
  logs.push({ ...entry, at: new Date().toISOString() });
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2));
};

const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const readLoginAttempts = () => {
  try {
    const data = fs.readFileSync(LOGIN_ATTEMPTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

const writeLoginAttempts = (attempts) => {
  fs.writeFileSync(LOGIN_ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
};

// Simple password hashing (in production, use bcrypt)
const hashPassword = (password) => {
  // Simple hash for demo - in production use bcrypt
  return Buffer.from(password).toString('base64');
};

const comparePassword = (password, hashed) => {
  return hashPassword(password) === hashed;
};

// Tạo tài khoản admin mặc định nếu chưa có
const users = readUsers();
const hasAdmin = users.some(u => u.role === 'admin');
if (!hasAdmin) {
  const defaultAdmin = {
    id: '1',
    email: 'admin@admin.com',
    password: hashPassword('admin123'),
    name: 'Administrator',
    phone: '',
    role: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true
  };
  users.push(defaultAdmin);
  writeUsers(users);
  console.log('✅ Đã tạo tài khoản admin mặc định:');
  console.log('   Email: admin@admin.com');
  console.log('   Password: admin123');
}

// Generate simple JWT-like token
const generateToken = (userId) => {
  const payload = {
    userId,
    iat: Date.now(),
    exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

// Time slots
const timeSlots = [
  "06:00 - 07:30",
  "07:30 - 09:00",
  "09:00 - 10:30",
  "10:30 - 12:00",
  "14:00 - 15:30",
  "15:30 - 17:00",
  "17:00 - 18:30",
  "18:30 - 20:00",
  "20:00 - 21:30"
];

// Routes

// GET / - Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'REST API Server cho ứng dụng Quản lý Sân Bóng',
    version: '1.0.0',
    endpoints: {
      'GET /api/pitches': 'Danh sách sân bóng',
      'GET /api/pitches/:id/available': 'Lịch trống của sân (query: ?date=YYYY-MM-DD)',
      'POST /api/bookings': 'Tạo đơn đặt sân',
      'POST /api/payments/mock': 'Thanh toán giả lập',
      'GET /api/bookings/user/:id': 'Lịch sử đặt sân của người dùng',
      'GET /api/health': 'Health check'
    },
    documentation: 'Xem chi tiết tại server/README.md'
  });
});

// GET /api/pitches - Danh sách sân (public): chỉ trả về sân hoạt động
app.get('/api/pitches', (req, res) => {
  try {
    const { q, type } = req.query;
    const pitches = readPitches();
    let list = pitches.filter(p => (p.status || 'active') === 'active');
    if (q && String(q).trim()) {
      const term = String(q).trim().toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(term) || (p.location || '').toLowerCase().includes(term));
    }
    if (type && String(type).trim() && String(type).toLowerCase() !== 'all') {
      list = list.filter(p => String(p.type || '').toLowerCase() === String(type).toLowerCase());
    }
    // Sắp xếp mới nhất lên trước
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sân',
      error: error.message
    });
  }
});

// GET /api/pitches/:id - Chi tiết sân (public)
app.get('/api/pitches/:id', (req, res) => {
  try {
    const { id } = req.params;
    const pitches = readPitches();
    const pitch = pitches.find(p => p.id === id);
    if (!pitch) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sân' });
    }
    res.json({ success: true, data: pitch });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết sân', error: error.message });
  }
});

// POST /api/admin/pitches/bulk-status - Cập nhật trạng thái nhiều sân
app.post('/api/admin/pitches/bulk-status', (req, res) => {
  try {
    const { pitchIds, status } = req.body;
    if (!Array.isArray(pitchIds) || pitchIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách sân không hợp lệ' });
    }
    if (!['active', 'pending', 'locked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    const pitches = readPitches();
    let updated = 0;
    pitchIds.forEach(id => {
      const idx = pitches.findIndex(p => p.id === id);
      if (idx !== -1) {
        pitches[idx].status = status;
        pitches[idx].updatedAt = new Date().toISOString();
        updated++;
      }
    });
    writePitches(pitches);
    writeAudit({ action: 'bulk_status_pitch', count: updated, status });
    res.json({ success: true, message: `Đã cập nhật trạng thái ${updated} sân`, data: { updated } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái hàng loạt', error: error.message });
  }
});

// GET /api/pitches/:id/available - Lịch trống
app.get('/api/pitches/:id/available', (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tham số date (YYYY-MM-DD)'
      });
    }

    const bookings = readBookings();
    const pitchBookings = bookings.filter(
      booking => 
        booking.fieldId === id && 
        booking.status !== 'cancelled' &&
        booking.dateISO && 
        booking.dateISO.startsWith(date)
    );

    // Get booked time slots for the date
    const bookedSlots = pitchBookings.map(booking => booking.timeSlot);

    // Return available time slots
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots,
        allSlots: timeSlots
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch trống',
      error: error.message
    });
  }
});

// POST /api/bookings - Tạo đơn đặt sân
app.post('/api/bookings', (req, res) => {
  try {
    const { fieldId, fieldName, date, dateISO, timeSlot, name, phone, price } = req.body;

    // Validation
    if (!fieldId || !fieldName || !date || !dateISO || !timeSlot || !name || !phone || !price) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }

    // Check if slot is available
    const bookings = readBookings();
    const conflictingBooking = bookings.find(
      booking =>
        booking.fieldId === fieldId &&
        booking.dateISO === dateISO &&
        booking.timeSlot === timeSlot &&
        booking.status !== 'cancelled'
    );

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Khung giờ này đã được đặt'
      });
    }

    // Calculate priceValue from price string (e.g., "300.000đ" -> 300000)
    const priceValue = parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0;

    // Create new booking
    const newBooking = {
      id: Date.now().toString(),
      fieldId,
      fieldName,
      date,
      dateISO,
      timeSlot,
      name,
      phone,
      price,
      priceValue, // Lưu giá trị số để tính doanh thu
      status: 'pending',
      createdAt: new Date().toISOString(),
      userId: phone // Using phone as user identifier
    };

    bookings.push(newBooking);
    writeBookings(bookings);

    res.status(201).json({
      success: true,
      message: 'Đặt sân thành công',
      data: newBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đơn đặt sân',
      error: error.message
    });
  }
});

// POST /api/payments/mock - Thanh toán giả lập
app.post('/api/payments/mock', (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu bookingId'
      });
    }

    const bookings = readBookings();
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt sân'
      });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Đơn đặt sân đã được thanh toán'
      });
    }

    // Simulate payment processing
    const paymentResult = {
      id: `payment_${Date.now()}`,
      bookingId,
      amount: booking.price,
      paymentMethod: paymentMethod || 'mock',
      status: 'success',
      transactionId: `TXN${Date.now()}`,
      paidAt: new Date().toISOString()
    };

    // Update booking status
    booking.status = 'confirmed';
    booking.payment = paymentResult;
    booking.confirmedAt = new Date().toISOString();

    writeBookings(bookings);

    res.json({
      success: true,
      message: 'Thanh toán thành công',
      data: {
        booking: booking,
        payment: paymentResult
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý thanh toán',
      error: error.message
    });
  }
});

// GET /api/bookings/user/:id - Xem lịch sử đặt sân
app.get('/api/bookings/user/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bookings = readBookings();

    // Filter bookings by user ID (phone number)
    const userBookings = bookings
      .filter(booking => booking.userId === id || booking.phone === id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: userBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử đặt sân',
      error: error.message
    });
  }
});

// Authentication routes

// POST /api/auth/register - Đăng ký
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, phone, role = 'player' } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (email, password, name)'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Password validation (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const users = readUsers();

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashPassword(password),
      name,
      phone: phone || '',
      role: ['player', 'owner', 'admin'].includes(role) ? role : 'player',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.push(newUser);
    writeUsers(users);

    // Generate token
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký',
      error: error.message
    });
  }
});

// POST /api/auth/login - Đăng nhập
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const users = readUsers();
    const loginAttempts = readLoginAttempts();
    const user = users.find(u => u.email === email);

    // Check login attempts (anti-spam)
    const attemptKey = email;
    const attempts = loginAttempts[attemptKey] || { count: 0, lastAttempt: null };
    const now = Date.now();

    // Reset attempts after 15 minutes
    if (attempts.lastAttempt && (now - attempts.lastAttempt) > 15 * 60 * 1000) {
      attempts.count = 0;
    }

    // Block after 5 failed attempts
    if (attempts.count >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Tài khoản tạm thời bị khóa do quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút.'
      });
    }

    // Check if user exists
    if (!user) {
      attempts.count += 1;
      attempts.lastAttempt = now;
      loginAttempts[attemptKey] = attempts;
      writeLoginAttempts(loginAttempts);

      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản bị khóa'
      });
    }

    // Check password
    if (!comparePassword(password, user.password)) {
      attempts.count += 1;
      attempts.lastAttempt = now;
      loginAttempts[attemptKey] = attempts;
      writeLoginAttempts(loginAttempts);

      return res.status(401).json({
        success: false,
        message: 'Sai mật khẩu'
      });
    }

    // Reset login attempts on success
    delete loginAttempts[attemptKey];
    writeLoginAttempts(loginAttempts);

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng nhập',
      error: error.message
    });
  }
});

// POST /api/auth/logout - Đăng xuất
app.post('/api/auth/logout', (req, res) => {
  // In a real app, you might invalidate the token
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

// ==================== USER PROFILE ENDPOINTS ====================

// GET /api/user/profile/:id - Lấy thông tin profile của user
app.get('/api/user/profile/:id', (req, res) => {
  try {
    const { id } = req.params;
    const users = readUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
});

// PUT /api/user/profile/:id - Cập nhật thông tin profile của user
app.put('/api/user/profile/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, phone, password, currentPassword } = req.body;

    console.log('Profile update request:', { id, email, name, phone, hasPassword: !!password });

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if password is being changed
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại'
        });
      }

      // Verify current password
      if (!comparePassword(currentPassword, users[userIndex].password)) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // Validate new password
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      users[userIndex].password = hashPassword(password);
    }

    // Update name if provided
    if (name !== undefined) {
      // Trim whitespace and validate
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (trimmedName.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Họ và tên không được để trống'
        });
      }
      users[userIndex].name = trimmedName;
    }

    // Check if email is being changed and if it's already taken
    if (email !== undefined) {
      // Trim and validate email
      const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (trimmedEmail.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Email không được để trống'
        });
      }
      
      // Only validate and check for duplicates if email is actually changing
      if (trimmedEmail !== users[userIndex].email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Email không hợp lệ'
          });
        }

        if (users.find(u => u.email === trimmedEmail && u.id !== id)) {
          return res.status(409).json({
            success: false,
            message: 'Email đã được sử dụng'
          });
        }
      }
      users[userIndex].email = trimmedEmail;
    }

    // Update phone if provided
    if (phone !== undefined) {
      users[userIndex].phone = phone || '';
    }
    
    users[userIndex].updatedAt = new Date().toISOString();

    console.log('Updated user data:', {
      id: users[userIndex].id,
      name: users[userIndex].name,
      email: users[userIndex].email,
      phone: users[userIndex].phone
    });

    // Write users to file
    try {
      writeUsers(users);
    } catch (writeError) {
      console.error('Error writing users file:', writeError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu dữ liệu',
        error: writeError.message
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = users[userIndex];

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin',
      error: error.message
    });
  }
});

// POST /api/user/profile/:id/avatar - Upload avatar
app.post('/api/user/profile/:id/avatar', upload.single('avatar'), (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file ảnh được tải lên'
      });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Delete old avatar if exists
    if (users[userIndex].avatar) {
      const oldAvatarPath = join(__dirname, users[userIndex].avatar.replace('/api', ''));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user avatar path
    users[userIndex].avatar = `/api/uploads/avatars/${req.file.filename}`;
    users[userIndex].updatedAt = new Date().toISOString();

    writeUsers(users);

    // Remove password from response
    const { password: _, ...userResponse } = users[userIndex];

    res.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: userResponse
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên ảnh đại diện',
      error: error.message
    });
  }
});

// DELETE /api/user/profile/:id/avatar - Delete avatar
app.delete('/api/user/profile/:id/avatar', (req, res) => {
  try {
    const { id } = req.params;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Delete avatar file if exists
    if (users[userIndex].avatar) {
      const avatarPath = join(__dirname, users[userIndex].avatar.replace('/api', ''));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Remove avatar from user
    users[userIndex].avatar = null;
    users[userIndex].updatedAt = new Date().toISOString();

    writeUsers(users);

    // Remove password from response
    const { password: _, ...userResponse } = users[userIndex];

    res.json({
      success: true,
      message: 'Xóa ảnh đại diện thành công',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa ảnh đại diện',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// ==================== ADMIN API ENDPOINTS ====================

// GET /api/admin/dashboard/stats - Thống kê tổng quan
app.get('/api/admin/dashboard/stats', (req, res) => {
  console.log('📊 Dashboard stats endpoint called');
  try {
    const users = readUsers();
    const pitches = readPitches();
    const bookings = readBookings();

    // Thống kê người dùng
    const userStats = {
      total: users.length,
      players: users.filter(u => u.role === 'player').length,
      owners: users.filter(u => u.role === 'owner').length,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };

    // Thống kê sân bóng
    const pitchStats = {
      total: pitches.length,
      active: pitches.filter(p => p.status === 'active' || !p.status).length,
      pending: pitches.filter(p => p.status === 'pending').length,
      locked: pitches.filter(p => p.status === 'locked').length
    };

    // Thống kê đơn đặt sân
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const bookingStats = {
      total: bookings.length,
      today: bookings.filter(b => b.dateISO && b.dateISO.startsWith(today)).length,
      thisWeek: bookings.filter(b => {
        if (!b.dateISO) return false;
        const bookingDate = new Date(b.dateISO);
        return bookingDate >= thisWeek;
      }).length,
      thisMonth: bookings.filter(b => {
        if (!b.dateISO) return false;
        const bookingDate = new Date(b.dateISO);
        return bookingDate >= thisMonth;
      }).length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };

    // Tính doanh thu
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const revenue = {
      total: confirmedBookings.reduce((sum, b) => {
        const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
        return sum + priceValue;
      }, 0),
      today: confirmedBookings
        .filter(b => b.dateISO && b.dateISO.startsWith(today))
        .reduce((sum, b) => {
          const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
          return sum + priceValue;
        }, 0),
      thisMonth: confirmedBookings
        .filter(b => {
          if (!b.dateISO) return false;
          const bookingDate = new Date(b.dateISO);
          return bookingDate >= thisMonth;
        })
        .reduce((sum, b) => {
          const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
          return sum + priceValue;
        }, 0)
    };

    // Top 5 sân được đặt nhiều nhất
    const pitchBookingCounts = {};
    confirmedBookings.forEach(booking => {
      const fieldId = booking.fieldId;
      pitchBookingCounts[fieldId] = (pitchBookingCounts[fieldId] || 0) + 1;
    });

    const topPitches = Object.entries(pitchBookingCounts)
      .map(([fieldId, count]) => {
        const pitch = pitches.find(p => p.id === fieldId);
        return pitch ? { 
          id: pitch.id, 
          name: pitch.name, 
          bookingCount: count 
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    // Đánh giá trung bình (giả lập)
    const averageRating = 4.5;

    res.json({
      success: true,
      data: {
        users: userStats,
        pitches: pitchStats,
        bookings: bookingStats,
        revenue,
        topPitches,
        averageRating
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
});

// GET /api/admin/users - Danh sách người dùng
app.get('/api/admin/users', (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const users = readUsers();

    let filteredUsers = users;
    if (role && role !== 'all') {
      filteredUsers = users.filter(u => u.role === role);
    }

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(start, end);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message
    });
  }
});

// GET /api/admin/users/:id - Lấy chi tiết người dùng
app.get('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const users = readUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
});

// POST /api/admin/users - Tạo người dùng mới
app.post('/api/admin/users', (req, res) => {
  try {
    const { email, password, name, phone, role = 'player' } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (email, password, name)'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const users = readUsers();

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(409).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashPassword(password),
      name,
      phone: phone || '',
      role: ['player', 'owner', 'admin'].includes(role) ? role : 'player',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.push(newUser);
    writeUsers(users);

    // Remove password from response
    const { password: _, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo người dùng',
      error: error.message
    });
  }
});

// PUT /api/admin/users/:id - Cập nhật thông tin người dùng
app.put('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, phone, role, password } = req.body;

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== users[userIndex].email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ'
        });
      }

      if (users.find(u => u.email === email && u.id !== id)) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
      users[userIndex].email = email;
    }

    // Update fields
    if (name) users[userIndex].name = name;
    if (phone !== undefined) users[userIndex].phone = phone;
    if (role && ['player', 'owner', 'admin'].includes(role)) {
      users[userIndex].role = role;
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
      }
      users[userIndex].password = hashPassword(password);
    }

    writeUsers(users);

    // Remove password from response
    const { password: _, ...userResponse } = users[userIndex];

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin',
      error: error.message
    });
  }
});

// DELETE /api/admin/users/:id - Xóa người dùng
app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Prevent deleting yourself
    // Note: You might want to add authentication middleware to get current user
    // For now, we'll just delete the user

    const deletedUser = users.splice(userIndex, 1)[0];
    writeUsers(users);

    // Remove password from response
    const { password: _, ...userResponse } = deletedUser;

    res.json({
      success: true,
      message: 'Xóa người dùng thành công',
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa người dùng',
      error: error.message
    });
  }
});

// PUT /api/admin/users/:id/status - Cập nhật trạng thái người dùng
app.put('/api/admin/users/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    users[userIndex].isActive = isActive !== undefined ? isActive : users[userIndex].isActive;
    writeUsers(users);

    res.json({
      success: true,
      message: isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      data: users[userIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái',
      error: error.message
    });
  }
});

// POST /api/admin/users/bulk-status - Cập nhật trạng thái nhiều người dùng
app.post('/api/admin/users/bulk-status', (req, res) => {
  try {
    const { userIds, isActive } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách người dùng không hợp lệ'
      });
    }

    const users = readUsers();
    let updatedCount = 0;

    userIds.forEach(id => {
      const userIndex = users.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        users[userIndex].isActive = isActive;
        updatedCount++;
      }
    });

    writeUsers(users);

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái ${updatedCount} người dùng`,
      data: { updatedCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái',
      error: error.message
    });
  }
});

// GET /api/admin/users/:id/bookings - Lấy lịch sử đặt sân của người dùng
app.get('/api/admin/users/:id/bookings', (req, res) => {
  try {
    const { id } = req.params;
    const users = readUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const bookings = readBookings();
    // Match by userId (phone) or email
    const userBookings = bookings.filter(
      booking => booking.userId === user.phone || booking.userId === user.email || booking.userId === id
    );

    res.json({
      success: true,
      data: userBookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử đặt sân',
      error: error.message
    });
  }
});

// GET /api/admin/users/:id/stats - Thống kê người dùng
app.get('/api/admin/users/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    const users = readUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const bookings = readBookings();
    const userBookings = bookings.filter(
      booking => booking.userId === user.phone || booking.userId === user.email || booking.userId === id
    );

    const stats = {
      totalBookings: userBookings.length,
      confirmedBookings: userBookings.filter(b => b.status === 'confirmed').length,
      pendingBookings: userBookings.filter(b => b.status === 'pending').length,
      cancelledBookings: userBookings.filter(b => b.status === 'cancelled').length,
      totalSpent: userBookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => {
          const price = parseFloat(b.price.replace(/[^\d]/g, '')) || 0;
          return sum + price;
        }, 0),
      lastBookingDate: userBookings.length > 0
        ? userBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
        : null
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
});

// GET /api/admin/pitches - Danh sách sân bóng (admin)
app.get('/api/admin/pitches', (req, res) => {
  try {
    const { status, page = 1, limit = 10, q, type, minPrice, maxPrice } = req.query;
    const pitches = readPitches();

    let filteredPitches = pitches;
    if (status && status !== 'all') {
      filteredPitches = pitches.filter(p => (p.status || 'active') === status);
    }

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filteredPitches = filteredPitches.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.location || '').toLowerCase().includes(term)
      );
    }

    if (type && type !== 'all') {
      filteredPitches = filteredPitches.filter(p => (p.type || '').toLowerCase() === type.toLowerCase());
    }

    const toNumber = (v) => {
      if (typeof v === 'number') return v;
      if (!v) return 0;
      const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
      return isNaN(n) ? 0 : n;
    };
    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    if (min || max) {
      filteredPitches = filteredPitches.filter(p => {
        const val = toNumber(p.priceValue || p.price);
        if (min && val < min) return false;
        if (max && val > max) return false;
        return true;
      });
    }

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginatedPitches = filteredPitches.slice(start, end);

    res.json({
      success: true,
      data: paginatedPitches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredPitches.length,
        totalPages: Math.ceil(filteredPitches.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sân',
      error: error.message
    });
  }
});

// POST /api/admin/pitches - Tạo sân bóng mới
app.post('/api/admin/pitches', (req, res) => {
  try {
    const { name, location, price, type, status = 'pending', image, slots } = req.body;

    // Validation
    if (!name || !location || !price || !type) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (name, location, price, type)'
      });
    }

    if (!['active', 'pending', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const pitches = readPitches();
    const priceValue = parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0;
    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
    const priceStr = typeof price === 'string' && /\d/.test(price) ? fmt(priceValue) : fmt(priceValue);
    const newPitch = {
      id: Date.now().toString(),
      name,
      location,
      price: priceStr,
      priceValue,
      type,
      status,
      image: image || '',
      slots: Array.isArray(slots) ? slots : [],
      createdAt: new Date().toISOString()
    };

    pitches.push(newPitch);
    writePitches(pitches);

    writeAudit({ action: 'create_pitch', pitchId: newPitch.id, name: newPitch.name });

    res.status(201).json({
      success: true,
      message: 'Tạo sân bóng thành công',
      data: newPitch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo sân bóng',
      error: error.message
    });
  }
});

// PUT /api/admin/pitches/:id - Cập nhật thông tin sân bóng
app.put('/api/admin/pitches/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, price, type, status, image, slots } = req.body;

    const pitches = readPitches();
    const pitchIndex = pitches.findIndex(p => p.id === id);

    if (pitchIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    if (status && !['active', 'pending', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    if (name !== undefined) pitches[pitchIndex].name = name;
    if (location !== undefined) pitches[pitchIndex].location = location;
    if (price !== undefined) {
      const priceValue = parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0;
      pitches[pitchIndex].priceValue = priceValue;
      pitches[pitchIndex].price = new Intl.NumberFormat('vi-VN').format(priceValue) + 'đ';
    }
    if (type !== undefined) pitches[pitchIndex].type = type;
    if (status !== undefined) pitches[pitchIndex].status = status;
    if (image !== undefined) pitches[pitchIndex].image = image;
    if (slots !== undefined && Array.isArray(slots)) pitches[pitchIndex].slots = slots;
    pitches[pitchIndex].updatedAt = new Date().toISOString();

    writePitches(pitches);

    writeAudit({ action: 'update_pitch', pitchId: id });

    res.json({
      success: true,
      message: 'Cập nhật sân bóng thành công',
      data: pitches[pitchIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sân bóng',
      error: error.message
    });
  }
});

// PUT /api/admin/pitches/:id/status - Cập nhật trạng thái sân
app.put('/api/admin/pitches/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const pitches = readPitches();
    const pitchIndex = pitches.findIndex(p => p.id === id);

    if (pitchIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    pitches[pitchIndex].status = status;
    writePitches(pitches);

    res.json({
      success: true,
      message: 'Đã cập nhật trạng thái sân',
      data: pitches[pitchIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái',
      error: error.message
    });
  }
});

// DELETE /api/admin/pitches/:id - Xóa sân
app.delete('/api/admin/pitches/:id', (req, res) => {
  try {
    const { id } = req.params;
    const pitches = readPitches();
    const filteredPitches = pitches.filter(p => p.id !== id);

    if (filteredPitches.length === pitches.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    writePitches(filteredPitches);

    res.json({
      success: true,
      message: 'Đã xóa sân thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sân',
      error: error.message
    });
  }
});

// GET /api/admin/bookings - Danh sách đơn đặt sân
app.get('/api/admin/bookings', (req, res) => {
  try {
    const { status, page = 1, limit = 10, q, dateFrom, dateTo } = req.query;
    const bookings = readBookings();

    let filteredBookings = bookings;
    if (status && status !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.status === status);
    }
    if (q && String(q).trim()) {
      const term = String(q).trim().toLowerCase();
      filteredBookings = filteredBookings.filter(b =>
        (b.name || '').toLowerCase().includes(term) ||
        (b.phone || '').toLowerCase().includes(term) ||
        (b.fieldName || '').toLowerCase().includes(term)
      );
    }
    if (dateFrom) {
      const from = new Date(String(dateFrom));
      filteredBookings = filteredBookings.filter(b => b.dateISO && new Date(b.dateISO) >= from);
    }
    if (dateTo) {
      const to = new Date(String(dateTo));
      const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
      filteredBookings = filteredBookings.filter(b => b.dateISO && new Date(b.dateISO) <= toEnd);
    }

    // Sắp xếp theo ngày tạo mới nhất
    filteredBookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginatedBookings = filteredBookings.slice(start, end);

    res.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredBookings.length,
        totalPages: Math.ceil(filteredBookings.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn đặt sân',
      error: error.message
    });
  }
});

app.post('/api/admin/bookings/bulk-status', (req, res) => {
  try {
    const { bookingIds, status } = req.body;
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách đơn không hợp lệ' });
    }
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }
    const bookings = readBookings();
    let updated = 0;
    bookingIds.forEach(id => {
      const idx = bookings.findIndex(b => b.id === id);
      if (idx !== -1) {
        bookings[idx].status = status;
        if (status === 'confirmed') {
          bookings[idx].confirmedAt = new Date().toISOString();
        }
        updated++;
      }
    });
    writeBookings(bookings);
    res.json({ success: true, message: `Đã cập nhật trạng thái ${updated} đơn`, data: { updated } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái hàng loạt', error: error.message });
  }
});

// PUT /api/admin/bookings/:id/status - Cập nhật trạng thái đơn đặt sân
app.put('/api/admin/bookings/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const bookings = readBookings();
    const bookingIndex = bookings.findIndex(b => b.id === id);

    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt sân'
      });
    }

    bookings[bookingIndex].status = status;
    if (status === 'confirmed') {
      bookings[bookingIndex].confirmedAt = new Date().toISOString();
    }
    writeBookings(bookings);

    res.json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn đặt sân',
      data: bookings[bookingIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái',
      error: error.message
    });
  }
});

// ==================== OWNER API ENDPOINTS ====================

// ==================== OWNER PITCHES ENDPOINTS ====================

// GET /api/owner/pitches - Danh sách sân bóng của owner
app.get('/api/owner/pitches', (req, res) => {
  try {
    const { status, page = 1, limit = 10, q, type, minPrice, maxPrice } = req.query;
    const pitches = readPitches();

    // Tạm thời lấy tất cả sân, có thể filter theo ownerId sau khi có authentication
    let filteredPitches = pitches;
    
    if (status && status !== 'all') {
      filteredPitches = filteredPitches.filter(p => (p.status || 'active') === status);
    }

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filteredPitches = filteredPitches.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.location || '').toLowerCase().includes(term)
      );
    }

    if (type && type !== 'all') {
      filteredPitches = filteredPitches.filter(p => (p.type || '').toLowerCase() === type.toLowerCase());
    }

    const toNumber = (v) => {
      if (typeof v === 'number') return v;
      if (!v) return 0;
      const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
      return isNaN(n) ? 0 : n;
    };
    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    if (min || max) {
      filteredPitches = filteredPitches.filter(p => {
        const val = toNumber(p.priceValue || p.price);
        if (min && val < min) return false;
        if (max && val > max) return false;
        return true;
      });
    }

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginatedPitches = filteredPitches.slice(start, end);

    res.json({
      success: true,
      data: paginatedPitches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredPitches.length,
        totalPages: Math.ceil(filteredPitches.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sân',
      error: error.message
    });
  }
});

// POST /api/owner/pitches - Tạo sân bóng mới
app.post('/api/owner/pitches', (req, res) => {
  try {
    console.log('📝 POST /api/owner/pitches - Request received');
    const { name, location, price, type, status = 'pending', image, slots } = req.body;

    // Validation
    if (!name || !location || !price || !type) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (name, location, price, type)'
      });
    }

    if (!['active', 'pending', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Xử lý ảnh: nếu là base64 quá lớn (>1MB), chỉ lưu URL hoặc bỏ qua
    let imageUrl = image || '';
    if (imageUrl && imageUrl.startsWith('data:image')) {
      // Base64 image
      const base64Length = imageUrl.length;
      const sizeInMB = (base64Length * 3) / 4 / 1024 / 1024; // Approximate size
      if (sizeInMB > 1) {
        console.warn(`⚠️ Ảnh base64 quá lớn (${sizeInMB.toFixed(2)}MB), chỉ lưu URL nếu có`);
        // Nếu có URL trong image (trường hợp user nhập cả URL và upload), ưu tiên URL
        imageUrl = '';
      }
    }

    const pitches = readPitches();
    const priceValue = parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0;
    if (priceValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá phải là số lớn hơn 0'
      });
    }
    
    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
    const priceStr = fmt(priceValue);
    
    const newPitch = {
      id: Date.now().toString(),
      name: String(name).trim(),
      location: String(location).trim(),
      price: priceStr,
      priceValue,
      type: String(type).trim(),
      status,
      image: imageUrl,
      slots: Array.isArray(slots) ? slots.filter(Boolean) : [],
      createdAt: new Date().toISOString()
    };

    pitches.push(newPitch);
    writePitches(pitches);

    console.log(`✅ Tạo sân thành công: ${newPitch.name} (ID: ${newPitch.id})`);
    res.status(201).json({
      success: true,
      message: 'Tạo sân bóng thành công',
      data: newPitch
    });
  } catch (error) {
    console.error('❌ Lỗi khi tạo sân:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo sân bóng',
      error: error.message
    });
  }
});

// PUT /api/owner/pitches/:id - Cập nhật thông tin sân bóng
app.put('/api/owner/pitches/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, price, type, status, image, slots } = req.body;

    const pitches = readPitches();
    const pitchIndex = pitches.findIndex(p => p.id === id);

    if (pitchIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    if (status && !['active', 'pending', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    if (name !== undefined) pitches[pitchIndex].name = name;
    if (location !== undefined) pitches[pitchIndex].location = location;
    if (price !== undefined) {
      const priceValue = parseInt(String(price).replace(/[^\d]/g, ''), 10) || 0;
      pitches[pitchIndex].priceValue = priceValue;
      pitches[pitchIndex].price = new Intl.NumberFormat('vi-VN').format(priceValue) + 'đ';
    }
    if (type !== undefined) pitches[pitchIndex].type = type;
    if (status !== undefined) pitches[pitchIndex].status = status;
    if (image !== undefined) pitches[pitchIndex].image = image;
    if (slots !== undefined && Array.isArray(slots)) pitches[pitchIndex].slots = slots;
    pitches[pitchIndex].updatedAt = new Date().toISOString();

    writePitches(pitches);

    res.json({
      success: true,
      message: 'Cập nhật sân bóng thành công',
      data: pitches[pitchIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật sân bóng',
      error: error.message
    });
  }
});

// PUT /api/owner/pitches/:id/status - Cập nhật trạng thái sân
app.put('/api/owner/pitches/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const pitches = readPitches();
    const pitchIndex = pitches.findIndex(p => p.id === id);

    if (pitchIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    pitches[pitchIndex].status = status;
    writePitches(pitches);

    res.json({
      success: true,
      message: 'Đã cập nhật trạng thái sân',
      data: pitches[pitchIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái',
      error: error.message
    });
  }
});

// DELETE /api/owner/pitches/:id - Xóa sân
app.delete('/api/owner/pitches/:id', (req, res) => {
  try {
    const { id } = req.params;
    const pitches = readPitches();
    const filteredPitches = pitches.filter(p => p.id !== id);

    if (filteredPitches.length === pitches.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sân'
      });
    }

    writePitches(filteredPitches);

    res.json({
      success: true,
      message: 'Đã xóa sân thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sân',
      error: error.message
    });
  }
});

// GET /api/owner/dashboard/stats - Thống kê tổng quan cho chủ sân
app.get('/api/owner/dashboard/stats', (req, res) => {
  console.log('📊 Owner Dashboard stats endpoint called');
  try {
    const pitches = readPitches();
    const bookings = readBookings();
    const users = readUsers();

    // Lấy thông tin owner từ token (giả lập - trong thực tế cần parse JWT)
    // Tạm thời lấy tất cả sân, có thể filter theo ownerId sau
    // Giả định owner có thể xem tất cả sân hoặc sân được gán cho họ

    // Thống kê sân bóng (tất cả sân hoặc sân của owner)
    const pitchStats = {
      total: pitches.length,
      active: pitches.filter(p => p.status === 'active' || !p.status).length,
      pending: pitches.filter(p => p.status === 'pending').length,
      locked: pitches.filter(p => p.status === 'locked').length
    };

    // Thống kê đơn đặt sân
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const bookingStats = {
      total: bookings.length,
      today: bookings.filter(b => b.dateISO && b.dateISO.startsWith(today)).length,
      thisWeek: bookings.filter(b => {
        if (!b.dateISO) return false;
        const bookingDate = new Date(b.dateISO);
        return bookingDate >= thisWeek;
      }).length,
      thisMonth: bookings.filter(b => {
        if (!b.dateISO) return false;
        const bookingDate = new Date(b.dateISO);
        return bookingDate >= thisMonth;
      }).length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };

    // Tính doanh thu
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const revenue = {
      total: confirmedBookings.reduce((sum, b) => {
        const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
        return sum + priceValue;
      }, 0),
      today: confirmedBookings
        .filter(b => b.dateISO && b.dateISO.startsWith(today))
        .reduce((sum, b) => {
          const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
          return sum + priceValue;
        }, 0),
      thisMonth: confirmedBookings
        .filter(b => {
          if (!b.dateISO) return false;
          const bookingDate = new Date(b.dateISO);
          return bookingDate >= thisMonth;
        })
        .reduce((sum, b) => {
          const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
          return sum + priceValue;
        }, 0)
    };

    // Top 5 sân được đặt nhiều nhất với doanh thu
    const pitchBookingCounts = {};
    const pitchRevenue = {};
    confirmedBookings.forEach(booking => {
      const fieldId = booking.fieldId;
      const priceValue = booking.priceValue || parseInt(booking.price?.replace(/[^\d]/g, '') || '0');
      
      pitchBookingCounts[fieldId] = (pitchBookingCounts[fieldId] || 0) + 1;
      pitchRevenue[fieldId] = (pitchRevenue[fieldId] || 0) + priceValue;
    });

    const topPitches = Object.entries(pitchBookingCounts)
      .map(([fieldId, count]) => {
        const pitch = pitches.find(p => p.id === fieldId);
        return pitch ? { 
          id: pitch.id, 
          name: pitch.name, 
          bookingCount: count,
          revenue: pitchRevenue[fieldId] || 0
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        pitches: pitchStats,
        bookings: bookingStats,
        revenue,
        topPitches
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
});

// ==================== OWNER BOOKINGS ENDPOINTS ====================

// GET /api/owner/bookings - Danh sách đơn đặt sân của owner
app.get('/api/owner/bookings', (req, res) => {
  try {
    const { status, page = 1, limit = 10, q, dateFrom, dateTo, pitchId } = req.query;
    const bookings = readBookings();
    const pitches = readPitches();

    // Tạm thời lấy tất cả bookings, có thể filter theo ownerId sau khi có authentication
    // Giả định owner có thể xem bookings của tất cả sân hoặc sân được gán cho họ
    let filteredBookings = bookings;

    // Filter theo pitchId nếu có
    if (pitchId && pitchId !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.fieldId === pitchId);
    }

    // Filter theo trạng thái
    if (status && status !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.status === status);
    }

    // Filter theo search query
    if (q && String(q).trim()) {
      const term = String(q).trim().toLowerCase();
      filteredBookings = filteredBookings.filter(b =>
        (b.name || '').toLowerCase().includes(term) ||
        (b.phone || '').toLowerCase().includes(term) ||
        (b.fieldName || '').toLowerCase().includes(term)
      );
    }

    // Filter theo ngày
    if (dateFrom) {
      const from = new Date(String(dateFrom));
      filteredBookings = filteredBookings.filter(b => b.dateISO && new Date(b.dateISO) >= from);
    }
    if (dateTo) {
      const to = new Date(String(dateTo));
      const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
      filteredBookings = filteredBookings.filter(b => b.dateISO && new Date(b.dateISO) <= toEnd);
    }

    // Sắp xếp theo ngày tạo mới nhất
    filteredBookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginatedBookings = filteredBookings.slice(start, end);

    res.json({
      success: true,
      data: paginatedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredBookings.length,
        totalPages: Math.ceil(filteredBookings.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn đặt sân',
      error: error.message
    });
  }
});

// PUT /api/owner/bookings/:id/status - Cập nhật trạng thái đơn đặt sân
app.put('/api/owner/bookings/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const bookings = readBookings();
    const bookingIndex = bookings.findIndex(b => b.id === id);

    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt sân'
      });
    }

    bookings[bookingIndex].status = status;
    if (status === 'confirmed') {
      bookings[bookingIndex].confirmedAt = new Date().toISOString();
    }
    writeBookings(bookings);

    res.json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn đặt sân',
      data: bookings[bookingIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái',
      error: error.message
    });
  }
});

// GET /api/owner/bookings/stats - Thống kê đơn đặt sân của owner
app.get('/api/owner/bookings/stats', (req, res) => {
  try {
    const bookings = readBookings();
    const pitches = readPitches();

    // Tạm thời lấy tất cả bookings, có thể filter theo ownerId sau
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const stats = {
      total: bookings.length,
      today: bookings.filter(b => b.dateISO && b.dateISO.startsWith(today)).length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      revenue: {
        total: bookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => {
            const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
            return sum + priceValue;
          }, 0),
        today: bookings
          .filter(b => b.status === 'confirmed' && b.dateISO && b.dateISO.startsWith(today))
          .reduce((sum, b) => {
            const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
            return sum + priceValue;
          }, 0),
        thisMonth: bookings
          .filter(b => {
            if (!b.dateISO || b.status !== 'confirmed') return false;
            const bookingDate = new Date(b.dateISO);
            return bookingDate >= thisMonth;
          })
          .reduce((sum, b) => {
            const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
            return sum + priceValue;
          }, 0)
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
});

// ==================== OWNER REVENUE ENDPOINTS ====================

// GET /api/owner/revenue/summary - Tổng quan doanh thu
app.get('/api/owner/revenue/summary', (req, res) => {
  try {
    const { dateFrom, dateTo, pitchId } = req.query;
    const bookings = readBookings();
    const pitches = readPitches();

    const inRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      let ok = true;
      if (dateFrom) ok = ok && d >= new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        ok = ok && d <= toEnd;
      }
      return ok;
    };

    const filtered = bookings.filter(b => 
      b.status === 'confirmed' && 
      inRange(b.dateISO) && 
      (!pitchId || pitchId === 'all' || b.fieldId === pitchId)
    );
    const cancelled = bookings.filter(b => 
      b.status === 'cancelled' && 
      inRange(b.dateISO) && 
      (!pitchId || pitchId === 'all' || b.fieldId === pitchId)
    );

    const totalRevenue = filtered.reduce((sum, b) => {
      const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
      return sum + priceValue;
    }, 0);
    const ordersConfirmed = filtered.length;
    const totalConsidered = filtered.length + cancelled.length;
    const cancelRate = totalConsidered > 0 ? Math.round((cancelled.length / totalConsidered) * 10000) / 100 : 0;
    const aov = ordersConfirmed > 0 ? Math.round((totalRevenue / ordersConfirmed)) : 0;

    // Tính theo kỳ
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    const thisYear = new Date();
    thisYear.setFullYear(thisYear.getFullYear() - 1);

    const revenueToday = bookings
      .filter(b => b.status === 'confirmed' && b.dateISO && b.dateISO.startsWith(today))
      .reduce((sum, b) => {
        const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
        return sum + priceValue;
      }, 0);

    const revenueThisWeek = bookings
      .filter(b => {
        if (!b.dateISO || b.status !== 'confirmed') return false;
        const bookingDate = new Date(b.dateISO);
        return bookingDate >= thisWeek;
      })
      .reduce((sum, b) => {
        const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
        return sum + priceValue;
      }, 0);

    const revenueThisMonth = bookings
      .filter(b => {
        if (!b.dateISO || b.status !== 'confirmed') return false;
        const bookingDate = new Date(b.dateISO);
        return bookingDate >= thisMonth;
      })
      .reduce((sum, b) => {
        const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
        return sum + priceValue;
      }, 0);

    const revenueThisYear = bookings
      .filter(b => {
        if (!b.dateISO || b.status !== 'confirmed') return false;
        const bookingDate = new Date(b.dateISO);
        return bookingDate >= thisYear;
      })
      .reduce((sum, b) => {
        const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
        return sum + priceValue;
      }, 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        ordersConfirmed,
        cancelRate,
        aov,
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        revenueThisYear
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tổng quan doanh thu',
      error: error.message
    });
  }
});

// GET /api/owner/revenue/timeseries - Doanh thu theo thời gian
app.get('/api/owner/revenue/timeseries', (req, res) => {
  try {
    const { dateFrom, dateTo, pitchId, interval = 'day' } = req.query;
    const bookings = readBookings().filter(b => b.status === 'confirmed');

    const fmtKey = (d) => {
      const yy = d.getFullYear();
      const mm = `${d.getMonth() + 1}`.padStart(2, '0');
      const dd = `${d.getDate()}`.padStart(2, '0');
      if (interval === 'month') return `${yy}-${mm}`;
      if (interval === 'week') {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        return `${yy}-W${String(week).padStart(2, '0')}`;
      }
      return `${yy}-${mm}-${dd}`;
    };

    const inRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      let ok = true;
      if (dateFrom) ok = ok && d >= new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        ok = ok && d <= toEnd;
      }
      return ok;
    };

    const map = {};
    bookings.forEach(b => {
      if (!inRange(b.dateISO)) return;
      if (pitchId && pitchId !== 'all' && b.fieldId !== pitchId) return;
      const d = new Date(b.dateISO);
      const key = fmtKey(d);
      const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
      map[key] = map[key] || { date: key, revenue: 0, orders: 0 };
      map[key].revenue += priceValue;
      map[key].orders += 1;
    });

    const series = Object.values(map).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    res.json({ success: true, data: series });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy timeseries doanh thu',
      error: error.message
    });
  }
});

// GET /api/owner/revenue/by-pitch - Doanh thu theo sân
app.get('/api/owner/revenue/by-pitch', (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const bookings = readBookings();
    const pitches = readPitches();

    const inRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      let ok = true;
      if (dateFrom) ok = ok && d >= new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        ok = ok && d <= toEnd;
      }
      return ok;
    };

    const pitchStats = {};
    bookings.forEach(b => {
      if (b.status !== 'confirmed' || !inRange(b.dateISO)) return;
      const fieldId = b.fieldId;
      const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
      
      if (!pitchStats[fieldId]) {
        pitchStats[fieldId] = { pitchId: fieldId, revenue: 0, orders: 0, cancelled: 0 };
      }
      pitchStats[fieldId].revenue += priceValue;
      pitchStats[fieldId].orders += 1;
    });

    // Đếm cancelled
    bookings.forEach(b => {
      if (b.status !== 'cancelled' || !inRange(b.dateISO)) return;
      const fieldId = b.fieldId;
      if (pitchStats[fieldId]) {
        pitchStats[fieldId].cancelled += 1;
      }
    });

    const result = Object.values(pitchStats)
      .map(stat => {
        const pitch = pitches.find(p => p.id === stat.pitchId);
        if (!pitch) return null;
        const total = stat.orders + stat.cancelled;
        const cancelRate = total > 0 ? Math.round((stat.cancelled / total) * 10000) / 100 : 0;
        const aov = stat.orders > 0 ? Math.round((stat.revenue / stat.orders)) : 0;
        return {
          pitchId: stat.pitchId,
          pitchName: pitch.name,
          revenue: stat.revenue,
          orders: stat.orders,
          cancelled: stat.cancelled,
          cancelRate,
          aov
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.revenue - a.revenue);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy doanh thu theo sân',
      error: error.message
    });
  }
});

// GET /api/owner/revenue/by-timeslot - Doanh thu theo khung giờ
app.get('/api/owner/revenue/by-timeslot', (req, res) => {
  try {
    const { dateFrom, dateTo, pitchId } = req.query;
    const bookings = readBookings();

    const inRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      let ok = true;
      if (dateFrom) ok = ok && d >= new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        ok = ok && d <= toEnd;
      }
      return ok;
    };

    const timeslotStats = {};
    bookings.forEach(b => {
      if (b.status !== 'confirmed' || !inRange(b.dateISO)) return;
      if (pitchId && pitchId !== 'all' && b.fieldId !== pitchId) return;
      
      const timeSlot = b.timeSlot || 'N/A';
      const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
      
      if (!timeslotStats[timeSlot]) {
        timeslotStats[timeSlot] = { timeSlot, revenue: 0, orders: 0 };
      }
      timeslotStats[timeSlot].revenue += priceValue;
      timeslotStats[timeSlot].orders += 1;
    });

    const result = Object.values(timeslotStats)
      .map(stat => ({
        ...stat,
        aov: stat.orders > 0 ? Math.round((stat.revenue / stat.orders)) : 0
      }))
      .sort((a, b) => b.orders - a.orders);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy doanh thu theo khung giờ',
      error: error.message
    });
  }
});

// GET /api/owner/revenue/trends - Xu hướng so sánh với kỳ trước
app.get('/api/owner/revenue/trends', (req, res) => {
  try {
    const bookings = readBookings();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Tuần này
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    // Tháng này
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // Năm này
    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

    const getRevenue = (start, end) => {
      return bookings
        .filter(b => {
          if (b.status !== 'confirmed' || !b.dateISO) return false;
          const d = new Date(b.dateISO);
          return d >= start && d <= end;
        })
        .reduce((sum, b) => {
          const priceValue = b.priceValue || parseInt(b.price?.replace(/[^\d]/g, '') || '0');
          return sum + priceValue;
        }, 0);
    };

    const getOrders = (start, end) => {
      return bookings.filter(b => {
        if (b.status !== 'confirmed' || !b.dateISO) return false;
        const d = new Date(b.dateISO);
        return d >= start && d <= end;
      }).length;
    };

    const thisWeekRevenue = getRevenue(thisWeekStart, today);
    const lastWeekRevenue = getRevenue(lastWeekStart, lastWeekEnd);
    const thisWeekOrders = getOrders(thisWeekStart, today);
    const lastWeekOrders = getOrders(lastWeekStart, lastWeekEnd);

    const thisMonthRevenue = getRevenue(thisMonthStart, today);
    const lastMonthRevenue = getRevenue(lastMonthStart, lastMonthEnd);
    const thisMonthOrders = getOrders(thisMonthStart, today);
    const lastMonthOrders = getOrders(lastMonthStart, lastMonthEnd);

    const thisYearRevenue = getRevenue(thisYearStart, today);
    const lastYearRevenue = getRevenue(lastYearStart, lastYearEnd);
    const thisYearOrders = getOrders(thisYearStart, today);
    const lastYearOrders = getOrders(lastYearStart, lastYearEnd);

    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    res.json({
      success: true,
      data: {
        week: {
          revenue: thisWeekRevenue,
          revenueChange: calcChange(thisWeekRevenue, lastWeekRevenue),
          orders: thisWeekOrders,
          ordersChange: calcChange(thisWeekOrders, lastWeekOrders)
        },
        month: {
          revenue: thisMonthRevenue,
          revenueChange: calcChange(thisMonthRevenue, lastMonthRevenue),
          orders: thisMonthOrders,
          ordersChange: calcChange(thisMonthOrders, lastMonthOrders)
        },
        year: {
          revenue: thisYearRevenue,
          revenueChange: calcChange(thisYearRevenue, lastYearRevenue),
          orders: thisYearOrders,
          ordersChange: calcChange(thisYearOrders, lastYearOrders)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy xu hướng doanh thu',
      error: error.message
    });
  }
});

// ==================== PROMOTIONS & NEWS ENDPOINTS ====================

// GET /api/promotions - Lấy danh sách tin tức và khuyến mãi (public)
app.get('/api/promotions', (req, res) => {
  try {
    const { type, page = 1, limit = 10, q } = req.query;
    let promotions = readPromotions();
    
    // Chỉ hiển thị promotions/news có status active hoặc published cho public
    promotions = promotions.filter(p => 
      p.status === 'active' || p.status === 'published'
    );
    
    // Filter theo type (promotion/news)
    if (type && type !== 'all') {
      promotions = promotions.filter(p => p.type === type);
    }
    
    // Filter theo search query
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      promotions = promotions.filter(p =>
        (p.title || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.content || '').toLowerCase().includes(term)
      );
    }
    
    // Sắp xếp mới nhất lên trước
    promotions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    // Pagination
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginated = promotions.slice(start, end);
    
    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: promotions.length,
        totalPages: Math.ceil(promotions.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tin tức và khuyến mãi',
      error: error.message
    });
  }
});

// GET /api/promotions/:id - Chi tiết tin tức/khuyến mãi (public)
app.get('/api/promotions/:id', (req, res) => {
  try {
    const promotions = readPromotions();
    const promotion = promotions.find(p => p.id === req.params.id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức/khuyến mãi'
      });
    }
    
    res.json({
      success: true,
      data: promotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết',
      error: error.message
    });
  }
});

// GET /api/admin/promotions - Lấy danh sách tin tức/khuyến mãi (admin - tất cả)
app.get('/api/admin/promotions', (req, res) => {
  try {
    const { type, status, search } = req.query;
    let promotions = readPromotions();
    
    // Filter theo type (promotion/news)
    if (type && type !== 'all') {
      promotions = promotions.filter(p => p.type === type);
    }
    
    // Filter theo status
    if (status && status !== 'all') {
      promotions = promotions.filter(p => p.status === status);
    }
    
    // Filter theo search query
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      promotions = promotions.filter(p =>
        (p.title || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.content || '').toLowerCase().includes(term)
      );
    }
    
    // Sắp xếp mới nhất lên trước
    promotions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tin tức và khuyến mãi',
      error: error.message
    });
  }
});

// POST /api/admin/promotions - Tạo tin tức/khuyến mãi mới (admin)
app.post('/api/admin/promotions', (req, res) => {
  try {
    const { title, description, content, type, image, discount, badge, startDate, endDate, status } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và loại là bắt buộc'
      });
    }
    
    const promotions = readPromotions();
    const newPromotion = {
      id: Date.now().toString(),
      title,
      description: description || '',
      content: content || '',
      type, // 'promotion' hoặc 'news'
      image: image || '',
      discount: discount || '',
      badge: badge || '',
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'active',
      createdBy: 'admin', // Có thể lấy từ token sau
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    promotions.push(newPromotion);
    writePromotions(promotions);
    
    res.json({
      success: true,
      message: 'Tạo tin tức/khuyến mãi thành công',
      data: newPromotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tin tức/khuyến mãi',
      error: error.message
    });
  }
});

// PUT /api/admin/promotions/:id - Cập nhật tin tức/khuyến mãi (admin)
app.put('/api/admin/promotions/:id', (req, res) => {
  try {
    const promotions = readPromotions();
    const index = promotions.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức/khuyến mãi'
      });
    }
    
    const { title, description, content, type, image, discount, badge, startDate, endDate, status } = req.body;
    
    promotions[index] = {
      ...promotions[index],
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(content !== undefined && { content }),
      ...(type && { type }),
      ...(image !== undefined && { image }),
      ...(discount !== undefined && { discount }),
      ...(badge !== undefined && { badge }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(status !== undefined && { status }),
      updatedAt: new Date().toISOString()
    };
    
    writePromotions(promotions);
    
    res.json({
      success: true,
      message: 'Cập nhật thành công',
      data: promotions[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật',
      error: error.message
    });
  }
});

// DELETE /api/admin/promotions/:id - Xóa tin tức/khuyến mãi (admin)
app.delete('/api/admin/promotions/:id', (req, res) => {
  try {
    const promotions = readPromotions();
    const filtered = promotions.filter(p => p.id !== req.params.id);
    
    if (filtered.length === promotions.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức/khuyến mãi'
      });
    }
    
    writePromotions(filtered);
    
    res.json({
      success: true,
      message: 'Xóa thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa',
      error: error.message
    });
  }
});

// GET /api/owner/promotions - Lấy danh sách tin tức/khuyến mãi (owner - chỉ của owner)
app.get('/api/owner/promotions', (req, res) => {
  try {
    const { type, status, search } = req.query;
    let promotions = readPromotions();
    
    // Chỉ lấy promotions của owner
    promotions = promotions.filter(p => p.createdBy === 'owner');
    
    // Filter theo type (promotion/news)
    if (type && type !== 'all') {
      promotions = promotions.filter(p => p.type === type);
    }
    
    // Filter theo status
    if (status && status !== 'all') {
      promotions = promotions.filter(p => p.status === status);
    }
    
    // Filter theo search query
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      promotions = promotions.filter(p =>
        (p.title || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.content || '').toLowerCase().includes(term)
      );
    }
    
    // Sắp xếp mới nhất lên trước
    promotions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tin tức và khuyến mãi',
      error: error.message
    });
  }
});

// POST /api/owner/promotions - Tạo tin tức/khuyến mãi mới (owner)
app.post('/api/owner/promotions', (req, res) => {
  try {
    const { title, description, content, type, image, discount, badge, startDate, endDate, status } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và loại là bắt buộc'
      });
    }
    
    const promotions = readPromotions();
    const newPromotion = {
      id: Date.now().toString(),
      title,
      description: description || '',
      content: content || '',
      type, // 'promotion' hoặc 'news'
      image: image || '',
      discount: discount || '',
      badge: badge || '',
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'active',
      createdBy: 'owner', // Có thể lấy từ token sau
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    promotions.push(newPromotion);
    writePromotions(promotions);
    
    res.json({
      success: true,
      message: 'Tạo tin tức/khuyến mãi thành công',
      data: newPromotion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tin tức/khuyến mãi',
      error: error.message
    });
  }
});

// PUT /api/owner/promotions/:id - Cập nhật tin tức/khuyến mãi (owner)
app.put('/api/owner/promotions/:id', (req, res) => {
  try {
    const promotions = readPromotions();
    const index = promotions.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức/khuyến mãi'
      });
    }
    
    // Kiểm tra quyền sở hữu (tạm thời bỏ qua, sẽ thêm sau khi có auth)
    // if (promotions[index].createdBy !== 'owner') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Không có quyền chỉnh sửa'
    //   });
    // }
    
    const { title, description, content, type, image, discount, badge, startDate, endDate, status } = req.body;
    
    promotions[index] = {
      ...promotions[index],
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(content !== undefined && { content }),
      ...(type && { type }),
      ...(image !== undefined && { image }),
      ...(discount !== undefined && { discount }),
      ...(badge !== undefined && { badge }),
      ...(startDate !== undefined && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(status !== undefined && { status }),
      updatedAt: new Date().toISOString()
    };
    
    writePromotions(promotions);
    
    res.json({
      success: true,
      message: 'Cập nhật thành công',
      data: promotions[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật',
      error: error.message
    });
  }
});

// DELETE /api/owner/promotions/:id - Xóa tin tức/khuyến mãi (owner)
app.delete('/api/owner/promotions/:id', (req, res) => {
  try {
    const promotions = readPromotions();
    const promotion = promotions.find(p => p.id === req.params.id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin tức/khuyến mãi'
      });
    }
    
    // Kiểm tra quyền sở hữu (tạm thời bỏ qua)
    // if (promotion.createdBy !== 'owner') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Không có quyền xóa'
    //   });
    // }
    
    const filtered = promotions.filter(p => p.id !== req.params.id);
    writePromotions(filtered);
    
    res.json({
      success: true,
      message: 'Xóa thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa',
      error: error.message
    });
  }
});

// ==================== REVIEWS ENDPOINTS ====================

// GET /api/reviews - Lấy danh sách đánh giá (public - chỉ active)
app.get('/api/reviews', (req, res) => {
  try {
    const { limit } = req.query;
    let reviews = readReviews();
    
    // Chỉ hiển thị reviews có status active
    reviews = reviews.filter(r => r.status === 'active');
    
    // Sắp xếp mới nhất lên trước
    reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    // Limit số lượng
    if (limit) {
      reviews = reviews.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đánh giá',
      error: error.message
    });
  }
});

// GET /api/admin/reviews - Lấy danh sách đánh giá (admin - tất cả)
app.get('/api/admin/reviews', (req, res) => {
  try {
    const { status, search, fieldId } = req.query;
    let reviews = readReviews();
    
    // Filter theo status
    if (status && status !== 'all') {
      reviews = reviews.filter(r => r.status === status);
    }
    
    // Filter theo fieldId
    if (fieldId && fieldId !== 'all') {
      reviews = reviews.filter(r => r.fieldId === fieldId);
    }
    
    // Filter theo search query
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      reviews = reviews.filter(r =>
        (r.name || '').toLowerCase().includes(term) ||
        (r.comment || '').toLowerCase().includes(term) ||
        (r.field || '').toLowerCase().includes(term)
      );
    }
    
    // Sắp xếp mới nhất lên trước
    reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đánh giá',
      error: error.message
    });
  }
});

// POST /api/admin/reviews - Tạo đánh giá mới (admin)
app.post('/api/admin/reviews', (req, res) => {
  try {
    const { name, avatar, rating, comment, field, fieldId, status } = req.body;
    
    if (!name || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Tên, đánh giá và bình luận là bắt buộc'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }
    
    const reviews = readReviews();
    
    // Tạo avatar từ tên nếu không có
    let reviewAvatar = avatar;
    if (!reviewAvatar && name) {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        reviewAvatar = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else {
        reviewAvatar = name.substring(0, 2).toUpperCase();
      }
    }
    
    const newReview = {
      id: Date.now().toString(),
      name,
      avatar: reviewAvatar,
      rating: parseInt(rating),
      comment,
      field: field || '',
      fieldId: fieldId || null,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    reviews.push(newReview);
    writeReviews(reviews);
    
    res.status(201).json({
      success: true,
      message: 'Tạo đánh giá thành công',
      data: newReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đánh giá',
      error: error.message
    });
  }
});

// PUT /api/admin/reviews/:id - Cập nhật đánh giá (admin)
app.put('/api/admin/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, rating, comment, field, fieldId, status } = req.body;
    
    const reviews = readReviews();
    const index = reviews.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }
    
    // Tạo avatar từ tên nếu không có
    let reviewAvatar = avatar;
    if (!reviewAvatar && name) {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        reviewAvatar = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else {
        reviewAvatar = name.substring(0, 2).toUpperCase();
      }
    }
    
    reviews[index] = {
      ...reviews[index],
      ...(name && { name }),
      ...(reviewAvatar && { avatar: reviewAvatar }),
      ...(rating !== undefined && { rating: parseInt(rating) }),
      ...(comment !== undefined && { comment }),
      ...(field !== undefined && { field }),
      ...(fieldId !== undefined && { fieldId }),
      ...(status !== undefined && { status }),
      updatedAt: new Date().toISOString()
    };
    
    writeReviews(reviews);
    
    res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: reviews[index]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật đánh giá',
      error: error.message
    });
  }
});

// DELETE /api/admin/reviews/:id - Xóa đánh giá (admin)
app.delete('/api/admin/reviews/:id', (req, res) => {
  try {
    const reviews = readReviews();
    const filtered = reviews.filter(r => r.id !== req.params.id);
    
    if (filtered.length === reviews.length) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }
    
    writeReviews(filtered);
    
    res.json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa đánh giá',
      error: error.message
    });
  }
});

// ==================== NOTIFICATION ENDPOINTS ====================

// GET /api/notifications/:userId - Get all notifications for a user
app.get('/api/notifications/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = readNotifications();
    const userNotifications = notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: userNotifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông báo',
      error: error.message
    });
  }
});

// PUT /api/notifications/:notificationId/read - Mark notification as read
app.put('/api/notifications/:notificationId/read', (req, res) => {
  try {
    const { notificationId } = req.params;
    const notifications = readNotifications();
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);

    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    notifications[notificationIndex].isRead = true;
    writeNotifications(notifications);

    res.json({
      success: true,
      message: 'Đã đánh dấu thông báo đã đọc',
      data: notifications[notificationIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông báo',
      error: error.message
    });
  }
});

// PUT /api/notifications/:userId/read-all - Mark all notifications as read
app.put('/api/notifications/:userId/read-all', (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = readNotifications();
    
    notifications.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });

    writeNotifications(notifications);

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo đã đọc'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông báo',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:notificationId - Delete a notification
app.delete('/api/notifications/:notificationId', (req, res) => {
  try {
    const { notificationId } = req.params;
    let notifications = readNotifications();
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);

    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    notifications = notifications.filter(n => n.id !== notificationId);
    writeNotifications(notifications);

    res.json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa thông báo',
      error: error.message
    });
  }
});

// POST /api/notifications - Create a new notification (internal use)
app.post('/api/notifications', (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;
    
    const notifications = readNotifications();
    const newNotification = {
      id: Date.now().toString(),
      userId,
      type,
      title,
      message,
      link,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    notifications.push(newNotification);
    writeNotifications(notifications);

    res.json({
      success: true,
      message: 'Đã tạo thông báo',
      data: newNotification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo thông báo',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});

