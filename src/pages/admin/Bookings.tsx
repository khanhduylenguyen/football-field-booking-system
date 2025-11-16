import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, X, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface Booking {
  id: string;
  fieldId: string;
  fieldName: string;
  date: string;
  timeSlot: string;
  name: string;
  phone: string;
  price: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page, q, dateFrom, dateTo]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '10');
      if (q.trim()) params.set('q', q.trim());
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const response = await fetch(`/api/admin/bookings?${params.toString()}`);
      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Server không trả JSON hợp lệ');
      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
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
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Server không trả JSON hợp lệ');
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: data.message,
        });
        fetchBookings();
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

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(bookings.map(b => b.id));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => (checked ? [...new Set([...prev, id])] : prev.filter(x => x !== id)));
  };

  const handleBulkStatus = async (status: 'pending' | 'confirmed' | 'cancelled') => {
    if (selectedIds.length === 0) {
      toast({ title: 'Cảnh báo', description: 'Vui lòng chọn ít nhất một đơn', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/admin/bookings/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: selectedIds, status }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Server không trả JSON hợp lệ');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Không thể cập nhật trạng thái');
      toast({ title: 'Thành công', description: data.message });
      setSelectedIds([]);
      fetchBookings();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message || 'Không thể cập nhật trạng thái', variant: 'destructive' });
    }
  };

  const exportCSV = () => {
    const headers = ['ID','Tên','SĐT','Sân','Ngày','Khung giờ','Giá','Trạng thái','Tạo lúc'];
    const rows = bookings.map(b => [b.id, b.name, b.phone, b.fieldName, b.date, b.timeSlot, b.price, b.status, b.createdAt]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchBookings();
    }, 10000);
    return () => clearInterval(id);
  }, [autoRefresh, statusFilter, q, dateFrom, dateTo, page]);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Chờ duyệt</Badge>,
      confirmed: <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Đã xác nhận</Badge>,
      cancelled: <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Đã hủy</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý đơn đặt sân</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Xem và quản lý tất cả đơn đặt sân</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn đặt sân</CardTitle>
          <CardDescription>Quản lý tất cả đơn đặt sân trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <Input placeholder="Tìm kiếm (tên/SĐT/tên sân)" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            </div>
            <div>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2"/>Xuất CSV</Button>
              <Button variant={autoRefresh ? 'default' : 'outline'} onClick={() => setAutoRefresh(v => !v)}>
                <RefreshCw className="w-4 h-4 mr-2"/>{autoRefresh ? 'Tự làm mới: Bật' : 'Tự làm mới'}
              </Button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Đã chọn {selectedIds.length} đơn:</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('confirmed')}>Xác nhận</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatus('cancelled')}>Hủy</Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Bỏ chọn</Button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.length > 0 && selectedIds.length === bookings.length}
                        onCheckedChange={(c) => toggleSelectAll(c === true)}
                      />
                    </TableHead>
                    <TableHead>Người đặt</TableHead>
                    <TableHead>Số điện thoại</TableHead>
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
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(booking.id)}
                            onCheckedChange={(c) => toggleSelectOne(booking.id, c === true)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{booking.name}</TableCell>
                        <TableCell>{booking.phone}</TableCell>
                        <TableCell>{booking.fieldName}</TableCell>
                        <TableCell>{booking.date}</TableCell>
                        <TableCell>{booking.timeSlot}</TableCell>
                        <TableCell>{booking.price}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Xác nhận
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Hủy
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Hủy đơn
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Không tìm thấy đơn đặt sân nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages}
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
    </div>
  );
};

