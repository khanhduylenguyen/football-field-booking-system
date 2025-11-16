import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Building2, 
  DollarSign, 
  Star,
  TrendingUp
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  users: {
    total: number;
    players: number;
    owners: number;
    admins: number;
    active: number;
    inactive: number;
  };
  pitches: {
    total: number;
    active: number;
    pending: number;
    locked: number;
  };
  bookings: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
  };
  topPitches: Array<{
    id: string;
    name: string;
    bookingCount: number;
  }>;
  averageRating: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Không thể tải dữ liệu');
        console.error('API returned error:', data.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể kết nối đến server';
      setError(errorMessage);
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-500 text-lg font-semibold">Không thể tải dữ liệu</div>
        {error && (
          <div className="text-gray-500 text-sm">{error}</div>
        )}
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Data for charts
  const userRoleData = [
    { name: 'Người chơi', value: stats.users.players, color: '#2ecc71' },
    { name: 'Chủ sân', value: stats.users.owners, color: '#3498db' },
    { name: 'Admin', value: stats.users.admins, color: '#e74c3c' },
  ];

  const pitchStatusData = [
    { name: 'Hoạt động', value: stats.pitches.active, color: '#2ecc71' },
    { name: 'Chờ duyệt', value: stats.pitches.pending, color: '#f39c12' },
    { name: 'Bị khóa', value: stats.pitches.locked, color: '#e74c3c' },
  ];

  const revenueData = [
    { period: 'Hôm nay', amount: stats.revenue.today },
    { period: 'Tháng này', amount: stats.revenue.thisMonth },
    { period: 'Tổng', amount: stats.revenue.total },
  ];

  const bookingData = [
    { period: 'Hôm nay', count: stats.bookings.today },
    { period: 'Tuần này', count: stats.bookings.thisWeek },
    { period: 'Tháng này', count: stats.bookings.thisMonth },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tổng quan hệ thống</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Thống kê và phân tích toàn bộ hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tổng số người dùng */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.active} hoạt động, {stats.users.inactive} bị khóa
            </p>
          </CardContent>
        </Card>

        {/* Số lượng sân bóng */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số lượng sân bóng</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pitches.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pitches.active} hoạt động, {stats.pitches.pending} chờ duyệt
            </p>
          </CardContent>
        </Card>

        {/* Doanh thu */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Tháng này: {formatCurrency(stats.revenue.thisMonth)}
            </p>
          </CardContent>
        </Card>

        {/* Đánh giá trung bình */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đánh giá trung bình</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground fill-yellow-400 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Điểm trung bình toàn hệ thống</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Biểu đồ tròn - Phân loại người dùng */}
        <Card>
          <CardHeader>
            <CardTitle>Phân loại người dùng</CardTitle>
            <CardDescription>Người chơi / Chủ sân / Admin</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ players: { label: 'Người chơi', color: '#2ecc71' }, owners: { label: 'Chủ sân', color: '#3498db' }, admins: { label: 'Admin', color: '#e74c3c' } }}>
              <PieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ cột - Trạng thái sân bóng */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái sân bóng</CardTitle>
            <CardDescription>Số sân hoạt động, chờ duyệt, bị khóa</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ active: { label: 'Hoạt động', color: '#2ecc71' }, pending: { label: 'Chờ duyệt', color: '#f39c12' }, locked: { label: 'Bị khóa', color: '#e74c3c' } }}>
              <BarChart data={pitchStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#2ecc71" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Biểu đồ đường - Doanh thu */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu</CardTitle>
            <CardDescription>Theo ngày / tháng / năm</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ amount: { label: 'Doanh thu', color: '#2ecc71' } }}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line type="monotone" dataKey="amount" stroke="#2ecc71" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ khu vực - Số lượt đặt sân */}
        <Card>
          <CardHeader>
            <CardTitle>Số lượt đặt sân</CardTitle>
            <CardDescription>Hôm nay / Tuần này / Tháng này</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: 'Số lượt đặt', color: '#3498db' } }}>
              <AreaChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="count" stroke="#3498db" fill="#3498db" fillOpacity={0.6} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Sân được đặt nhiều nhất */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 sân được đặt nhiều nhất</CardTitle>
          <CardDescription>Danh sách các sân có số lượt đặt cao nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Tên sân</TableHead>
                <TableHead>Số lượt đặt</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topPitches.length > 0 ? (
                stats.topPitches.map((pitch, index) => (
                  <TableRow key={pitch.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{pitch.name}</TableCell>
                    <TableCell>{pitch.bookingCount} lượt</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Hoạt động
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Chưa có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

