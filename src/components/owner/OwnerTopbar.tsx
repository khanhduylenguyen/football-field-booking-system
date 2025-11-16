import { Search, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationDropdown } from '@/components/NotificationDropdown';

export const OwnerTopbar = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="search"
            placeholder="Tìm kiếm..."
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name || 'Owner'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Chủ sân</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#3498db] flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'O'}
          </div>
        </div>
      </div>
    </div>
  );
};

