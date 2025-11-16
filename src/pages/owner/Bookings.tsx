import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Check, 
  X, 
  Download, 
  RefreshCw, 
  Eye, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  MapPin,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Booking {
  id: string;
  fieldId: string;
  fieldName: string;
  date: string;
  dateISO?: string;
  timeSlot: string;
  name: string;
  phone: string;
  price: string;
  priceValue?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  confirmedAt?: string;
}

interface BookingStats {
  total: number;
  today: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
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

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const OwnerBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pitchFilter, setPitchFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchPitches();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, pitchFilter, page, q, dateFrom, dateTo]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchBookings();
      fetchStats();
    }, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, statusFilter, pitchFilter, q, dateFrom, dateTo, page]);

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

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch('/api/owner/bookings/stats', {
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
        setStats(data.data);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');
      if (q.trim()) params.set('q', q.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (pitchFilter !== 'all') params.set('pitchId', pitchFilter);
      
      const response = await fetch(`/api/owner/bookings?${params.toString()}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });
      
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await response.clone().text();
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          toast({
            title: 'Lỗi Proxy',
            description: 'Vite dev server không thể kết nối đến backend. Vui lòng khởi động lại Vite dev server (npm run dev)',
            variant: 'destructive',
          });
          return;
        }
      }
      
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast({
          title: 'Lỗi',
          description: data.message || 'Không thể tải danh sách đơn đặt sân',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể tải danh sách đơn đặt sân',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`/api/owner/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server không trả JSON hợp lệ');
      }
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: data.message,
        });
        fetchBookings();
        fetchStats();
        setConfirmDialogOpen(false);
        setCancelDialogOpen(false);
        setActionBooking(null);
      } else {
        toast({
          title: 'Lỗi',
          description: data.message || 'Không thể cập nhật trạng thái',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error?.message || 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Tên khách hàng', 'SĐT', 'Sân', 'Ngày', 'Khung giờ', 'Giá', 'Trạng thái', 'Ngày tạo'];
    const rows = bookings.map(b => [
      b.id,
      b.name,
      b.phone,
      b.fieldName,
      b.date,
      b.timeSlot,
      b.price,
      b.status === 'pending' ? 'Chờ duyệt' : b.status === 'confirmed' ? 'Đã xác nhận' : 'Đã hủy',
      formatDate(b.createdAt)
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Thành công',
      description: 'Đã xuất file CSV',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" />Chờ duyệt</Badge>,
      confirmed: <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" />Đã xác nhận</Badge>,
      cancelled: <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1 w-fit"><X className="w-3 h-3" />Đã hủy</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const openDetailDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  const openConfirmDialog = (booking: Booking) => {
    setActionBooking(booking);
    setConfirmDialogOpen(true);
  };

  const openCancelDialog = (booking: Booking) => {
    setActionBooking(booking);
    setCancelDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý đơn đặt sân</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Xem và quản lý tất cả đơn đặt sân của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Đơn hôm nay: {stats?.today || 0}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã xác nhận</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.revenue?.total || 0)}</div>
                <p className="text-xs text-muted-foreground">Hôm nay: {formatCurrency(stats?.revenue?.today || 0)}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn đặt sân</CardTitle>
          <CardDescription>Quản lý và xử lý đơn đặt sân</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <Input 
                placeholder="Tìm kiếm (tên/SĐT/tên sân)" 
                value={q} 
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                className="w-full"
              />
            </div>
            <div>
              <Input 
                type="date" 
                value={dateFrom} 
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                placeholder="Từ ngày"
              />
            </div>
            <div>
              <Input 
                type="date" 
                value={dateTo} 
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                placeholder="Đến ngày"
              />
            </div>
            <div>
              <Select value={pitchFilter} onValueChange={(v) => { setPitchFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả sân" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả sân</SelectItem>
                  {pitches.map(pitch => (
                    <SelectItem key={pitch.id} value={pitch.id}>{pitch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCSV} disabled={bookings.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Xuất CSV
              </Button>
              <Button 
                variant={autoRefresh ? 'default' : 'outline'} 
                onClick={() => setAutoRefresh(v => !v)}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Tự làm mới: Bật' : 'Tự làm mới'}
              </Button>
            </div>
            <Button variant="outline" onClick={() => { fetchBookings(); fetchStats(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>SĐT</TableHead>
                      <TableHead>Sân</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Khung giờ</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length > 0 ? (
                      bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.name}</TableCell>
                          <TableCell>{booking.phone}</TableCell>
                          <TableCell>{booking.fieldName}</TableCell>
                          <TableCell>{booking.date}</TableCell>
                          <TableCell>{booking.timeSlot}</TableCell>
                          <TableCell className="font-medium">{booking.price}</TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetailDialog(booking)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openConfirmDialog(booking)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Xác nhận
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openCancelDialog(booking)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Hủy
                                  </Button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openCancelDialog(booking)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Hủy đơn
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Không tìm thấy đơn đặt sân nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages} ({bookings.length} đơn)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn đặt sân</DialogTitle>
            <DialogDescription>Thông tin chi tiết về đơn đặt sân</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Khách hàng:</span>
                    <span>{selectedBooking.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">SĐT:</span>
                    <span>{selectedBooking.phone}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Sân:</span>
                    <span>{selectedBooking.fieldName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Giá:</span>
                    <span className="font-bold text-green-600">{selectedBooking.price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Ngày:</span>
                  <span>{selectedBooking.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Khung giờ:</span>
                  <span>{selectedBooking.timeSlot}</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Trạng thái:</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>Ngày tạo: {formatDate(selectedBooking.createdAt)}</p>
                  {selectedBooking.confirmedAt && (
                    <p>Ngày xác nhận: {formatDate(selectedBooking.confirmedAt)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đơn đặt sân</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xác nhận đơn đặt sân này? Đơn sẽ được chuyển sang trạng thái "Đã xác nhận".
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionBooking && (
            <div className="py-4 text-sm space-y-1">
              <p><strong>Khách hàng:</strong> {actionBooking.name}</p>
              <p><strong>Sân:</strong> {actionBooking.fieldName}</p>
              <p><strong>Ngày:</strong> {actionBooking.date} - {actionBooking.timeSlot}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionBooking && handleUpdateStatus(actionBooking.id, 'confirmed')}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đơn đặt sân</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn đặt sân này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionBooking && (
            <div className="py-4 text-sm space-y-1">
              <p><strong>Khách hàng:</strong> {actionBooking.name}</p>
              <p><strong>Sân:</strong> {actionBooking.fieldName}</p>
              <p><strong>Ngày:</strong> {actionBooking.date} - {actionBooking.timeSlot}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionBooking && handleUpdateStatus(actionBooking.id, 'cancelled')}
              className="bg-red-600 hover:bg-red-700"
            >
              Hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
