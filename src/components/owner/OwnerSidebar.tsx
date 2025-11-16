import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  DollarSign,
  Settings,
  LogOut,
  Home,
  Tag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/owner/dashboard' },
  { icon: Building2, label: 'Sân của tôi', path: '/owner/pitches' },
  { icon: Calendar, label: 'Đơn đặt sân', path: '/owner/bookings' },
  { icon: DollarSign, label: 'Doanh thu', path: '/owner/revenue' },
  { icon: Tag, label: 'Tin tức & Khuyến mãi', path: '/owner/promotions' },
  { icon: Settings, label: 'Cấu hình', path: '/owner/settings' },
];

export const OwnerSidebar = () => {
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
        <h1 className="text-xl font-bold text-[#3498db]">Owner Panel</h1>
        <p className="text-sm text-gray-400 mt-1">Quản lý sân bóng</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3498db] flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'O'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Owner'}</p>
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
                      ? 'bg-[#3498db] text-white'
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

