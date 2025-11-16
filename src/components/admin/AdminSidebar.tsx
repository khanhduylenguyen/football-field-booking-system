import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Calendar, 
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  Home,
  Tag,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin' },
  { icon: Users, label: 'Người dùng', path: '/admin/users' },
  { icon: Building2, label: 'Sân bóng', path: '/admin/pitches' },
  { icon: Calendar, label: 'Đơn đặt sân', path: '/admin/bookings' },
  { icon: DollarSign, label: 'Doanh thu', path: '/admin/revenue' },
  { icon: Tag, label: 'Tin tức & Khuyến mãi', path: '/admin/promotions' },
  { icon: Star, label: 'Đánh giá', path: '/admin/reviews' },
  { icon: MessageSquare, label: 'Phản hồi', path: '/admin/feedback' },
  { icon: Settings, label: 'Cấu hình', path: '/admin/settings' },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="h-screen w-64 bg-[#2c3e50] text-white flex flex-col fixed left-0 top-0">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-[#2ecc71]">Admin Panel</h1>
        <p className="text-sm text-gray-400 mt-1">Quản trị hệ thống</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2ecc71] flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-[#2ecc71] text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Về trang chủ</span>
        </Link>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
};

