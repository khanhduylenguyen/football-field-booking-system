import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface OwnerDashboardStats {
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
    revenue: number;
  }>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const OwnerDashboard = () => {
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch('/api/owner/dashboard/stats', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        } : {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setStats(data.data);
      } else {
        setError(data.message || 'Không thể tải dữ liệu');
        console.error('API returned error:', data.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Không thể kết nối đến server. Vui lòng kiểm tra server đã chạy chưa.';
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
  const pitchStatusData = [
    { name: 'Hoạt động', value: stats?.pitches?.active || 0, color: '#2ecc71' },
    { name: 'Chờ duyệt', value: stats?.pitches?.pending || 0, color: '#f39c12' },
    { name: 'Bị khóa', value: stats?.pitches?.locked || 0, color: '#e74c3c' },
  ];

  const bookingStatusData = [
    { name: 'Đã xác nhận', value: stats?.bookings?.confirmed || 0, color: '#2ecc71' },
    { name: 'Chờ xử lý', value: stats?.bookings?.pending || 0, color: '#f39c12' },
    { name: 'Đã hủy', value: stats?.bookings?.cancelled || 0, color: '#e74c3c' },
  ];

  const revenueData = [
    { period: 'Hôm nay', amount: stats?.revenue?.today || 0 },
    { period: 'Tháng này', amount: stats?.revenue?.thisMonth || 0 },
    { period: 'Tổng', amount: stats?.revenue?.total || 0 },
  ];

  const bookingData = [
    { period: 'Hôm nay', count: stats?.bookings?.today || 0 },
    { period: 'Tuần này', count: stats?.bookings?.thisWeek || 0 },
    { period: 'Tháng này', count: stats?.bookings?.thisMonth || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Thống kê và phân tích sân bóng của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tổng số sân */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số sân</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pitches?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pitches?.active || 0} hoạt động, {stats?.pitches?.pending || 0} chờ duyệt
            </p>
          </CardContent>
        </Card>

        {/* Tổng đơn đặt */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn đặt</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bookings?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.bookings?.confirmed || 0} đã xác nhận, {stats?.bookings?.pending || 0} chờ xử lý
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
            <div className="text-2xl font-bold">{formatCurrency(stats?.revenue?.total || 0)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Tháng này: {formatCurrency(stats?.revenue?.thisMonth || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Đơn hôm nay */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn hôm nay</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bookings?.today || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.bookings?.thisWeek || 0} đơn tuần này
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
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
                <Bar dataKey="value" fill="#3498db" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ cột - Trạng thái đơn đặt */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái đơn đặt</CardTitle>
            <CardDescription>Đã xác nhận / Chờ xử lý / Đã hủy</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ confirmed: { label: 'Đã xác nhận', color: '#2ecc71' }, pending: { label: 'Chờ xử lý', color: '#f39c12' }, cancelled: { label: 'Đã hủy', color: '#e74c3c' } }}>
              <BarChart data={bookingStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#3498db" />
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
            <CardDescription>Theo ngày / tháng / tổng</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ amount: { label: 'Doanh thu', color: '#3498db' } }}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line type="monotone" dataKey="amount" stroke="#3498db" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ đường - Số lượt đặt sân */}
        <Card>
          <CardHeader>
            <CardTitle>Số lượt đặt sân</CardTitle>
            <CardDescription>Hôm nay / Tuần này / Tháng này</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: 'Số lượt đặt', color: '#3498db' } }}>
              <LineChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="#3498db" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Sân được đặt nhiều nhất */}
      <Card>
        <CardHeader>
          <CardTitle>Top sân được đặt nhiều nhất</CardTitle>
          <CardDescription>Danh sách các sân có số lượt đặt cao nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Tên sân</TableHead>
                <TableHead>Số lượt đặt</TableHead>
                <TableHead>Doanh thu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.topPitches && stats.topPitches.length > 0 ? (
                stats.topPitches.map((pitch, index) => (
                  <TableRow key={pitch.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{pitch.name}</TableCell>
                    <TableCell>{pitch.bookingCount} lượt</TableCell>
                    <TableCell>{formatCurrency(pitch.revenue || 0)}</TableCell>
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

