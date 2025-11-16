import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, History, Moon, Sun, LogIn, LogOut, User, Menu, LayoutDashboard } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
              <CalendarDays className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              BookField
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <Link to="/fields" className="text-foreground hover:text-primary transition-colors">
              Danh sách sân
            </Link>
            <Link to="/fields" className="text-foreground hover:text-primary transition-colors">
              Lịch trống
            </Link>
            <Link to="/fields" className="text-foreground hover:text-primary transition-colors">
              Đặt sân
            </Link>
            <Link to="/promotions" className="text-foreground hover:text-primary transition-colors">
              Tin tức / Khuyến mãi
            </Link>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">
              Liên hệ
            </a>
            {isAuthenticated && (
              <Link to="/my-bookings" className="text-foreground hover:text-primary transition-colors flex items-center gap-2">
                <History className="w-4 h-4" />
                Lịch đặt
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-foreground hover:text-primary transition-colors py-2">
                  Trang chủ
                </Link>
                <Link to="/fields" className="text-foreground hover:text-primary transition-colors py-2">
                  Danh sách sân
                </Link>
                <Link to="/fields" className="text-foreground hover:text-primary transition-colors py-2">
                  Lịch trống
                </Link>
                <Link to="/fields" className="text-foreground hover:text-primary transition-colors py-2">
                  Đặt sân
                </Link>
                <Link to="/promotions" className="text-foreground hover:text-primary transition-colors py-2">
                  Tin tức / Khuyến mãi
                </Link>
                <a href="#contact" className="text-foreground hover:text-primary transition-colors py-2">
                  Liên hệ
                </a>
                {isAuthenticated ? (
                  <>
                    {user && (user.role === 'admin' || user.role === 'owner') && (
                      <Link to="/admin" className="text-foreground hover:text-primary transition-colors py-2 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    )}
                    <Link to="/my-bookings" className="text-foreground hover:text-primary transition-colors py-2 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Lịch đặt của tôi
                    </Link>
                    <Link to="/account" className="text-foreground hover:text-primary transition-colors py-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Thông tin tài khoản
                    </Link>
                    <Button onClick={handleLogout} variant="destructive" className="mt-4">
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-foreground hover:text-primary transition-colors py-2 flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Đăng nhập
                    </Link>
                    <Link to="/register">
                      <Button className="w-full mt-2">Đăng ký</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-4">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-muted"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            )}
            
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      {user.avatar && (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      )}
                      <AvatarFallback className="bg-gradient-hero text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {user.role === 'player' ? 'Người chơi' : user.role === 'owner' ? 'Chủ sân' : 'Quản trị viên'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(user.role === 'admin' || user.role === 'owner') && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="cursor-pointer">
                      <History className="mr-2 h-4 w-4" />
                      <span>Lịch đặt của tôi</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Thông tin tài khoản</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="hidden md:flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/fields">
                  <Button className="shadow-medium hover:shadow-glow transition-all">
                    Đặt sân ngay
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
