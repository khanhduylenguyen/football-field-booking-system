import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RevenueSummary {
  totalRevenue: number;
  ordersConfirmed: number;
  cancelRate: number;
  aov: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  orders: number;
}

interface PitchRevenue {
  pitchId: string;
  pitchName: string;
  revenue: number;
  orders: number;
  cancelled: number;
  cancelRate: number;
  aov: number;
}

interface TimeslotRevenue {
  timeSlot: string;
  revenue: number;
  orders: number;
  aov: number;
}

interface Trends {
  week: {
    revenue: number;
    revenueChange: number;
    orders: number;
    ordersChange: number;
  };
  month: {
    revenue: number;
    revenueChange: number;
    orders: number;
    ordersChange: number;
  };
  year: {
    revenue: number;
    revenueChange: number;
    orders: number;
    ordersChange: number;
  };
}

interface Pitch {
  id: string;
  name: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const OwnerRevenue = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [byPitch, setByPitch] = useState<PitchRevenue[]>([]);
  const [byTimeslot, setByTimeslot] = useState<TimeslotRevenue[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pitchId, setPitchId] = useState('all');
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');
  const { toast } = useToast();

  useEffect(() => {
    fetchPitches();
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo, pitchId, interval]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchData(), 15000);
    return () => clearInterval(id);
  }, [autoRefresh, dateFrom, dateTo, pitchId, interval]);

  const fetchPitches = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch('/api/owner/pitches?limit=100', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });
      
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await response.clone().text();
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          return;
        }
      }
      
      const data = await response.json();
      if (data.success) {
        setPitches(data.data);
      }
    } catch (error) {
      console.error('Error fetching pitches:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (pitchId !== 'all') params.set('pitchId', pitchId);
      params.set('interval', interval);

      const checkResponse = async (res: Response, endpointName: string) => {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const text = await res.clone().text();
          if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
            throw new Error(`Server không trả JSON hợp lệ cho ${endpointName}. Vui lòng khởi động lại server (npm run server)`);
          }
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} từ ${endpointName}`);
        }
        return res.json();
      };

      // Fetch từng endpoint riêng để xử lý lỗi tốt hơn
      try {
        const summaryRes = await fetch(`/api/owner/revenue/summary?${params.toString()}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const summaryData = await checkResponse(summaryRes, 'summary');
        if (summaryData?.success) setSummary(summaryData.data);
      } catch (error: any) {
        console.error('Error fetching summary:', error);
        if (error.message.includes('Server không trả JSON')) {
          toast({
            title: 'Lỗi kết nối',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }
      }

      try {
        const timeseriesRes = await fetch(`/api/owner/revenue/timeseries?${params.toString()}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const timeseriesData = await checkResponse(timeseriesRes, 'timeseries');
        if (timeseriesData?.success) setTimeSeries(timeseriesData.data);
      } catch (error: any) {
        console.error('Error fetching timeseries:', error);
      }

      try {
        const byPitchRes = await fetch(`/api/owner/revenue/by-pitch?${params.toString()}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const byPitchData = await checkResponse(byPitchRes, 'by-pitch');
        if (byPitchData?.success) setByPitch(byPitchData.data);
      } catch (error: any) {
        console.error('Error fetching by-pitch:', error);
      }

      try {
        const byTimeslotRes = await fetch(`/api/owner/revenue/by-timeslot?${params.toString()}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const byTimeslotData = await checkResponse(byTimeslotRes, 'by-timeslot');
        if (byTimeslotData?.success) setByTimeslot(byTimeslotData.data);
      } catch (error: any) {
        console.error('Error fetching by-timeslot:', error);
      }

      try {
        const trendsRes = await fetch('/api/owner/revenue/trends', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const trendsData = await checkResponse(trendsRes, 'trends');
        if (trendsData?.success) setTrends(trendsData.data);
      } catch (error: any) {
        console.error('Error fetching trends:', error);
      }
    } catch (error: any) {
      console.error('Error in fetchData:', error);
      if (!error.message?.includes('Server không trả JSON')) {
        toast({
          title: 'Lỗi',
          description: error?.message || 'Không thể tải dữ liệu doanh thu',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const headers = ['Loại', 'Giá trị'];
    const rows = [
      ['Tổng doanh thu', formatCurrency(summary?.totalRevenue || 0)],
      ['Đơn thành công', String(summary?.ordersConfirmed || 0)],
      ['Tỉ lệ hủy', `${summary?.cancelRate || 0}%`],
      ['Giá trị đơn TB', formatCurrency(summary?.aov || 0)],
      ['Doanh thu hôm nay', formatCurrency(summary?.revenueToday || 0)],
      ['Doanh thu tuần này', formatCurrency(summary?.revenueThisWeek || 0)],
      ['Doanh thu tháng này', formatCurrency(summary?.revenueThisMonth || 0)],
      ['Doanh thu năm này', formatCurrency(summary?.revenueThisYear || 0)],
    ];
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Thành công',
      description: 'Đã xuất báo cáo CSV',
    });
  };

  const exportTopPitches = () => {
    const headers = ['Sân', 'Doanh thu', 'Đơn', 'AOV', 'Tỉ lệ hủy'];
    const rows = byPitch.map(p => [
      p.pitchName,
      formatCurrency(p.revenue),
      String(p.orders),
      formatCurrency(p.aov),
      `${p.cancelRate}%`,
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top_pitches_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Thành công',
      description: 'Đã xuất file CSV',
    });
  };

  const formatDateLabel = (date: string) => {
    if (interval === 'month') {
      const [year, month] = date.split('-');
      return `${month}/${year}`;
    }
    if (interval === 'week') {
      return date;
    }
    const [year, month, day] = date.split('-');
    return `${day}/${month}`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thống kê doanh thu</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Phân tích và theo dõi doanh thu của bạn</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Lọc theo khoảng ngày, sân và khoảng thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Từ ngày"
            />
            <Input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Đến ngày"
            />
            <Select value={pitchId} onValueChange={setPitchId}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả sân" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sân</SelectItem>
                {pitches.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={interval} onValueChange={(v: 'day' | 'week' | 'month') => setInterval(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Khoảng thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Theo ngày</SelectItem>
                <SelectItem value="week">Theo tuần</SelectItem>
                <SelectItem value="month">Theo tháng</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                variant={autoRefresh ? 'default' : 'outline'} 
                onClick={() => setAutoRefresh(v => !v)}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Tự làm mới' : 'Tự làm mới'}
              </Button>
              <Button variant="outline" onClick={() => { setDateFrom(''); setDateTo(''); setPitchId('all'); }}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu hôm nay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary?.revenueToday || 0)}</div>
                {trends && (
                  <p className={`text-xs flex items-center gap-1 mt-1 ${getChangeColor(trends.week.revenueChange)}`}>
                    {getChangeIcon(trends.week.revenueChange)}
                    {trends.week.revenueChange > 0 ? '+' : ''}{trends.week.revenueChange}% so với tuần trước
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tuần này</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary?.revenueThisWeek || 0)}</div>
                {trends && (
                  <p className={`text-xs flex items-center gap-1 mt-1 ${getChangeColor(trends.week.revenueChange)}`}>
                    {getChangeIcon(trends.week.revenueChange)}
                    {trends.week.revenueChange > 0 ? '+' : ''}{trends.week.revenueChange}% so với tuần trước
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary?.revenueThisMonth || 0)}</div>
                {trends && (
                  <p className={`text-xs flex items-center gap-1 mt-1 ${getChangeColor(trends.month.revenueChange)}`}>
                    {getChangeIcon(trends.month.revenueChange)}
                    {trends.month.revenueChange > 0 ? '+' : ''}{trends.month.revenueChange}% so với tháng trước
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu năm này</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary?.revenueThisYear || 0)}</div>
                {trends && (
                  <p className={`text-xs flex items-center gap-1 mt-1 ${getChangeColor(trends.year.revenueChange)}`}>
                    {getChangeIcon(trends.year.revenueChange)}
                    {trends.year.revenueChange > 0 ? '+' : ''}{trends.year.revenueChange}% so với năm trước
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <CardDescription>Trong khoảng lọc</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Đơn thành công</CardTitle>
            <CardDescription>Đã xác nhận</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{formatNumber(summary?.ordersConfirmed || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tỉ lệ hủy</CardTitle>
            <CardDescription>% đơn bị hủy</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{summary?.cancelRate || 0}%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Giá trị đơn TB</CardTitle>
            <CardDescription>Average Order Value</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.aov || 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Biểu đồ doanh thu theo thời gian</CardTitle>
              <CardDescription>Xu hướng doanh thu và số đơn</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-80 w-full" />
          ) : timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDateLabel}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="left"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return formatCurrency(value);
                    return value;
                  }}
                  labelFormatter={(label) => `Ngày: ${formatDateLabel(label)}`}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Doanh thu"
                  dot={{ r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Số đơn"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground border rounded">
              Không có dữ liệu để hiển thị
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Pitches and Top Timeslots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pitches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top sân theo doanh thu</CardTitle>
                <CardDescription>Trong khoảng lọc</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportTopPitches}>
                <Download className="w-4 h-4 mr-2" />
                Xuất CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : byPitch.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sân</TableHead>
                    <TableHead>Doanh thu</TableHead>
                    <TableHead>Đơn</TableHead>
                    <TableHead>AOV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byPitch.slice(0, 10).map((p) => (
                    <TableRow key={p.pitchId}>
                      <TableCell className="font-medium">{p.pitchName}</TableCell>
                      <TableCell className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(p.revenue)}
                      </TableCell>
                      <TableCell>{formatNumber(p.orders)}</TableCell>
                      <TableCell>{formatCurrency(p.aov)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Timeslots */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top khung giờ phổ biến</CardTitle>
                <CardDescription>Theo số đơn đặt</CardDescription>
              </div>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : byTimeslot.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khung giờ</TableHead>
                    <TableHead>Doanh thu</TableHead>
                    <TableHead>Đơn</TableHead>
                    <TableHead>AOV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byTimeslot.slice(0, 10).map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{t.timeSlot}</TableCell>
                      <TableCell className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(t.revenue)}
                      </TableCell>
                      <TableCell>{formatNumber(t.orders)}</TableCell>
                      <TableCell>{formatCurrency(t.aov)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeslot Chart */}
      {byTimeslot.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ doanh thu theo khung giờ</CardTitle>
            <CardDescription>Phân bổ doanh thu theo các khung giờ</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byTimeslot.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timeSlot" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Doanh thu" />
                  <Bar dataKey="orders" fill="#82ca9d" name="Số đơn" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Report */}
      <Card>
        <CardHeader>
          <CardTitle>Xuất báo cáo</CardTitle>
          <CardDescription>Xuất dữ liệu thống kê ra file CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportReport} className="w-full md:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo tổng hợp CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
